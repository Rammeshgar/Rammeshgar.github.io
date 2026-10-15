// An editorial overview of the reviewed public source, not an import graph.
export const revision='6c3fe6778aee948a4ed8fb3cba72c56d3c0ff8d0';
export const repository='https://github.com/Rammeshgar/Exchange_Universe_shiny';
export const components=[
 {id:'dashboard',name:'Your dashboard',tag:'BROWSER',x:40,y:72,w:184,h:96,sub:'Choose, compare, explore',
  purpose:'The part you use: choose currencies, click countries, inspect charts and convert amounts.',
  decision:'The browser handles interaction and draws the chart and map widgets. It does not call the rate provider with your API key.',
  connection:'Your choices go to the Shiny session; updated views come back to the browser.',
  sources:[['R/ui.R','make_ui <- function'],['www/app.js','']],story:'compare',part:'cache'},
 {id:'session',name:'Shiny session',tag:'COORDINATE',x:292,y:72,w:184,h:96,sub:'Connect choices to data',
  purpose:'Connects a visitor’s selected currencies and dates to the data and outputs they need.',
  decision:'The rate store is created outside the session function, so sessions in this R process reuse it. Separate hosting instances do not share that memory.',
  connection:'Reads saved observations, prepares comparisons and asks the request controls for missing data.',
  sources:[['app.R','server <- function'],['app.R','store <- new_exchange_store']],story:'compare',part:'cache'},
 {id:'charts',name:'Calculations & charts',tag:'PRESENT',x:544,y:72,w:184,h:96,sub:'Turn observations into views',
  purpose:'Calculates cross-rates, aligns daily comparisons and builds the interactive chart widgets.',
  decision:'Compared currencies share observed start and end dates. Missing data stays missing; the interface does not invent an observation.',
  connection:'R prepares the values and widget configuration. ECharts, Plotly and other browser widgets display the results.',
  sources:[['R/analytics.R','prepare_comparison <- function'],['R/charts.R','line_chart <- function']],story:'compare',part:'cache'},
 {id:'cache',name:'Saved observations',tag:'REUSE',x:292,y:260,w:184,h:96,sub:'Keep data for the next view',
  purpose:'Keeps current rates, currency names and daily history available for reuse.',
  decision:'Memory and local RDS files avoid fetching the same data for every interaction. Shinyapps.io local disk is not a durable shared archive.',
  connection:'The app process collects completed worker results, then updates the store and writes local files. The worker does not write the cache directly.',
  sources:[['R/store.R','latest = safe_read_rds'],['R/store.R','save_result <- function']],story:'compare',part:'cache'},
 {id:'queue',name:'Request controls',tag:'PROTECT',x:544,y:260,w:184,h:96,sub:'Check, deduplicate, wait',
  purpose:'Checks whether another rate request is needed and can start. Repeated requests wait so the app avoids wasting its API allowance.',
  decision:'Backoff, recent-attempt spacing, deduplication and queue bounds reduce unnecessary requests. These limits belong to this process, not a distributed global limiter.',
  connection:'Accepted work waits for the single background worker. Visitors can still see available saved rates while work is blocked.',
  sources:[['R/store.R','enqueue <- function'],['R/store.R','refresh <- function']],story:'wait',part:'gate'},
 {id:'provider',name:'External rate source',tag:'APILAYER',x:292,y:448,w:184,h:96,sub:'Supply rate observations',
  purpose:'APILayer supplies current exchange rates, currency names and daily historical observations.',
  decision:'Coverage, freshness and endpoint access depend on the API subscription. A request is not a currency trade or a guarantee of a fresh market quote.',
  connection:'Only the server-side worker makes these HTTPS calls. Authentication stays on the server.',
  sources:[['R/provider.R','provider_transport <- function'],['R/provider.R','fetch_latest <- function']],story:'refresh',part:'worker'},
 {id:'worker',name:'Background worker',tag:'FETCH',x:544,y:448,w:184,h:96,sub:'Run one provider task',
  purpose:'Runs one current-rate, currency-name or history task in a separate R process.',
  decision:'callr keeps provider work separate from the interactive app process. Responses are validated; the parent store collects results and handles failures.',
  connection:'Calls APILayer, then returns a result to the store. The saved-data arrow abbreviates that parent-process collection step.',
  sources:[['R/store.R','state$process <- callr::r_bg'],['R/provider.R','run_provider_job <- function']],story:'refresh',part:'worker'}
];
export const edges=[
 {id:'choices',from:'dashboard',to:'session',d:'M224 120 H292',label:'CHOICES',lx:258,ly:96},
 {id:'views',from:'session',to:'charts',d:'M476 120 H544',label:'VIEWS',lx:510,ly:96},
 {id:'read',from:'session',to:'cache',d:'M352 168 V260',label:'READ',lx:376,ly:210},
 {id:'request',from:'session',to:'queue',d:'M476 144 H492 Q500 144 500 152 V212 Q500 220 508 220 H628 Q636 220 636 228 V260',label:'IF NEEDED',lx:568,ly:196},
 {id:'approved',from:'queue',to:'worker',d:'M668 356 V448',label:'APPROVED',lx:702,ly:402},
 {id:'https',from:'worker',to:'provider',d:'M544 512 H476',label:'HTTPS',lx:510,ly:488,external:true},
 {id:'result',from:'worker',to:'cache',d:'M544 480 H524 Q516 480 516 472 V316 Q516 308 508 308 H476',label:'RESULT',lx:544,ly:398,returned:true}
];

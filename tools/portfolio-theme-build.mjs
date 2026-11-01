/* Attach only to maintained interactive pages; static exports stay self-contained. */
export function withTheme(html,{prefix='../assets/'}={}){
 const themed=html.includes('portfolio-theme.js');
 html=html.replace(/(<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*content=")([^"]+)(")/gi,(_all,start,policy,end)=>start+policy.split(';').map(d=>{
  const directive=d.trim();
  if(/^(script-src|style-src)\s/.test(directive)&&!directive.includes("'self'"))return directive.replace(/^(script-src|style-src)/,"$1 'self'");
  return directive;
 }).filter(Boolean).join('; ')+end);
 if(!themed)html=html.replace(/<head(?:\s[^>]*)?>/i,match=>match+`<script src="${prefix}portfolio-theme.js"></script>`)
  .replace('</head>',`<link rel="stylesheet" href="${prefix}portfolio-theme.css"></head>`);
 if(/<path\b[^>]*data-(?:edge|from)=/.test(html)&&!html.includes('map-motion.js'))html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}map-motion.css"><script src="${prefix}map-motion.js" defer></script></head>`);
 return html;
}

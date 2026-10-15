/* Attach only to maintained interactive pages; static exports stay self-contained. */
export function withTheme(html,{prefix='../assets/'}={}){
 if(html.includes('portfolio-theme.js'))return html;
 html=html.replace(/(<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*content=")([^"]+)(")/gi,(_all,start,policy,end)=>start+policy.split(';').map(d=>{
  const directive=d.trim();
  if(/^(script-src|style-src)\s/.test(directive)&&!directive.includes("'self'"))return directive.replace(/^(script-src|style-src)/,"$1 'self'");
  return directive;
 }).filter(Boolean).join('; ')+end);
 return html.replace(/<head(?:\s[^>]*)?>/i,match=>match+`<script src="${prefix}portfolio-theme.js"></script>`)
  .replace('</head>',`<link rel="stylesheet" href="${prefix}portfolio-theme.css"></head>`);
}

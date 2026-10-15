import{readFileSync,writeFileSync,mkdirSync,copyFileSync}from'node:fs';
import{withTheme}from'./portfolio-theme-build.mjs';
import{dirname,join}from'node:path';import{fileURLToPath}from'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..'),out=join(root,'../Digital-Twin-Case-Integration/source'),preview=join(root,'digital-twin-demo');
const read=p=>readFileSync(join(root,p),'utf8');
const original=read('tools/vendor/twin-case.original.html'),local=read('tools/vendor/twin-case.notes.html');
const tools=local.slice(local.indexOf('<section class="explainer'),local.indexOf('<section class="evidence-section')).replaceAll('src="system-map.html','src="explainers/system-map.html').replaceAll('href="system-map.html','href="explainers/system-map.html').replaceAll('data-src="guide.html','data-src="explainers/guide.html').replaceAll('href="guide.html','href="explainers/guide.html');
if(!tools.includes('id="system-map"')||!tools.includes('id="animated-guide"'))throw Error('Missing portable tools');
const notes=['case-contribution','case-evidence','boundaries'].map(name=>local.match(new RegExp('<section class="'+name+'[^>]*>[\\s\\S]*?</section>'))?.[0]||'').join('\n');
let canonical=original.replace('<link rel="stylesheet" href="style.css">','<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="explainers/case-tools.css"><script src="explainers/case-study.js" defer></script>')
 .replace('<a href="#evidence">Evidence</a>','<a href="#inside">How it works</a><a href="#evidence">Evidence</a>')
 .replace('    <section class="evidence" id="evidence">',tools+'\n    <section class="evidence" id="evidence">')
 .replace('<h2>Input becomes a coordinated performance.</h2>','<h2>Technical workflow: from input to animation.</h2>')
 .replace('  </main>','<section id="integration-notes" aria-label="Contribution, implementation and limits">'+notes+'</section>\n  </main>');
canonical=withTheme(canonical,{prefix:'explainers/'}).replace('<body>','<body data-case="digital-twin">');
mkdirSync(join(out,'explainers'),{recursive:true});mkdirSync(join(preview,'explainers'),{recursive:true});
writeFileSync(join(out,'index.html'),canonical);
for(const file of ['guide.html','guide-light.html','guide-dark.html','system-map.html','map-static.html','map-dark.html','map-editorial.html']){const content=read('digital-twin/'+file).replaceAll('href="./"','href="../#inside"').replaceAll('../assets/portfolio-theme.','portfolio-theme.');writeFileSync(join(out,'explainers',file),content);writeFileSync(join(preview,'explainers',file),content);}
for(const file of ['portfolio-theme.js','portfolio-theme.css'])for(const target of [out,preview])copyFileSync(join(root,'assets',file),join(target,'explainers',file));
copyFileSync(join(root,'tools/vendor/seneschal-anatomy/LICENSE'),join(out,'explainers/ANATOMY-LICENSE.txt'));copyFileSync(join(root,'tools/vendor/seneschal-anatomy/LICENSE'),join(preview,'explainers/ANATOMY-LICENSE.txt'));
copyFileSync(join(root,'digital-twin/case-study.js'),join(out,'explainers/case-study.js'));copyFileSync(join(root,'digital-twin/case-study.js'),join(preview,'explainers/case-study.js'));
copyFileSync(join(root,'tools/twin-case-tools.css'),join(out,'explainers/case-tools.css'));copyFileSync(join(root,'tools/twin-case-tools.css'),join(preview,'explainers/case-tools.css'));
// Local review reads existing public art/styles. It does not copy a model or launch a provider.
const base='https://rammeshgar.github.io/digital-twin-demo/';
let reviewed=canonical.replaceAll('src="assets/','src="'+base+'assets/').replace('href="style.css"','href="'+base+'style.css"').replace('href="favicon.ico"','href="'+base+'favicon.ico"').replace('src="mascot.js?','src="'+base+'mascot.js?');
reviewed=reviewed.replace(/<script async src="https:\/\/www.googletagmanager.com[\s\S]*?<\/script>/,'').replace(/<script>\s*window.dataLayer[\s\S]*?<\/script>/,'').replace(/<script>\s*\(function\(c,l,a,r,i,t,y\)[\s\S]*?<\/script>/,'').replace('</head>','<meta http-equiv="Content-Security-Policy" content="connect-src \'none\'; object-src \'none\'; base-uri \'none\'"></head>');
writeFileSync(join(preview,'index.html'),reviewed);
console.log('Prepared canonical Twin case in its own repository source tree; local preview uses existing public art/styles. No model or backend changed.');

// Reproducible local artwork. Requires sharp; no network or generated imagery.
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),sharp=require('sharp');
const asset=name=>new URL('../assets/'+name,import.meta.url);
const mark=readFileSync(asset('brand-mark.png')).toString('base64');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<title>Sadeq Rezai — Workflow automation, testing and AI integration</title>
<rect width="1200" height="630" fill="#f3efe6"/>
<rect x="34" y="34" width="1132" height="562" fill="none" stroke="#98563b" stroke-opacity=".26"/>
<path d="M790 34V596" stroke="#98563b" stroke-opacity=".26"/>
<image x="78" y="70" width="50" height="50" href="data:image/png;base64,${mark}"/>
<g fill="#2a302d" font-family="Arial,sans-serif">
<text x="148" y="96" font-size="29" font-weight="700">Sadeq Rezai</text>
<text x="149" y="119" font-size="12" letter-spacing="2.2">THE WORKING STUDIO</text>
<text x="78" y="212" font-size="59" font-weight="700" letter-spacing="-2">Workflow automation,</text>
<text x="78" y="294" font-size="69" font-weight="700" letter-spacing="-2">testing &amp;</text>
<text x="78" y="380" font-family="Georgia,serif" font-size="76" font-style="italic" letter-spacing="-2" fill="#98563b">AI integration.</text>
<text x="81" y="446" font-size="22" fill="#535b52">Software projects. Working demos. Public source.</text>
<path d="M78 494H740" stroke="#98563b" stroke-opacity=".26"/>
<text x="80" y="546" font-size="24">rammeshgar.github.io</text>
</g>
<rect x="823" y="68" width="308" height="492" fill="#252b27"/>
<g fill="none" stroke="#d8d1c4" stroke-width="2">
<path d="M906 194V238H1048V282M977 361V408"/>
<rect x="864" y="126" width="84" height="68" rx="4"/>
<rect x="1006" y="282" width="84" height="68" rx="4"/>
<rect x="935" y="408" width="84" height="68" rx="4"/>
<path d="M906 147V173M893 160H919M1025 305L1038 318L1069 300M956 441H998M977 420V462"/>
<path d="M1048 350V378H977M889 307H927M908 288V326" stroke-dasharray="4 5" opacity=".5"/>
</g>
<circle cx="977" cy="238" r="7" fill="#edb495"/>
<circle cx="977" cy="378" r="7" fill="#edb495"/>
<path d="M876 94H1078M876 530H1078" stroke="#d8d1c4" stroke-opacity=".35"/>
<text x="977" y="512" text-anchor="middle" fill="#d8d1c4" font-family="Arial,sans-serif" font-size="15" letter-spacing="2">BUILD / TEST / CONNECT</text>
</svg>`;
writeFileSync(asset('social-preview-20261101.svg'),svg);
const output=fileURLToPath(asset('social-preview-20261101.png'));
await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(output);
const metadata=await sharp(output).metadata();
if(metadata.width!==1200||metadata.height!==630)throw Error('Unexpected social-card dimensions');
console.log('Created 1200 × 630 local social preview.');


// A separate product card: real city artwork and companion from the public screenshot.
const source=readFileSync(asset('seneschal-beta20-workspace.png'));
const senMark=readFileSync(asset('seneschal-mark-192.png')).toString('base64');
const city=(await sharp(source).extract({left:104,top:150,width:398,height:590}).resize(420,488).png().toBuffer()).toString('base64');
const companion=(await sharp(source).extract({left:1485,top:109,width:291,height:375}).resize({width:234}).png().toBuffer()).toString('base64');
const senSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<title>Seneschal — Your private AI atelier</title>
<defs><clipPath id="scene"><rect x="662" y="54" width="492" height="522" rx="16"/></clipPath><clipPath id="companion"><rect x="887" y="120" width="234" height="302" rx="14"/></clipPath></defs>
<rect width="1200" height="630" fill="#171d1b"/>
<rect x="34" y="34" width="1132" height="562" rx="3" fill="none" stroke="#7b8978" stroke-opacity=".38"/>
<path d="M628 34V596" stroke="#7b8978" stroke-opacity=".25"/>
<image x="72" y="66" width="50" height="50" href="data:image/png;base64,${senMark}"/>
<g font-family="Arial,sans-serif" fill="#f2eadc">
<text x="141" y="89" font-size="21" font-weight="700">Sadeq Rezai</text>
<text x="141" y="111" font-size="11" letter-spacing="2.3" fill="#c4d0bb">SELECTED PROJECT</text>
<text x="72" y="228" font-family="Georgia,serif" font-size="85" letter-spacing="-3">Seneschal</text>
<text x="76" y="305" font-family="Georgia,serif" font-size="49" font-style="italic" fill="#edb495">Your private</text>
<text x="76" y="362" font-family="Georgia,serif" font-size="49" font-style="italic" fill="#edb495">AI atelier.</text>
<text x="77" y="435" font-size="23" fill="#d8d1c4">Models. Tools. Agent teams.</text>
<path d="M76 493H575" stroke="#7b8978" stroke-opacity=".4"/>
<text x="77" y="546" font-size="20" fill="#d8d1c4">rammeshgar.github.io/seneschal</text>
</g>
<rect x="662" y="54" width="492" height="522" rx="16" fill="#0f171b" stroke="#7b8978" stroke-opacity=".5"/>
<g clip-path="url(#scene)"><image x="674" y="76" width="420" height="488" href="data:image/png;base64,${city}"/></g>
<text x="690" y="95" font-family="Arial,sans-serif" font-size="12" letter-spacing="2" fill="#d8d1c4">YOUR WORKSPACE</text>
<rect x="882" y="125" width="244" height="307" rx="16" fill="#000" fill-opacity=".35"/>
<image x="887" y="120" width="234" height="302" clip-path="url(#companion)" href="data:image/png;base64,${companion}"/>
<rect x="887" y="120" width="234" height="302" rx="14" fill="none" stroke="#758172" stroke-opacity=".55"/>
<rect x="687" y="512" width="203" height="39" rx="19.5" fill="#171d1b" stroke="#7b8978" stroke-opacity=".55"/>
<text x="789" y="537" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#f2eadc">Windows + WSL</text>
</svg>`;
writeFileSync(asset('seneschal-social-preview-20261101.svg'),senSvg);
await sharp(Buffer.from(senSvg)).png({compressionLevel:9}).toFile(fileURLToPath(asset('seneschal-social-preview-20261101.png')));
console.log('Created a dedicated 1200 × 630 Seneschal product card from real public assets.');

// Reproducible local artwork. Requires sharp; no network or generated imagery.
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),sharp=require('sharp');
const asset=name=>new URL('../assets/'+name,import.meta.url);
const mark=readFileSync(asset('brand-mark.png')).toString('base64');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<title>Sadeq Rezai — Workflow automation, testing and AI integration</title>
<rect width="1200" height="630" fill="#eee9df"/>
<rect x="34" y="34" width="1132" height="562" fill="none" stroke="#142e2e" stroke-opacity=".26"/>
<path d="M790 34V596" stroke="#142e2e" stroke-opacity=".26"/>
<image x="78" y="70" width="50" height="50" href="data:image/png;base64,${mark}"/>
<g fill="#142e2e" font-family="Arial,sans-serif">
<text x="148" y="96" font-size="29" font-weight="700">Sadeq Rezai</text>
<text x="149" y="119" font-size="12" letter-spacing="2.2">THE WORKING STUDIO</text>
<text x="78" y="212" font-size="59" font-weight="700" letter-spacing="-2">Workflow automation,</text>
<text x="78" y="294" font-size="69" font-weight="700" letter-spacing="-2">testing &amp;</text>
<text x="78" y="380" font-family="Georgia,serif" font-size="76" font-style="italic" letter-spacing="-2" fill="#9b4a30">AI integration.</text>
<text x="81" y="446" font-size="22" fill="#53635d">Software projects. Working demos. Public source.</text>
<path d="M78 494H740" stroke="#142e2e" stroke-opacity=".26"/>
<text x="80" y="546" font-size="24">rammeshgar.github.io</text>
</g>
<rect x="823" y="68" width="308" height="492" fill="#142e2e"/>
<g fill="none" stroke="#c9d9cb" stroke-width="2">
<path d="M906 194V238H1048V282M977 361V408"/>
<rect x="864" y="126" width="84" height="68" rx="4"/>
<rect x="1006" y="282" width="84" height="68" rx="4"/>
<rect x="935" y="408" width="84" height="68" rx="4"/>
<path d="M906 147V173M893 160H919M1025 305L1038 318L1069 300M956 441H998M977 420V462"/>
<path d="M1048 350V378H977M889 307H927M908 288V326" stroke-dasharray="4 5" opacity=".5"/>
</g>
<circle cx="977" cy="238" r="7" fill="#dfbd97"/>
<circle cx="977" cy="378" r="7" fill="#dfbd97"/>
<path d="M876 94H1078M876 530H1078" stroke="#c9d9cb" stroke-opacity=".35"/>
<text x="977" y="512" text-anchor="middle" fill="#eee9df" font-family="Arial,sans-serif" font-size="15" letter-spacing="2">BUILD / TEST / CONNECT</text>
</svg>`;
writeFileSync(asset('social-preview-20261015.svg'),svg);
const output=fileURLToPath(asset('social-preview-20261015.png'));
await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(output);
const metadata=await sharp(output).metadata();
if(metadata.width!==1200||metadata.height!==630)throw Error('Unexpected social-card dimensions');
console.log('Created 1200 × 630 local social preview.');

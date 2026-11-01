// One readable palette source, bundled into the existing single shared stylesheet.
// No extra request, framework or runtime dependency. Run after editing palette-02.css.
import {readFileSync,writeFileSync} from 'node:fs';
const file=new URL('../assets/portfolio-theme.css',import.meta.url);
const marker='/* BEGIN PALETTE 02 */';
const base=readFileSync(file,'utf8').split(marker)[0].trimEnd();
const palette=readFileSync(new URL('../assets/palette-02.css',import.meta.url),'utf8');
const interactions=readFileSync(new URL('../assets/interaction-states.css',import.meta.url),'utf8');
writeFileSync(file,base+'\n\n'+marker+'\n'+palette+'\n'+interactions);
console.log('Bundled Balanced Studio into the shared theme.');

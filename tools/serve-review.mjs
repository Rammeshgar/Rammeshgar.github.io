// Read-only public-site preview, loopback only. Never serves Git metadata/tools.
import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {dirname,join,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=await realpath(join(dirname(fileURLToPath(import.meta.url)),'..'));
const port=Number(process.argv[2]||4897);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid preview port.');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.webm':'video/webm','.mp4':'video/mp4','.mp3':'audio/mpeg','.glb':'model/gltf-binary'};
const files=new Set(['index.html','production.css','production.mjs','hero-scroll-native.mjs','exchange-card-preview.mjs','case-studies.css','case-studies.js','mascot.js','hero-scroll.mjs','2 5 2021.mp3','intro-demo-scrub.mp4','intro-demo-mobile.mp4','intro-demo-poster.webp','poster.webp']);
const directories=['exchange-universe/','qa-suite/','seneschal/','digital-twin/','assets/','avatar/','frames/','hero-frames/','img/','fonts/','digital-twin-demo/'];
createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let name;try{name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).slice(1);if(!name||name.endsWith('/'))name+='index.html';}catch{res.writeHead(400);res.end();return;}
 if(name.split('/').some(s=>s.startsWith('.')||s.includes('\\'))||!(files.has(name)||directories.some(d=>name.startsWith(d)))||!mime[extname(name)]){res.writeHead(404);res.end('Not found');return;}
 try{
  const target=await realpath(join(root,name));if(!target.startsWith(root+sep))throw Error('Outside preview');
  const bytes=await readFile(target),headers={'Content-Type':mime[extname(name)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Length':bytes.length};
  const media=['.mp4','.webm','.mp3'].includes(extname(name));
  if(media)headers['Accept-Ranges']='bytes';
  // One byte range is enough for native media seeking. Reject malformed/multipart ranges.
  if(media&&req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);let start,end;
   if(match&&(match[1]||match[2])){
    start=match[1]?Number(match[1]):Math.max(0,bytes.length-Number(match[2]));
    end=match[1]?(match[2]?Math.min(Number(match[2]),bytes.length-1):bytes.length-1):bytes.length-1;
   }
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=bytes.length||end<start){res.writeHead(416,{...headers,'Content-Range':`bytes */${bytes.length}`,'Content-Length':0});res.end();return;}
   res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});res.end(req.method==='HEAD'?undefined:bytes.subarray(start,end+1));return;
  }
  res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:bytes);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Portfolio review: http://127.0.0.1:'+port+'/exchange-universe/'));

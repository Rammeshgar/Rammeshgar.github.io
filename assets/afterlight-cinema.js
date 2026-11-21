'use strict';
/* Afterlight cinema edition. Artwork, actors and effects are entirely local.
   The wallpaper host owns input, the render clock and the application state. */
(() => {
  const W=960,H=540,TAU=Math.PI*2;
  const trainPanes=[[33,125,261,222],[338,121,286,224],[653,122,261,220]];
  function clipTrainWindows(c){
    c.beginPath();
    for(const [x,y,w,h] of trainPanes)c.roundRect(x,y,w,h,19);
    c.clip();
  }
  const names=['train','lantern','cat','meteor','light','water'];
  const scenes={
    city:{kind:'canal',water:[0,350,715,190],horizon:244,light:[835,351,111,72],points:[[440,322],[712,280],[767,424],[380,98],[834,351],[430,455]]},
    observatory:{kind:'alpine',water:[0,300,636,214],horizon:295,light:[739,321,75,67],points:[[560,413],[399,353],[605,452],[298,111],[743,325],[333,419]]},
    sleeper:{kind:'train',horizon:340,light:[481,48,112,58],points:[[487,226],[575,413],[167,455],[747,226],[480,48],[781,362]]},
    pelagic:{kind:'ocean',horizon:70,light:[741,215,94,115],points:[[568,404],[450,364],[484,165],[700,345],[750,241],[298,414]]},
    sanctuary:{kind:'garden',water:[69,344,761,187],horizon:328,light:[786,318,86,63],points:[[474,303],[484,408],[550,466],[310,180],[766,311],[347,461]]},
    citylight:{kind:'avenue',road:[498,379,190],horizon:379,light:[746,241,64,108],points:[[479,424],[279,240],[793,472],[745,169],[753,252],[402,490]]},
    nocturne:{kind:'avenue',road:[534,340,211],horizon:340,light:[185,357,100,61],points:[[558,446],[118,392],[301,463],[492,213],[197,339],[597,485]]},
    lunar:{kind:'moon',horizon:346,light:[555,364,85,48],points:[[495,450],[601,285],[691,451],[255,269],[556,366],[347,471]]},
    foundry:{kind:'orbit',horizon:377,light:[715,381,111,62],points:[[359,318],[656,437],[790,474],[579,212],[714,376],[844,413]]}
  };
  const atmospheres={
    daylight:{mist:'#d8e7ce',glow:'#f9c376',cyan:'#94d9d1',rain:'#d8e9e6',shadow:'#142d39'},
    nocturne:{mist:'#88abbf',glow:'#ffc473',cyan:'#75d8e5',rain:'#91bed3',shadow:'#071725'},
    ember:{mist:'#c9a2ba',glow:'#ffbb76',cyan:'#b5ccc6',rain:'#c8b8d4',shadow:'#251a3c'},
    sakura:{mist:'#a1b1d8',glow:'#ffc0c7',cyan:'#9ad5ff',rain:'#a1bfe7',shadow:'#171735'}
  };
  const seed=Array.from({length:208},(_,i)=>[(i*163.637%960),i*137.567%540,(i*179%233)/232,(i*113%239)/238]);
  const mod=(n,d)=>((n%d)+d)%d;
  const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
  const smooth=(a,b,n)=>{const x=clamp((n-a)/(b-a));return x*x*(3-2*x);};
  const envelope=(n,d,edge=1)=>smooth(0,edge,n)*(1-smooth(d-edge,d,n));
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function rect(c,color,x,y,w=1,h=1){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
  function polygon(c,color,vertices){
    c.fillStyle=color;c.beginPath();
    vertices.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    c.closePath();c.fill();
  }
  function line(c,color,x,y,u,v,width=1){
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x)+.5,Math.round(y)+.5);
    c.lineTo(Math.round(u)+.5,Math.round(v)+.5);c.stroke();
  }
  function oval(c,color,x,y,rx,ry,fill){
    c.beginPath();c.ellipse(Math.round(x),Math.round(y),Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);
    if(fill){c.fillStyle=color;c.fill();}else{c.lineWidth=1;c.strokeStyle=color;c.stroke();}
  }
  function halation(color){
    const tile=canvas(96,96),c=tile.getContext('2d');
    const g=c.createRadialGradient(48,48,0,48,48,47);
    g.addColorStop(0,color+'ef');g.addColorStop(.12,color+'b8');
    g.addColorStop(.38,color+'3b');g.addColorStop(.65,color+'12');g.addColorStop(1,color+'00');
    c.fillStyle=g;c.fillRect(0,0,96,96);return tile;
  }
  function create(){
    let id='',stage=null,revision=0,plate=null,photo=null,grade='',elapsed=0,lastTime=null,lit=true,curtains=false,events=[],loadStatus='classic';
    const accents=new Map(),sprites=new Map();
    function glow(c,color,x,y,rx,ry,opacity){
      if(opacity<=0)return;
      if(!accents.has(color))accents.set(color,halation(color));
      const alpha=c.globalAlpha;c.globalAlpha=alpha*clamp(opacity);
      c.drawImage(accents.get(color),Math.round(x-rx),Math.round(y-ry),Math.round(rx*2),Math.round(ry*2));c.globalAlpha=alpha;
    }
    function select(next,onReady){
      if(id===next)return;
      id=next;stage=scenes[next];elapsed=0;lastTime=null;lit=true;curtains=false;events=[];
      plate=null;photo=null;grade='';
      if(!stage)return;
      loadStatus='loading';
      const generation=++revision,image=new Image();
      image.onload=()=>{if(revision===generation){plate=image;loadStatus='cinema';onReady();}};
      image.onerror=()=>{if(revision===generation){loadStatus='classic';onReady();}};
      image.src='/assets/cinema/'+next+'.webp';
    }
    function bake(palette){
      if(photo&&grade===palette)return;
      photo=photo||canvas(W,H);
      const c=photo.getContext('2d',{alpha:false});
      const height=plate.naturalHeight/2;
      c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
      c.filter=palette==='ember'?'sepia(0.20) saturate(1.10) brightness(1.19)':
        palette==='sakura'?'hue-rotate(17deg) saturate(0.81) brightness(1.12)':'none';
      c.drawImage(plate,0,palette==='daylight'?height:0,plate.naturalWidth,height,0,0,W,H);
      c.filter='none';grade=palette;
    }
    function makeSprite(kind,approaching){
      const tile=canvas(kind==='tram'?139:110,70),c=tile.getContext('2d');
      const w=tile.width;
      const labels={
        coupe:{body:'#749c9a',shade:'#244e59',trim:'#c5dec8'},
        taxi:{body:'#d69d52',shade:'#724126',trim:'#fce0a6'},
        tram:{body:'#a94740',shade:'#512c35',trim:'#e8be86'}
      };
      const a=labels[kind],roof=24;
      if(kind==='tram'){
        oval(c,'#101c25',w/2,63,w*.43,4,true);
        polygon(c,'#14242b',[[21,57],[23,17],[31,11],[108,11],[116,16],[119,57],[111,63],[28,63]]);
        polygon(c,a.shade,[[25,53],[27,19],[33,14],[105,14],[113,18],[116,55],[108,60],[30,60]]);
        polygon(c,a.body,[[26,54],[28,18],[34,15],[104,15],[111,19],[114,53],[104,56],[36,56]]);
        rect(c,'#231f27',38,17,64,6);rect(c,'#e6ae70',52,18,37,4);
        rect(c,'#172c36',34,25,72,21);rect(c,'#536b6b',36,27,68,16);
        polygon(c,'#88a499',[[38,28],[81,28],[54,35],[38,40]]);
        line(c,'#23363e',69,26,69,45,2);line(c,'#c48861',30,47,111,47);
        rect(c,'#ceb486',29,48,82,2);
        for(const x of [35,96]){
          rect(c,'#35242b',x,51,8,6);
          rect(c,approaching?'#ffe5b2':'#e07762',x+1,52,6,3);
        }
        rect(c,'#14252c',57,54,27,4);rect(c,'#66767a',58,56,25,1);
        rect(c,'#2d3943',64,60,12,4);
        line(c,'#7d8b83',59,12,43,5,2);line(c,'#a7b2a3',43,5,87,3,2);
        return tile;
      }
      oval(c,'#101823',w/2,60,w*.48,5,true);
      for(const x of [20,w-21]){
        oval(c,'#0c1520',x,54,10,12,true);
        oval(c,'#344856',x,54,5,6,true);
        rect(c,'#99a7a7',x-2,53,4,2);
        line(c,'#354348',x-4,56,x+3,56);
        rect(c,'#54616a',x-4,47,6,2);
      }
      polygon(c,'#142432',[[5,44],[13,36],[24,roof],[w-34,roof-3],[w-15,36],[w-5,43],[w-4,55],[w-13,60],[12,60],[3,53]]);
      polygon(c,a.shade,[[6,44],[16,37],[26,roof+1],[w-34,roof-2],[w-14,37],[w-6,44],[w-8,55],[w-14,58],[11,58],[5,52]]);
      polygon(c,a.body,[[10,44],[17,39],[26,roof+1],[w-34,roof-2],[w-15,38],[w-9,43],[w-17,48],[16,49]]);
      polygon(c,'#223b4e',[[24,37],[29,roof+4],[w-36,roof+1],[w-21,37]]);
      polygon(c,'#4c7987',[[26,35],[31,roof+5],[w-39,roof+2],[w-29,31],[w-66,27],[46,36]]);
      polygon(c,'#a0bfbd',[[32,roof+6],[45,roof+4],[39,roof+9],[30,roof+12]]);
      line(c,'#294252',w/2,roof+2,w/2+1,37,2);
      line(c,a.trim,26,roof+1,w-34,roof-2);
      line(c,a.trim,11,46,w-10,45);
      line(c,a.shade,22,37,w-17,38);
      line(c,'#d0c7a8',37,40,w-33,40);
      line(c,'#425c60',23,43,w-23,43);
      line(c,'#14242d',14,55,29,56);
      line(c,'#14242d',w-28,56,w-13,54);
      line(c,a.shade,30,56,w-31,56);
      rect(c,'#192533',w/2-23,48,46,8);
      for(let i=0;i<6;i++)rect(c,'#4c6870',w/2-17+i*6,49,1,5);
      rect(c,a.trim,w/2-8,52,16,3);
      rect(c,'#30494f',w/2-6,53,12,1);
      rect(c,'#436067',19,57,w-38,2);
      rect(c,'#172731',27,59,w-54,2);
      for(const x of [10,w-23]){
        rect(c,'#152831',x-2,46,16,8);
        rect(c,approaching?'#eec98f':'#ad4a4a',x,47,12,6);
        rect(c,approaching?'#fff0ba':'#f58573',x+1,48,10,2);
        rect(c,approaching?'#d8e9cf':'#e97b66',x+1,51,8,1);
      }
      if(kind==='taxi'){rect(c,a.shade,44,roof-6,21,6);rect(c,'#ffe5aa',47,roof-6,15,4);}
      return tile;
    }
    function traffic(c,t,p,colors){
      const [vx,hy,spread]=stage.road,arrivals=[];
      if(p.worldFeature){
        const lanes=id==='citylight'?[-1,1,-1,1,-1,1]:[-1,1,0,-1,1];
        lanes.forEach((lane,i)=>{
          const step=mod(elapsed*(.069+(i%3)*.007)+i*.193+.32,1);
          arrivals.push({lane,depth:lane<0?1-step:step,kind:lane===0?'tram':i%3===1?'taxi':'coupe'});
        });
      }
      for(const e of events)if(e.kind==='train'){
        const age=t-e.start,count=id==='citylight'?3:1;
        for(let i=0;i<count;i++){
          const step=age*.128-i*.13;
          if(step>0&&step<1)arrivals.push({lane:i%2?-1:1,depth:step,kind:i%2?'coupe':'taxi'});
        }
      }
      arrivals.sort((a,b)=>a.depth-b.depth);
      const wet=p.weather==='rain'?1:.56,day=p.palette==='daylight';
      for(const {lane,depth,kind} of arrivals){
        const d=depth*depth,alpha=envelope(depth,1,.09),front=lane>=0;
        const size=(.05+.91*d)*(kind==='tram'?1.26:1);
        const x=vx+lane*(6+spread*d),y=hy+(H-hy+61)*d;
        const key=kind+':'+front;
        if(!sprites.has(key))sprites.set(key,makeSprite(kind,front));
        const sprite=sprites.get(key),w=Math.max(1,Math.round(sprite.width*size)),h=Math.max(1,Math.round(sprite.height*size));
        const lamp=front?colors.glow:'#df6264';
        c.globalAlpha=alpha;
        glow(c,lamp,x,y+6*size,45*size+4,28*size+3,wet*(day?.26:.43));
        for(let j=0;j<10;j++){
          c.globalAlpha=alpha*wet*(1-j/11)*(day?.20:.43);
          const span=(5+j*.82)*size,offset=Math.sin(t*1.9+j*2.1)*size*2;
          for(const dx of [-w*.34,w*.32])rect(c,lamp,x+dx+offset-span/2,y+j*3.1*size,span,1);
        }
        c.globalAlpha=alpha;c.drawImage(sprite,Math.round(x-w/2),Math.round(y-h+7*size),w,h);
        c.globalAlpha=alpha*(day?.40:.75);
        for(const dx of [-w*.34,w*.32])glow(c,lamp,x+dx,y-12*size,10*size+2,5*size+2,wet);
      }
      c.globalAlpha=1;
    }
    function reflections(c,t,p,colors){
      if(!stage.water)return;
      const [x,y,w,h]=stage.water,day=p.palette==='daylight',rough=p.weather==='rain'?.65:1;
      c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
      for(let i=0;i<25;i++){
        const pos=y+7+i*(h-14)/25,band=1+i%2;
        const dx=Math.round(Math.sin(t*.85+i*.92)*(1+i*.078)*rough);
        c.globalAlpha=.21+i*.006;
        c.drawImage(photo,x,Math.round(pos),w,band,x+dx,Math.round(pos),w,band);
      }
      for(let i=0;i<38;i++){
        const [sx,sy,a,b]=seed[i],yy=y+mod(sy+t*(i%2?1.3:-.8),h),xx=x+mod(sx+t*(a-.46)*6,w);
        c.globalAlpha=(day?.14:.17)*(1+Math.sin(t*1.1+i))*.5;
        rect(c,i%4?colors.rain:colors.glow,xx,yy,3+b*(5+20*(yy-y)/h),1);
      }
      c.restore();
    }
    function weather(c,t,p,colors,space){
      if(p.weather==='clear'||p.intensity===0)return;
      const intensity=p.intensity/100,limit=p.quality===15?90:155;
      const ocean=stage.kind==='ocean',mist=p.weather==='mist',snow=p.weather==='snow',train=stage.kind==='train';
      if(train){c.save();clipTrainWindows(c);}
      if(mist){
        for(let i=0;i<4;i++){
          const y=stage.horizon-18+i*16;
          glow(c,colors.mist,240+i*170+Math.sin(t*.16+i)*80,y,400,19+i*6,.13*intensity);
        }
      }else{
        for(let i=0;i<Math.round(intensity*(space?45:ocean?100:limit));i++){
          const [sx,sy,a,b]=seed[i],dx=snow||ocean?Math.sin(t*.41+i)*12+t*(.3+a):-(10+a*15)*t;
          const x=mod(sx+dx,W+12)-6,y=mod(sy+t*(space?14+a*46:ocean?1+a*5:snow?8+a*22:89+a*166),H+32)-16;
          c.globalAlpha=(space?.14:ocean?.23:snow?.26:.08)+a*(snow?.5:.22);
          if(ocean||snow)rect(c,colors.rain,x,y,b>.87?2:1,b>.91?2:1);
          else line(c,colors.rain,x,y,x-(space?4+a*15:2+a*5),y+4+a*(space?8:13),b>.90?1.6:1);
        }
      }
      c.globalAlpha=1;if(train)c.restore();
    }
    function signal(c,colors,x,y,age,opacity,space){
      const signalColor=space?colors.cyan:colors.glow;
      c.globalAlpha=opacity;
      glow(c,signalColor,x,y,26,22,.85);
      rect(c,'#e8fbdf',x-1,y-2,3,4);
      for(let i=0;i<3;i++){
        const radius=13+age*31+i*19;
        c.globalAlpha=opacity*(.6-i*.13);
        oval(c,signalColor,x,y,radius,radius*(space?.42:.25),false);
      }
      c.globalAlpha=1;
    }
    function motes(c,t,x,y,count=28,scale=1,color='#e4f2d5',opacity=.7){
      for(let i=0;i<count;i++){
        const [,,a,b]=seed[i],k=mod(t*(.7+a*.48)+b,1),xx=x+Math.sin(t*.9+i*2)*12*scale+(a-.5)*k*82*scale;
        c.globalAlpha=opacity*(1-k)*(.35+b*.65);
        rect(c,color,xx,y-k*(17+a*75)*scale,b>.84?2:1,b>.94?2:1);
      }
      c.globalAlpha=1;
    }
    function lanterns(c,t,x,y,colors,opacity,water){
      for(let i=0;i<7;i++){
        const [,,a,b]=seed[i+22],px=x+(i-3)*16+Math.sin(t*.68+i)*7+t*(water?4:2),py=y+b*35+t*(water?.7:-6);
        const s=.75+a*.55;
        c.globalAlpha=opacity*(.65+b*.35);
        glow(c,colors.glow,px,py,14*s,13*s,.85);
        rect(c,'#85432a',px-4*s,py-2*s,9*s,7*s);
        rect(c,'#ffdca0',px-2*s,py-2*s,5*s,5*s);
        rect(c,'#f3974a',px-4*s,py+4*s,9*s,1);
        if(water){c.globalAlpha=opacity*.26;rect(c,colors.glow,px-5,py+10,11,1);rect(c,colors.glow,px-3,py+13,6,1);}
      }
      c.globalAlpha=1;
    }
    function train(c,x,y,s,day){
      for(let cars=5;cars>=0;cars--){
        const car=x-cars*61*s,h=13*s;
        polygon(c,'#182536',[[car,y-h],[car+54*s,y-h],[car+61*s,y-8*s],[car+59*s,y],[car,y]]);
        rect(c,'#64828a',car+2*s,y-h,51*s,1);
        rect(c,'#527785',car+3*s,y-h+2,55*s,4*s);
        rect(c,'#8d6453',car+2*s,y-4*s,56*s,2*s);
        for(let j=0;j<7;j++){
          rect(c,'#152937',car+(5+j*7)*s,y-10*s,5*s,5*s);
          rect(c,day?'#a9c8b5':'#e3b473',car+(6+j*7)*s,y-9*s,3*s,3*s);
        }
        rect(c,'#132432',car+6*s,y,10*s,2*s);rect(c,'#132432',car+45*s,y,10*s,2*s);
      }
      rect(c,'#ffe1ac',x+58*s,y-6*s,4*s,2*s);
    }
    function shuttle(c,x,y,s,kind,colors,opacity){
      c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);c.globalAlpha=opacity;
      if(kind==='moon'){
        oval(c,colors.shadow,12,16,38,5,true);
        for(const dx of [-13,10,35]){
          oval(c,'#162330',dx,11,7,7,true);oval(c,'#80908e',dx,10,4,4,true);line(c,'#c6cebe',dx-2,10,dx+2,10);
        }
        polygon(c,'#a9b8a9',[[-22,0],[-15,-7],[30,-6],[44,2],[36,8],[-20,6]]);
        polygon(c,'#d1d6bd',[[-12,-7],[-2,-17],[21,-17],[31,-6]]);
        polygon(c,'#537e88',[[1,-15],[18,-15],[24,-8],[0,-8]]);
        rect(c,'#e8d7ac',39,0,4,3);line(c,'#aaa984',9,-18,9,-25,2);rect(c,colors.cyan,5,-26,9,2);
      }else{
        polygon(c,'#253b48',[[-41,5],[-31,-6],[7,-13],[35,-5],[52,2],[34,12],[-21,15]]);
        polygon(c,'#91a7a0',[[-36,4],[-28,-5],[8,-12],[34,-4],[50,2],[4,6]]);
        polygon(c,'#577583',[[-22,8],[50,2],[33,12],[-20,14]]);
        polygon(c,'#244a60',[[7,-9],[22,-7],[36,-2],[10,1]]);
        line(c,'#d5c7a8',8,-8,23,-6,1);
        rect(c,'#deddbc',12,-6,6,2);
        for(const dx of [-24,-13,-2])rect(c,'#cba66e',dx,6,6,2);
        glow(c,colors.cyan,-38,6,15,9,.8);
      }
      c.restore();
    }
    function whale(c,x,y,t,colors,opacity){
      c.save();c.translate(Math.round(x),Math.round(y));c.globalAlpha=opacity;
      const sweep=Math.sin(t*2.2)*9;
      polygon(c,'#153e54',[[-105,sweep],[-129,-12+sweep],[-151,-13+sweep],[-139,sweep],[-151,11+sweep],[-126,9+sweep],[-103,6+sweep],[-58,8],[-28,19],[43,19],[69,7],[78,-3],[68,-14],[19,-19],[-28,-14],[-64,-3]]);
      polygon(c,'#2e5d70',[[-101,4+sweep],[-51,5],[-25,11],[40,12],[69,2],[63,11],[40,18],[-25,17],[-59,10]]);
      polygon(c,'#1d475c',[[5,10],[-2,27],[-54,43],[-65,42],[-33,24],[-25,13]]);
      line(c,colors.cyan,11,-18,45,-15);rect(c,'#c1d9cb',62,-3,2,1);
      c.restore();
    }
    function worker(c,x,y,t,robot,colors,opacity){
      c.save();c.translate(Math.round(x),Math.round(y));c.globalAlpha=opacity;
      oval(c,colors.shadow,0,19,14,4,true);
      rect(c,'#273a46',-8,1,5,12);rect(c,'#9cada5',-7,-1,18,13);
      rect(c,'#c9cbb0',-6,-10,15,11);rect(c,robot?'#86cdc9':'#365a6b',-4,-8,12,5);
      rect(c,'#dce8c5',-2,-7,5,1);
      if(robot){
        rect(c,'#243c48',-10,12,24,6);rect(c,'#8da6a0',-8,12,21,1);
        line(c,'#96ada4',7,-11,13,-16,2);glow(c,colors.glow,13,-17,5,5,.85);
      }else{
        const dx=Math.sin(t*5)*4;
        line(c,'#b6c2ae',-4,10,-6+dx,18,4);line(c,'#7c9e9a',7,10,9-dx,18,4);
        line(c,'#a0afa0',8,4,14,6+dx,3);rect(c,colors.glow,14,5+dx,4,2);
      }
      c.restore();
    }
    function trainGlass(c,t,colors){
      c.save();clipTrainWindows(c);
      const x=mod(250-t*112,1030)-150;
      for(let i=0;i<6;i++){
        const left=x+i*43,y=310+i%2*9,shade=i%2?'#243943':'#334b4a';
        polygon(c,shade,[[left-4,y],[left+13,y-15],[left+35,y],[left+31,y+33],[left,y+33]]);
        rect(c,colors.glow,left+7,y+6,5,6);rect(c,colors.glow,left+19,y+6,5,6);
      }
      c.restore();
    }
    function drawCurtains(c,p){
      if(!curtains)return;
      const day=p.palette==='daylight';
      c.save();clipTrainWindows(c);
      for(const [x,y,w,h] of trainPanes){
        rect(c,day?'#244643':'#152d33',x,y,w,h);
        for(let i=0;i<w;i+=12){
          rect(c,day?'#3c5b50':'#213d40',x+i,y,5,h);
          rect(c,day?'#4a6956':'#2d4a46',x+i+4,y,2,h);
          rect(c,day?'#6c6e49':'#5c503a',x+i,y+h-4,8,2);
        }
        line(c,'#a78858',x,y+h,x+w,y+h,2);
      }
      c.restore();
    }
    function ambient(c,t,p,m,colors,pan){
      const day=p.palette==='daylight',energy=(m.level||0)*p.musicStrength/100;
      const [x,y,rx,ry]=stage.light,interactive=p.worldFeature;
      const visible=day?.31:.59;
      if(!lit){
        c.globalAlpha=day?.49:.76;
        glow(c,colors.shadow,x,y,rx*1.22,ry*1.27,1);c.globalAlpha=1;
      }else if(p.windows){
        glow(c,colors.glow,x,y,rx,ry,visible*(.35+p.worldGlow/160)+energy*.9);
        glow(c,colors.glow,x+rx*.20,y+ry*.20,rx*.45,ry*.29,visible*.28+energy*.5);
      }
      if(stage.road){traffic(c,t,p,colors);return;}
      if(!interactive)return;
      if(stage.kind==='canal'){
        const crossing=mod(elapsed*13+71,1310)-290;
        train(c,crossing,stage.horizon+2,.67,day);
        const boat=mod(elapsed*8+225,1000)-40,by=431+Math.sin(elapsed*.6)*2;
        c.globalAlpha=.53;line(c,colors.rain,boat-44,by+7,boat+4,by+4);
        c.globalAlpha=1;polygon(c,'#233746',[[boat,by],[boat+38,by],[boat+27,by+7],[boat+9,by+7]]);
        rect(c,'#6f9797',boat+12,by-5,16,5);rect(c,'#f3cd99',boat+16,by-4,7,3);
        glow(c,colors.glow,boat+26,by-1,11,6,.69);
      }else if(stage.kind==='train'){
        motes(c,elapsed*.2,571,414,28,.58,day?'#eceed8':'#c7d8c6',.38);
        for(let i=0;i<34;i++){
          const q=mod(seed[i][0]-elapsed*19,760)+103;
          if(q>310&&q<340||q>611&&q<643)continue;
          c.globalAlpha=.14;rect(c,colors.glow,q,207+seed[i][1]%88,2,1);
        }
        c.globalAlpha=1;
      }else if(stage.kind==='ocean'){
        motes(c,elapsed*.11,370,481,40,3.2,colors.cyan,.45);
        for(let i=0;i<15;i++){
          const q=mod(174+i*24-elapsed*(8+i%4),302)+226;
          const yy=293+(i*29%105)+Math.sin(t*1.2+i)*3;
          c.globalAlpha=.31;rect(c,colors.cyan,q,yy,4,1);rect(c,colors.mist,q+4,yy-1,1,3);
        }
        c.globalAlpha=1;
      }else if(stage.kind==='garden'||stage.kind==='alpine'){
        for(let i=0;i<28;i++){
          const [sx,sy,a]=seed[i],px=mod(sx+elapsed*(4+a*5)+pan.x*.21,970),py=mod(sy+elapsed*(3+a*12),550);
          c.globalAlpha=(.12+a*.48)*(stage.kind==='alpine'?.54:1);
          rect(c,stage.kind==='garden'?'#efb8bb':colors.glow,px+Math.sin(t+i)*6,py,a>.65?3:2,1);
        }
        c.globalAlpha=1;
      }else if(stage.kind==='moon'||stage.kind==='orbit'){
        const moon=stage.kind==='moon',step=mod(elapsed*(moon?.024:.034)+.15,1);
        shuttle(c,moon?97+step*601:162+step*587,moon?432+step*39:257+Math.sin(step*2)*20,moon?.66+step*.35:.50+step*.26,stage.kind,colors,envelope(step,1,.09));
        for(let i=0;i<6;i++){
          const [px,py]=stage.points[(i+2)%6];
          glow(c,i%2?colors.glow:colors.cyan,px,py,9,7,.27*(1+Math.sin(t*1.4+i)));
        }
      }
    }
    function effects(c,t,p,colors){
      events=events.filter(e=>t-e.start<e.duration);
      for(const e of events){
        const age=t-e.start,alpha=envelope(age+.3,e.duration,.52),[x,y]=e.point;
        const space=stage.kind==='moon'||stage.kind==='orbit';
        if(e.kind==='train'&&!stage.road){
          if(space||stage.kind==='ocean')shuttle(c,x-185+age*38,y-Math.sin(age*.25)*34,.9,stage.kind,colors,alpha);
          else if(stage.kind==='train')trainGlass(c,age,colors);
          else if(stage.kind==='canal')train(c,-80+age*136,stage.horizon+2,.78,p.palette==='daylight');
          else signal(c,colors,x,y,age,alpha*.73,false);
        }else if(e.kind==='lantern'){
          if(stage.kind==='train'||stage.kind==='ocean'||space||id==='nocturne')motes(c,age*.4,x,y,46,stage.kind==='ocean'?2.5:1.25,colors.glow,alpha);
          else lanterns(c,age,x,y,colors,alpha,stage.kind==='garden');
        }else if(e.kind==='meteor'){
          if(space||stage.kind==='ocean'||stage.kind==='avenue'||stage.kind==='garden')signal(c,colors,x,y,age,alpha,true);
          else{
            const sx=x+(age-1.8)*104,sy=y+(age-1.8)*28;
            c.globalAlpha=alpha;line(c,colors.glow,sx-38,sy-9,sx,sy,1.4);glow(c,colors.glow,sx,sy,12,9,.8);c.globalAlpha=1;
          }
        }else if(e.kind==='water'){
          if(stage.kind==='moon'||stage.kind==='orbit'){
            motes(c,age*.53,x+age*7,y,34,2.0,stage.kind==='moon'?'#d7c5a8':colors.cyan,alpha*.8);
            continue;
          }
          for(let i=0;i<4;i++){
            const width=5+age*23-i*11;if(width<=0)continue;
            c.globalAlpha=alpha*(.49-i*.086);
            oval(c,colors.cyan,x,y,width,width*(space?.11:stage.kind==='ocean'?.52:.19),false);
          }
          c.globalAlpha=1;
        }else if(e.kind==='cat'){
          if(stage.kind==='ocean')whale(c,x-94+age*41,y+Math.sin(age*.8)*8,age,colors,alpha*.76);
          else if(space)worker(c,x-35+age*10,y+Math.sin(age*.7)*4,age,stage.kind==='orbit',colors,alpha);
          else if(stage.kind==='garden'){
            for(let i=0;i<3;i++){
              c.globalAlpha=alpha*.64;
              const px=x+Math.sin(age*.9+i*2)*38,py=y+Math.cos(age*.6+i)*9;
              oval(c,i===1?'#e5bb81':'#e19479',px,py,6,2,true);
              line(c,colors.rain,px-5,py,px-10,py+Math.sin(age*8+i)*4);
            }
            c.globalAlpha=1;
          }else{
            const px=x+Math.sin(age*.52)*23,py=y-Math.abs(Math.sin(age*4))*2;
            c.globalAlpha=alpha*.82;
            oval(c,'#65483d',px,py,8,5,true);rect(c,'#967358',px+3,py-7,6,7);
            polygon(c,'#967358',[[px+3,py-5],[px+4,py-11],[px+7,py-5],[px+9,py-9],[px+10,py-3]]);
            rect(c,'#ecd391',px+7,py-5,1,1);line(c,'#71544a',px-6,py+2,px-14,py-2+Math.sin(age*4)*4,2);
            c.globalAlpha=1;
          }
        }
      }
    }
    function draw(c,t,p,m,pan){
      if(!plate)return false;
      bake(p.palette);
      const dt=lastTime===null?0:clamp(t-lastTime,0,.12);
      lastTime=t;elapsed+=dt*p.worldActivity/100;
      const colors=atmospheres[p.palette]||atmospheres.nocturne;
      c.save();c.globalAlpha=1;c.imageSmoothingEnabled=false;
      const drift=p.parallax&&!p.reduced;
      if(drift)c.translate(Math.round(pan.x),Math.round(pan.y));
      c.drawImage(photo,drift?-4:0,drift?-2:0,drift?W+8:W,drift?H+4:H);
      reflections(c,elapsed,p,colors);
      ambient(c,t,p,m,colors,pan);
      effects(c,t,p,colors);
      weather(c,elapsed,p,colors,stage.kind==='moon'||stage.kind==='orbit');
      drawCurtains(c,p);
      c.restore();
      return true;
    }
    function hotspots(labels){
      return stage?stage.points.map(([x,y],i)=>({x:x-33,y:y-29,w:66,h:58,action:names[i],label:labels[i]||names[i]})):[];
    }
    function effect(kind,t,point){
      if(kind==='light'){lit=!lit;return;}
      if(kind==='water'&&stage?.kind==='train'){curtains=!curtains;return;}
      const i=names.indexOf(kind);
      if(i<0||!stage)return;
      const target=kind==='water'&&point?[point.x,point.y]:stage.points[i];
      const duration={train:9,lantern:10,cat:8,meteor:5,water:4}[kind];
      events=events.filter(e=>e.kind!==kind||kind==='water');
      events.push({kind,start:t,point:target,duration});
      if(events.length>12)events.shift();
    }
    return {select,draw,hotspots,effect,ready:()=>Boolean(plate),status:()=>loadStatus};
  }
  window.AfterlightCinema={create};
})();

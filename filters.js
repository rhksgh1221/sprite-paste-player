// Game-sprite stylization filter pipeline.
// Order: pixelate -> color grade (hue/sat/contrast/bright) -> cel shade -> recolor (gradient map) -> alpha clean -> outline.
export const RAMPS={fire:['#12020a','#8b1026','#ff6a00','#ffd166'],ice:['#07111f','#145da0','#7de2ff','#ffffff'],toxic:['#06120a','#1f7a1f','#9cff00','#f7ffb6'],mono:['#000000','#4b5563','#d1d5db','#ffffff']};

export function defaultFilters(){return{enabled:false,bypass:false,
  brightness:0,contrast:0,saturation:0,hue:0,
  cel:false,celSteps:4,
  ramp:false,rampPreset:'fire',rampColors:['#12020a','#8b1026','#ff6a00','#ffd166'],rampMix:100,
  pixel:false,pixelSize:4,
  outline:false,outlineColor:'#0a0a12',outlineWidth:1,
  alphaCut:false,alphaThreshold:50}}

export const FILTER_PRESETS=[
  ['Clean Toon',{enabled:true,cel:true,celSteps:4,outline:true,outlineColor:'#0a0a12',outlineWidth:1,contrast:14}],
  ['Pixel Art',{enabled:true,pixel:true,pixelSize:4,cel:true,celSteps:5,saturation:16}],
  ['Recolor Fire',{enabled:true,ramp:true,rampPreset:'fire',rampMix:100,cel:true,celSteps:6}],
  ['Recolor Ice',{enabled:true,ramp:true,rampPreset:'ice',rampMix:92,contrast:10}],
  ['Crisp Sprite',{enabled:true,alphaCut:true,alphaThreshold:55,outline:true,outlineColor:'#000000',outlineWidth:1,saturation:10}],
  ['Bold Outline',{enabled:true,outline:true,outlineColor:'#0a0a12',outlineWidth:3,contrast:18,saturation:18}]
];

const hexToRgb=h=>{h=(h||'#000000').replace('#','');if(h.length===3)h=h.split('').map(v=>v+v).join('');return[parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0]};
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp8=v=>v<0?0:v>255?255:v;
function rampColor(t,pal){pal=pal&&pal.length?pal:RAMPS.fire;const n=pal.length-1,x=Math.max(0,Math.min(1,t))*n,i=Math.min(n-1,Math.floor(x)),f=x-i,a=hexToRgb(pal[i]),b=hexToRgb(pal[i+1]);return[lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f)]}
export function getRampPalette(filters){return filters.rampPreset==='custom'?(filters.rampColors||RAMPS.fire):(RAMPS[filters.rampPreset]||RAMPS.fire)}

// luma-preserving hue rotation matrix (Rec.601)
function hueRotation(deg){const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return[
  0.213+c*0.787-s*0.213,0.715-c*0.715-s*0.715,0.072-c*0.072+s*0.928,
  0.213-c*0.213+s*0.143,0.715+c*0.285+s*0.140,0.072-c*0.072-s*0.283,
  0.213-c*0.213-s*0.787,0.715-c*0.715+s*0.715,0.072+c*0.928+s*0.072]}

// clean silhouette outline drawn BEHIND the sprite (no dark fringe, color-pickable)
function outlineCanvas(dst,color,width){const w=dst.width,h=dst.height,ctx=dst.getContext('2d');
  const orig=document.createElement('canvas');orig.width=w;orig.height=h;orig.getContext('2d').drawImage(dst,0,0);
  const sil=document.createElement('canvas');sil.width=w;sil.height=h;const s=sil.getContext('2d');
  s.drawImage(orig,0,0);s.globalCompositeOperation='source-in';s.fillStyle=color;s.fillRect(0,0,w,h);
  ctx.clearRect(0,0,w,h);const r=Math.max(1,width|0);
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(!dx&&!dy)continue;if(dx*dx+dy*dy>r*r+1)continue;ctx.drawImage(sil,dx,dy)}
  ctx.drawImage(orig,0,0)}

export function applyFilters(src,dst,filters,frame=0){
  dst.width=src.width;dst.height=src.height;
  const dctx=dst.getContext('2d',{willReadFrequently:true});
  dctx.imageSmoothingEnabled=false;dctx.clearRect(0,0,dst.width,dst.height);dctx.drawImage(src,0,0);
  const f=filters;if(!f.enabled||f.bypass)return;
  // pixelate (geometry) first so later passes act on the blocky pixels
  if(f.pixel&&f.pixelSize>1){const step=f.pixelSize,tw=Math.max(1,Math.round(dst.width/step)),th=Math.max(1,Math.round(dst.height/step)),tmp=document.createElement('canvas');tmp.width=tw;tmp.height=th;const tctx=tmp.getContext('2d');tctx.imageSmoothingEnabled=false;tctx.drawImage(dst,0,0,tw,th);dctx.clearRect(0,0,dst.width,dst.height);dctx.imageSmoothingEnabled=false;dctx.drawImage(tmp,0,0,tw,th,0,0,dst.width,dst.height)}
  const needGrade=!!(f.brightness||f.contrast||f.saturation||f.hue),celOn=!!f.cel,rampOn=!!f.ramp,aOn=!!f.alphaCut;
  if(needGrade||celOn||rampOn||aOn){
    const con=(f.contrast+100)/100,sat=(f.saturation+100)/100,bri=f.brightness/100*255,hm=f.hue?hueRotation(f.hue):null;
    const celStep=Math.max(2,Math.min(8,f.celSteps|0))-1;
    const pal=rampOn?getRampPalette(f):null,mix=Math.max(0,Math.min(1,(f.rampMix==null?100:f.rampMix)/100));
    const aTh=Math.round(Math.max(0,Math.min(100,f.alphaThreshold))/100*255);
    const img=dctx.getImageData(0,0,dst.width,dst.height),d=img.data;
    for(let i=0;i<d.length;i+=4){let a=d[i+3];if(a===0)continue;let r=d[i],g=d[i+1],b=d[i+2];
      if(hm){const nr=hm[0]*r+hm[1]*g+hm[2]*b,ng=hm[3]*r+hm[4]*g+hm[5]*b,nb=hm[6]*r+hm[7]*g+hm[8]*b;r=nr;g=ng;b=nb}
      if(f.saturation){const l=r*.299+g*.587+b*.114;r=l+(r-l)*sat;g=l+(g-l)*sat;b=l+(b-l)*sat}
      if(f.contrast){r=(r-128)*con+128;g=(g-128)*con+128;b=(b-128)*con+128}
      if(f.brightness){r+=bri;g+=bri;b+=bri}
      r=clamp8(r);g=clamp8(g);b=clamp8(b);
      if(celOn){const lum=r*.299+g*.587+b*.114;if(lum>1){const q=Math.round(lum/255*celStep)/celStep*255,ratio=q/lum;r=clamp8(r*ratio);g=clamp8(g*ratio);b=clamp8(b*ratio)}else{r=0;g=0;b=0}}
      if(rampOn){const lum=(r*.299+g*.587+b*.114)/255,rc=rampColor(lum,pal);r=lerp(r,rc[0],mix);g=lerp(g,rc[1],mix);b=lerp(b,rc[2],mix)}
      if(aOn)a=a<aTh?0:255;
      d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=a}
    dctx.putImageData(img,0,0)}
  if(f.outline)outlineCanvas(dst,f.outlineColor||'#000000',f.outlineWidth)}

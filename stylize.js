const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const presetTuning={
  generic:{contrast:1,edge:1,clean:1,bias:0},
  flame:{contrast:1.25,edge:1.15,clean:.75,bias:.08},
  smoke:{contrast:.85,edge:.75,clean:1.35,bias:-.04},
  explosion:{contrast:1.35,edge:1.25,clean:.85,bias:.05},
  wave:{contrast:1.05,edge:1.35,clean:1.15,bias:.02}
};
function smoothLuma(src,w,h,amount){if(amount<=0)return src;const out=new Float32Array(src.length),mix=clamp(amount,0,1);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let s=0,c=0;for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){s+=src[yy*w+xx];c++}const i=y*w+x;out[i]=src[i]*(1-mix)+(s/c)*mix}return out}
function quantize(v,steps,bias){steps=Math.max(2,Math.min(6,steps|0));v=clamp(v+bias,0,1);const q=Math.round(v*(steps-1))/(steps-1);return q}
export function applyFxSketch(canvas,filters){
  if(!filters.fxSketch)return;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const w=canvas.width,h=canvas.height;if(!w||!h)return;
  const img=ctx.getImageData(0,0,w,h),d=img.data;
  const tune=presetTuning[filters.fxSketchPreset]||presetTuning.generic;
  const strength=clamp((filters.fxSketchStrength??70)/100,0,1);
  const contrast=((filters.fxSketchContrast??55)/50)*tune.contrast;
  const edgeStrength=clamp((filters.fxSketchEdge??55)/100,0,1)*tune.edge;
  const clean=clamp((filters.fxSketchClean??35)/100,0,1)*tune.clean;
  const steps=Math.max(2,Math.min(6,filters.fxSketchSteps??4));
  let lum=new Float32Array(w*h);
  for(let i=0,p=0;i<d.length;i+=4,p++){
    const a=d[i+3]/255;
    let l=(d[i]*.299+d[i+1]*.587+d[i+2]*.114)/255;
    l=clamp((l-.5)*contrast+.5,0,1);
    lum[p]=a>0?l:0;
  }
  lum=smoothLuma(lum,w,h,clean);
  const out=new Uint8ClampedArray(d);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=y*w+x,i=p*4,a=d[i+3];
    if(a===0)continue;
    const l=lum[p];
    const lL=lum[y*w+Math.max(0,x-1)],lR=lum[y*w+Math.min(w-1,x+1)],lU=lum[Math.max(0,y-1)*w+x],lD=lum[Math.min(h-1,y+1)*w+x];
    const diag1=lum[Math.max(0,y-1)*w+Math.max(0,x-1)],diag2=lum[Math.min(h-1,y+1)*w+Math.min(w-1,x+1)];
    const edge=clamp((Math.abs(lR-lL)+Math.abs(lD-lU)+Math.abs(diag2-diag1)*.5)*edgeStrength*2.2,0,1);
    let q=quantize(l,steps,tune.bias);
    if(filters.fxSketchPreset==='flame')q=Math.pow(q,.82);
    if(filters.fxSketchPreset==='smoke')q=clamp(q*.86+.08,0,1);
    if(filters.fxSketchPreset==='explosion')q=clamp(q*1.08,0,1);
    let v=clamp(q-edge*.75,0,1);
    let r=v*255,g=v*255,b=v*255;
    if(filters.fxSketchPreset==='wave'){
      b=clamp(v*1.03,0,1)*255;
      r=clamp(v*.96,0,1)*255;
    }
    out[i]=d[i]*(1-strength)+r*strength;
    out[i+1]=d[i+1]*(1-strength)+g*strength;
    out[i+2]=d[i+2]*(1-strength)+b*strength;
    out[i+3]=a;
  }
  ctx.putImageData(new ImageData(out,w,h),0,0);
}

export default `
function sourceCell(i,filtered=false){
  let c=count(),idx=((i%c)+c)%c,f=fs(),w=Math.max(1,Math.round(f.w)),h=Math.max(1,Math.round(f.h)),cv=document.createElement('canvas'),x=cv.getContext('2d',{willReadFrequently:true});
  cv.width=w;cv.height=h;x.imageSmoothingEnabled=false;x.clearRect(0,0,w,h);
  if(hasFrames())x.drawImage(S.frames[idx],0,0,f.w,f.h,0,0,w,h);
  else{let col=idx%S.cols,row=Math.floor(idx/S.cols);x.drawImage(S.img,col*f.w,row*f.h,f.w,f.h,0,0,w,h)}
  if(!filtered)return cv;
  let o=document.createElement('canvas');applyFilters(cv,o,S.filters,idx,true);return o
}
function box(cv,t=8){
  let x=cv.getContext('2d',{willReadFrequently:true}),w=cv.width,h=cv.height,d=x.getImageData(0,0,w,h).data,trans=false;
  for(let i=3;i<d.length;i+=64){if(d[i]<250){trans=true;break}}
  let mnx=w,mny=h,mxx=-1,mxy=-1;
  for(let p=0,y=0;y<h;y++)for(let xx=0;xx<w;xx++,p+=4){
    let a=d[p+3],m=Math.max(d[p],d[p+1],d[p+2]),hit=trans?a>t:m>t;
    if(hit){if(xx<mnx)mnx=xx;if(y<mny)mny=y;if(xx>mxx)mxx=xx;if(y>mxy)mxy=y}
  }
  return mxx<0?null:{x:mnx,y:mny,w:mxx-mnx+1,h:mxy-mny+1}
}
function activeList(){
  let n=count(),a=[];
  for(let i=0;i<n;i++)if(box(sourceCell(i,false)))a.push(i);
  if(a.length)return a;
  return Array.from({length:n},(_,i)=>i)
}
function frameList(n=count(),slot=cells()){
  let a=activeList(),m=Math.min(a.length,slot);
  if(m<1)return[];
  if(m===1)return[a[Math.round((a.length-1)/2)]];
  let r=[];
  for(let i=0;i<m;i++)r.push(a[Math.round(i*(a.length-1)/(m-1))]);
  return r
}
function cropBox(ids){
  let bs=ids.map(i=>box(sourceCell(i,false))).filter(Boolean),f=sourceCell(ids[0]??0,false);
  if(!bs.length)return{x:0,y:0,w:f.width,h:f.height};
  let x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y)),r=Math.max(...bs.map(b=>b.x+b.w)),bt=Math.max(...bs.map(b=>b.y+b.h)),pad=Math.max(2,Math.ceil(Math.max(r-x,bt-y)*.04));
  x=Math.max(0,x-pad);y=Math.max(0,y-pad);r=Math.min(f.width,r+pad);bt=Math.min(f.height,bt+pad);
  return{x,y,w:Math.max(1,r-x),h:Math.max(1,bt-y)}
}
function croppedCell(i,b){
  let src=sourceCell(i,true),o=document.createElement('canvas'),x=o.getContext('2d');
  o.width=b.w;o.height=b.h;x.imageSmoothingEnabled=false;x.clearRect(0,0,o.width,o.height);
  x.drawImage(src,b.x,b.y,b.w,b.h,S.focusX,S.focusY,b.w,b.h);
  return o
}
function sheetCanvas(){
  let ids=frameList(),b=cropBox(ids),out=document.createElement('canvas'),x=out.getContext('2d');
  out.width=b.w*S.cols;out.height=b.h*S.rows;x.imageSmoothingEnabled=false;
  ids.forEach((src,slot)=>{x.drawImage(croppedCell(src,b),(slot%S.cols)*b.w,Math.floor(slot/S.cols)*b.h)});
  return out
}
function chan(src,m){
  if(m==='rgba')return src;
  let o=document.createElement('canvas'),x=o.getContext('2d',{willReadFrequently:true});
  o.width=src.width;o.height=src.height;x.drawImage(src,0,0);
  let im=x.getImageData(0,0,o.width,o.height),d=im.data;
  for(let i=0;i<d.length;i+=4){let v=m==='r'?d[i]:m==='g'?d[i+1]:m==='b'?d[i+2]:d[i+3];d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}
  x.putImageData(im,0,0);return o
}
function updateSheet(force=false){
  if(!ready()||!E.sheetPreviewCanvas)return;
  if(!force&&E.sheetPreviewCanvas.width===0)return;
  let raw=sheetCanvas(),mode=E.sheetChannel.value,view=chan(raw,mode),x=E.sheetPreviewCanvas.getContext('2d');
  E.sheetPreviewCanvas.width=view.width;E.sheetPreviewCanvas.height=view.height;x.clearRect(0,0,view.width,view.height);x.drawImage(view,0,0);
  let total=count(),slot=cells(),active=activeList().length,picked=frameList(total,slot).length,prefix=active<total?total+'프레임 중 '+active+'활성 → ':'';
  E.sheetInfo.textContent=S.cols+' × '+S.rows+' · '+view.width+' × '+view.height+'px · '+prefix+picked+'셀 균등 샘플 · '+mode.toUpperCase()
}
function play(){if(!ready())return;pause(false);S.playing=true;E.play.textContent='재생 중';E.qPlay.textContent='정지';tick()}
function pause(btn=true){clearTimeout(S.timer);S.timer=null;S.playing=false;if(btn){E.play.textContent='재생';E.qPlay.textContent='재생'}}
function tick(){
  if(!S.playing)return;
  S.timer=setTimeout(()=>{let c=count();if(S.mode==='pingpong'){let n=S.frame+S.dir;if(n>=c){S.dir=-1;S.frame=Math.max(0,c-2)}else if(n<0){S.dir=1;S.frame=Math.min(1,c-1)}else S.frame=n}else if(S.mode==='once'){if(S.frame>=c-1)return pause();else S.frame++}else S.frame=(S.frame+1)%c;draw();tick()},delay())
}
function delay(){
  let b=cl(S.interval,10,100),c=count(),t=c<=1?0:S.frame/(c-1),a=cl(S.curveVal,0,100)/100,m=1;
  if(S.curve==='easeIn')m=1.7-1.2*t;else if(S.curve==='easeOut')m=.5+1.2*t;else if(S.curve==='easeInOut')m=.55+1.45*Math.abs(2*t-1);else if(S.curve==='burst')m=t<.32?1.75:t<.72?.48:1.15;
  return Math.round(Math.max(4,Math.min(220,b*((1-a)+a*m))))
}
function bestGrid(n){
  let c=Math.ceil(Math.sqrt(n)),r=Math.ceil(n/c);
  if(c>12){c=12;r=Math.ceil(n/12)}
  if(r>12){r=12;c=Math.ceil(n/12)}
  return{cols:cl(c,1,12),rows:cl(r,1,12)}
}
`;

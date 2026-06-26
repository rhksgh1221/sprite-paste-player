export async function decodeGifFrames(file,{maxFrames=144}={}){
  if(!file)throw new Error('GIF 파일이 없어');
  try{
    const frames=await decodeWithImageDecoder(file,maxFrames);
    if(frames.length)return frames;
  }catch(e){}
  return decodeGifManual(file,maxFrames);
}

async function decodeWithImageDecoder(file,maxFrames){
  if(typeof window==='undefined'||!('ImageDecoder' in window))throw new Error('ImageDecoder unsupported');
  const data=await file.arrayBuffer();
  const decoder=new ImageDecoder({data,type:'image/gif'});
  await decoder.tracks.ready;
  const track=decoder.tracks.selectedTrack;
  const declared=track&&Number.isFinite(track.frameCount)&&track.frameCount>0?track.frameCount:maxFrames;
  const total=Math.min(declared,maxFrames);
  const frames=[];
  for(let i=0;i<total;i++){
    const result=await decoder.decode({frameIndex:i});
    const image=result.image;
    const canvas=document.createElement('canvas');
    canvas.width=image.displayWidth||image.codedWidth||image.width;
    canvas.height=image.displayHeight||image.codedHeight||image.height;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const delay=image.duration?Math.max(20,Math.round(image.duration/1000)):80;
    if(image.close)image.close();
    frames.push({canvas,delay});
  }
  if(decoder.close)decoder.close();
  return frames;
}

class Reader{
  constructor(bytes){this.b=bytes;this.p=0}
  u8(){return this.b[this.p++]}
  u16(){const v=this.b[this.p]|(this.b[this.p+1]<<8);this.p+=2;return v}
  bytes(n){const a=this.b.subarray(this.p,this.p+n);this.p+=n;return a}
}

async function decodeGifManual(file,maxFrames){
  const bytes=new Uint8Array(await file.arrayBuffer());
  const r=new Reader(bytes);
  const sig=String.fromCharCode(...r.bytes(6));
  if(!/^GIF8[79]a$/.test(sig))throw new Error('GIF 형식이 아니야');
  const width=r.u16(),height=r.u16();
  const packed=r.u8();
  r.u8();r.u8();
  const globalTable=(packed&0x80)?readColorTable(r,1<<((packed&7)+1)):null;
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.clearRect(0,0,width,height);
  const frames=[];
  let gce={disposal:0,delay:80,transparent:null};
  while(r.p<bytes.length&&frames.length<maxFrames){
    const sentinel=r.u8();
    if(sentinel===0x3b)break;
    if(sentinel===0x21){
      const label=r.u8();
      if(label===0xf9){
        const blockSize=r.u8();
        if(blockSize!==4){skipSubBlocks(r);continue}
        const flags=r.u8();
        const delay=r.u16()*10;
        const transparentIndex=r.u8();
        r.u8();
        gce={
          disposal:(flags>>2)&7,
          delay:delay||80,
          transparent:(flags&1)?transparentIndex:null
        };
      }else{
        skipSubBlocks(r);
      }
      continue;
    }
    if(sentinel!==0x2c)break;
    const left=r.u16(),top=r.u16(),w=r.u16(),h=r.u16();
    const ipacked=r.u8();
    const localTable=(ipacked&0x80)?readColorTable(r,1<<((ipacked&7)+1)):null;
    const palette=localTable||globalTable;
    const interlaced=!!(ipacked&0x40);
    const minCodeSize=r.u8();
    const imageData=readSubBlocks(r);
    let indexes=lzwDecode(minCodeSize,imageData,w*h);
    if(interlaced)indexes=deinterlace(indexes,w,h);
    const restore=gce.disposal===3?copyCanvas(canvas):null;
    const patch=document.createElement('canvas');
    patch.width=w;patch.height=h;
    const pctx=patch.getContext('2d',{willReadFrequently:true});
    const img=pctx.createImageData(w,h);
    const data=img.data;
    for(let i=0;i<w*h;i++){
      const idx=indexes[i]??0;
      const o=i*4;
      if(idx===gce.transparent){
        data[o]=0;data[o+1]=0;data[o+2]=0;data[o+3]=0;
      }else{
        const pi=idx*3;
        data[o]=palette?palette[pi]||0:0;
        data[o+1]=palette?palette[pi+1]||0:0;
        data[o+2]=palette?palette[pi+2]||0:0;
        data[o+3]=255;
      }
    }
    pctx.putImageData(img,0,0);
    ctx.drawImage(patch,left,top);
    frames.push({canvas:copyCanvas(canvas),delay:Math.max(20,gce.delay||80)});
    if(gce.disposal===2){
      ctx.clearRect(left,top,w,h);
    }else if(gce.disposal===3&&restore){
      ctx.clearRect(0,0,width,height);
      ctx.drawImage(restore,0,0);
    }
    gce={disposal:0,delay:80,transparent:null};
  }
  if(!frames.length)throw new Error('GIF 프레임을 찾지 못했어');
  return frames;
}

function readColorTable(r,count){
  const table=new Uint8Array(count*3);
  table.set(r.bytes(count*3));
  return table;
}

function readSubBlocks(r){
  const chunks=[];
  let total=0;
  while(true){
    const size=r.u8();
    if(!size)break;
    const chunk=r.bytes(size);
    chunks.push(chunk);
    total+=chunk.length;
  }
  const out=new Uint8Array(total);
  let offset=0;
  for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.length}
  return out;
}

function skipSubBlocks(r){
  while(true){
    const size=r.u8();
    if(!size)break;
    r.p+=size;
  }
}

function lzwDecode(minCodeSize,data,expectedLength){
  const clearCode=1<<minCodeSize;
  const endCode=clearCode+1;
  let codeSize=minCodeSize+1;
  let bit=0;
  function readCode(){
    let code=0;
    for(let i=0;i<codeSize;i++){
      const byte=data[bit>>3]||0;
      code|=((byte>>(bit&7))&1)<<i;
      bit++;
    }
    return code;
  }
  function resetDict(){
    const dict=[];
    for(let i=0;i<clearCode;i++)dict[i]=[i];
    dict[clearCode]=[];
    dict[endCode]=null;
    codeSize=minCodeSize+1;
    return dict;
  }
  let dict=resetDict();
  let prev=null;
  const out=[];
  while(bit<data.length*8&&out.length<expectedLength){
    let code=readCode();
    if(code===clearCode){
      dict=resetDict();
      prev=null;
      continue;
    }
    if(code===endCode)break;
    let entry;
    if(dict[code]){
      entry=dict[code].slice();
    }else if(code===dict.length&&prev){
      entry=prev.concat(prev[0]);
    }else{
      break;
    }
    for(let i=0;i<entry.length&&out.length<expectedLength;i++)out.push(entry[i]);
    if(prev){
      dict.push(prev.concat(entry[0]));
      if(dict.length===(1<<codeSize)&&codeSize<12)codeSize++;
    }
    prev=entry;
  }
  const result=new Uint8Array(expectedLength);
  result.set(out.slice(0,expectedLength));
  return result;
}

function deinterlace(pixels,w,h){
  const out=new Uint8Array(w*h);
  let from=0;
  const passes=[
    {start:0,step:8},
    {start:4,step:8},
    {start:2,step:4},
    {start:1,step:2}
  ];
  for(const pass of passes){
    for(let y=pass.start;y<h;y+=pass.step){
      out.set(pixels.subarray(from,from+w),y*w);
      from+=w;
    }
  }
  return out;
}

function copyCanvas(src){
  const canvas=document.createElement('canvas');
  canvas.width=src.width;
  canvas.height=src.height;
  canvas.getContext('2d').drawImage(src,0,0);
  return canvas;
}
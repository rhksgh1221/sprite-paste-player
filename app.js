import{applyFilters,defaultFilters,FILTER_PRESETS,RAMPS}from'./filters.js';
import{smartDetect}from'./smart-detect.js';
import{saveCanvasPNG,saveFramesZip}from'./export.js';
import{decodeGifFrames}from'./gif-decoder.js';
import p1 from './app-chunk-1.js';
import p2 from './app-chunk-2.js';
import p3 from './app-chunk-3.js';
import p4 from './app-chunk-4.js';
import p5 from './app-chunk-5.js';
import p6 from './app-chunk-6.js';
import p7 from './app-chunk-7.js';
import p8 from './app-chunk-8.js';
import p9 from './app-chunk-9.js';
import p10 from './app-chunk-10.js';

function mountToolTabs(){
  if(document.querySelector('.suite-tabs'))return;
  if(!document.getElementById('suite-tabs-style')){
    const style=document.createElement('style');
    style.id='suite-tabs-style';
    style.textContent=`
      .suite-tabs{display:inline-flex;align-items:center;gap:4px;width:max-content;padding:4px;border:1px solid #ffffff1d;border-radius:15px;background:#080d16d9;box-shadow:0 12px 34px #0007;backdrop-filter:blur(14px)}
      .suite-tabs a{display:flex;align-items:center;justify-content:center;min-height:34px;padding:0 15px;border-radius:11px;color:#96a4b8;font-size:13px;font-weight:850;text-decoration:none;white-space:nowrap;transition:background .15s ease,color .15s ease,border-color .15s ease}
      .suite-tabs a:hover{color:#eef5ff;background:#ffffff0d}
      .suite-tabs a.active{color:#eef5ff;background:linear-gradient(180deg,#ffffff20,#ffffff0d);box-shadow:inset 0 0 0 1px #ffffff24}
      .suite-tabs .short-label{display:none}
      @media(max-width:620px){.suite-tabs{width:100%;display:grid;grid-template-columns:1fr 1fr}.suite-tabs a{padding:0 10px}.suite-tabs .long-label{display:none}.suite-tabs .short-label{display:inline}}
    `;
    document.head.appendChild(style);
  }
  const nav=document.createElement('nav');
  nav.className='suite-tabs';
  nav.setAttribute('aria-label','도구 전환');
  nav.innerHTML=`
    <a class="active" href="./" aria-current="page"><span class="long-label">플립북 재생</span><span class="short-label">재생</span></a>
    <a href="./flipbook-rgba-packer/"><span class="long-label">RGBA 패킹</span><span class="short-label">패킹</span></a>
  `;
  const app=document.querySelector('.app');
  if(app)app.prepend(nav);else document.body.prepend(nav);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountToolTabs,{once:true});else mountToolTabs();

new Function('applyFilters','defaultFilters','FILTER_PRESETS','RAMPS','smartDetect','saveCanvasPNG','saveFramesZip','decodeGifFrames',p1+p2+p3+p4+p5+p6+p7+p8+p9+p10)(applyFilters,defaultFilters,FILTER_PRESETS,RAMPS,smartDetect,saveCanvasPNG,saveFramesZip,decodeGifFrames);

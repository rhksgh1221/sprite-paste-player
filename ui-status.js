const $=id=>document.getElementById(id);
const style=document.createElement('style');
style.textContent=`
.quickStatus{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:0}
.quickChip{min-height:42px;border:1px solid #ffffff18;border-radius:14px;background:#0004;padding:7px 9px;display:grid;gap:3px;align-content:center;overflow:hidden}
.quickChip b{font-size:10px;color:var(--sub);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.quickChip span{font-size:12px;color:var(--text);font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.quickChip.on span{color:var(--cyan)}
@media(max-width:620px){.quickStatus{grid-template-columns:1fr 1fr}}
`;
document.head.appendChild(style);

const quick=document.querySelector('.quick');
const status=document.createElement('div');
status.className='quickStatus';
status.innerHTML=`
  <div class="quickChip"><b>Sheet</b><span id="qsSheet">-</span></div>
  <div class="quickChip"><b>Frames</b><span id="qsFrames">-</span></div>
  <div class="quickChip"><b>FPS</b><span id="qsFps">-</span></div>
  <div class="quickChip"><b>Offset</b><span id="qsOffset">-</span></div>
  <div class="quickChip" id="qsFilterBox"><b>Filter</b><span id="qsFilter">Off</span></div>
`;
if(quick)quick.insertAdjacentElement('afterend',status);

function value(id,fallback='-'){const el=$(id);return el?String(el.value??el.textContent??fallback):fallback}
function checked(id){const el=$(id);return !!(el&&el.checked)}
function text(id,fallback='-'){const el=$(id);return el?String(el.textContent||fallback):fallback}
function labelFromSelect(id){const el=$(id);if(!el)return '-';const opt=el.options?.[el.selectedIndex];return opt?opt.textContent:el.value}
function update(){
  const cols=value('cols','-'),rows=value('rows','-'),frames=text('count','-');
  const interval=Number(value('interval','0'));
  const fps=interval>0?(1000/interval).toFixed(1):'-';
  const ox=value('ox','0'),oy=value('oy','0');
  const filterOn=checked('fEnable');
  const effects=[];
  const gradeOn=['fBright','fContrast','fSat','fHue'].some(id=>Number(value(id,'0'))!==0);
  if(gradeOn)effects.push('Grade');
  if(checked('fCel'))effects.push('Cel');
  if(checked('fPixel'))effects.push('Pixel');
  if(checked('fOutline'))effects.push('Outline');
  if(checked('fAlpha'))effects.push('Alpha');
  if(checked('fRamp'))effects.push(`Ramp:${labelFromSelect('fRampPreset')}`);
  const filterText=filterOn?(effects.slice(0,2).join(' + ')||'On'):'Off';
  const box=$('qsFilterBox');
  if($('qsSheet'))$('qsSheet').textContent=`${cols} × ${rows}`;
  if($('qsFrames'))$('qsFrames').textContent=frames;
  if($('qsFps'))$('qsFps').textContent=fps==='-'?'-':`${fps}`;
  if($('qsOffset'))$('qsOffset').textContent=`${ox}, ${oy}`;
  if($('qsFilter'))$('qsFilter').textContent=filterText;
  if(box)box.classList.toggle('on',filterOn);
}

['input','change','click'].forEach(evt=>document.addEventListener(evt,()=>requestAnimationFrame(update),true));
setInterval(update,500);
requestAnimationFrame(update);

const STORE_KEY='spritePastePlayer.filterCategory.v1';
const style=document.createElement('style');
style.textContent=`
.filterCategoryBar{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:2px 0 4px;padding:6px;border:1px solid #ffffff14;border-radius:16px;background:#0004}
.filterCategoryBtn{height:34px;border:0;border-radius:11px;background:transparent;color:var(--muted);font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap}
.filterCategoryBtn.active{color:var(--text);background:linear-gradient(180deg,#ffffff1c,#ffffff0c);box-shadow:inset 0 0 0 1px #fff2}
.filterSummary{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 2px;color:var(--muted);font-size:11px}
.filterSummary span{padding:5px 8px;border:1px solid #ffffff14;border-radius:999px;background:#0003}
.filterCard.is-hidden{display:none}
.filterGrid.compact{grid-template-columns:1fr;gap:8px}
.filterGrid.compact .filterCard{padding:9px 10px}
.filterAdvanced{display:none;gap:8px;margin-top:2px}
.filterCard:has(input[type="checkbox"]:checked) .filterAdvanced{display:grid}
@media(max-width:620px){.filterCategoryBar{grid-template-columns:1fr 1fr}.filterCategoryBtn{height:36px}}
`;
document.head.appendChild(style);
const groups=[['all','전체'],['color','색상'],['texture','픽셀/노이즈'],['light','빛/윤곽'],['distort','왜곡'],['stylize','스타일화']];
const map={Pixelate:'texture',Posterize:'color',Ramp:'color',Dither:'texture',Noise:'texture',Outline:'light',Bloom:'light',Chromatic:'distort',Glitch:'distort','FX Sketch':'stylize'};
function labelOf(card){return card.querySelector('.filterHead span')?.textContent?.trim()||''}
function countActive(group,cards){return cards.filter(card=>group==='all'||card.dataset.group===group).length}
function updateSummary(cards){const box=document.querySelector('.filterSummary');if(!box)return;const enabled=[...cards].filter(card=>card.querySelector('input[type="checkbox"]')?.checked).map(labelOf);box.innerHTML=enabled.length?enabled.slice(0,6).map(v=>`<span>${v}</span>`).join(''):'<span>활성 필터 없음</span>'}
function apply(group,cards){cards.forEach(card=>card.classList.toggle('is-hidden',group!=='all'&&card.dataset.group!==group));document.querySelectorAll('.filterCategoryBtn').forEach(btn=>btn.classList.toggle('active',btn.dataset.group===group));const grid=document.querySelector('.filterGrid');if(grid)grid.classList.toggle('compact',group!=='all');localStorage.setItem(STORE_KEY,group);updateSummary(cards)}
function init(){const grid=document.querySelector('.filterGrid');if(!grid||document.querySelector('.filterCategoryBar'))return;const cards=[...grid.querySelectorAll('.filterCard')];cards.forEach(card=>{card.dataset.group=map[labelOf(card)]||'color'});const summary=document.createElement('div');summary.className='filterSummary';const bar=document.createElement('div');bar.className='filterCategoryBar';bar.innerHTML=groups.map(([id,label])=>`<button type="button" class="filterCategoryBtn" data-group="${id}">${label} <small>${countActive(id,cards)}</small></button>`).join('');grid.before(summary,bar);bar.addEventListener('click',e=>{const btn=e.target.closest('.filterCategoryBtn');if(btn)apply(btn.dataset.group,cards)});['input','change','click'].forEach(evt=>document.addEventListener(evt,()=>requestAnimationFrame(()=>updateSummary(cards)),true));apply(localStorage.getItem(STORE_KEY)||'all',cards)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

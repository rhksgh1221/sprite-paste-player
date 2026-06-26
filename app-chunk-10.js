export default `
function ensureCellScaleUI(){if(E.cellScale)return;let anchor=E.cellSize?.closest('.row')||document.querySelector('[data-target="cellSize"]')?.closest('.row');if(!anchor)return;let row=document.createElement('div');row.className='row';row.innerHTML='<label>셀 내부크기</label><div class="scrub" data-target="cellScale" data-min="10" data-max="300" data-step="5"><i class="fill"></i><span>확대/축소</span></div><input id="cellScale" type="number" min="10" max="300" step="5" value="100">';anchor.after(row);E.cellScale=document.getElementById('cellScale');E.cellScaleTxt=document.getElementById('cellScaleTxt');bindNum(E.cellScale,sheet)}
[E.fEnable,E.fBypass,E.fBright,E.fContrast,E.fSat,E.fHue,E.fCel,E.fCelSteps,E.fPixel,E.fPixelSize,E.fOutline,E.fOutlineWidth,E.fOutlineColor,E.fAlpha,E.fAlphaTh,E.fAlphaValue,E.fAlphaGen,E.fAlphaMode,E.fAlphaSmooth,E.fAlphaSmoothRadius,E.fDrop,E.fDropColor,E.fDropTol,E.fDropSoft,E.fRamp,E.fRampPreset,E.fRampMix,E.fRampColor0,E.fRampColor1,E.fRampColor2,E.fRampColor3].forEach(bindFilter);
E.fReset.onclick=()=>{S.filters=defaultFilters();saveFilters();syncFilters();draw();updateSheet(false)};
E.fPreset.onclick=()=>{let p=FILTER_PRESETS[S.preset++%FILTER_PRESETS.length];S.filters=Object.assign(defaultFilters(),p[1]);saveFilters();syncFilters();draw();updateSheet(false);toast('프리셋 적용: '+p[0])};
document.querySelectorAll('.tabBtn').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
ensureCellScaleUI();setLoaded(false);syncFilters();info();initScrub();tab(localStorage.getItem('spritePastePlayer.activeTab.v1')||'playback');
`;

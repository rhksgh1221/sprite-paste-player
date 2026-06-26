export default `
[E.fEnable,E.fBypass,E.fBright,E.fContrast,E.fSat,E.fHue,E.fCel,E.fCelSteps,E.fPixel,E.fPixelSize,E.fOutline,E.fOutlineWidth,E.fOutlineColor,E.fAlpha,E.fAlphaTh,E.fAlphaValue,E.fAlphaGen,E.fAlphaMode,E.fAlphaSmooth,E.fAlphaSmoothRadius,E.fDrop,E.fDropColor,E.fDropTol,E.fDropSoft,E.fRamp,E.fRampPreset,E.fRampMix,E.fRampColor0,E.fRampColor1,E.fRampColor2,E.fRampColor3].forEach(bindFilter);
E.fReset.onclick=()=>{S.filters=defaultFilters();saveFilters();syncFilters();draw();updateSheet(false)};
E.fPreset.onclick=()=>{let p=FILTER_PRESETS[S.preset++%FILTER_PRESETS.length];S.filters=Object.assign(defaultFilters(),p[1]);saveFilters();syncFilters();draw();updateSheet(false);toast('프리셋 적용: '+p[0])};
document.querySelectorAll('.tabBtn').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
setLoaded(false);syncFilters();info();initScrub();tab(localStorage.getItem('spritePastePlayer.activeTab.v1')||'playback');
`;

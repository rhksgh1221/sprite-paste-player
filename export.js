export function saveCanvasPNG(canvas,filename){const a=document.createElement('a');a.download=filename;a.href=canvas.toDataURL('image/png');a.click()}
export async function saveAllFramesZip(){alert('전체 프레임 ZIP 저장은 다음 단계에서 연결할게. 현재 구조는 export.js로 분리 완료됐어.')}

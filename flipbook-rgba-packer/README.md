# Flipbook RGBA Packer v2.3.0

게임 VFX 플립북의 프레임을 사용자가 지정한 순서대로 R/G/B/A 채널에 기록하는 로컬 도구입니다.

## 실행

`index.html`을 최신 Edge 또는 Chrome으로 열면 됩니다. Windows에서는 `RUN_WINDOWS.bat`을 실행해도 됩니다.

## 주요 기능

- Source Grid와 사용 프레임을 수동 지정
- 입력 순서대로 R → G → B → A 채널 배치
- 3×3 / 9프레임처럼 4의 배수가 아닌 선택 지원
- 부족한 마지막 채널과 빈 Pack 슬롯은 0으로 채움
- 기본 마스크 추출 방식 Max RGB
- Alpha, Luminance, R/G/B 선택 지원
- 최종 출력 Pack Grid와 가로·세로 픽셀 수 수동 지정
- Bilinear / Nearest 채널별 독립 리사이즈
- 32bit RGBA TGA 직접 생성
- Source→RGBA 및 TGA 재해석 이중 검증
- 좁은 화면·브라우저 확대율에 대응하는 반응형 UI
- 파일 일괄 처리, Preset, 결과 ZIP

## 기본 패킹 규칙

선택 프레임 목록을 4개씩 묶습니다.

```text
1번째 → R
2번째 → G
3번째 → B
4번째 → A
```

예: `0,1,2,3,4,5`라면 Pack 1은 R0/G1/B2/A3, Pack 2는 R4/G5/B0/A0입니다. 여기서 0은 빈 채널 값입니다.

## 개인정보

입력 파일은 브라우저 밖으로 전송되지 않습니다.

## License

MIT

# K-GX E-SFC Policy Lab — 리디자인 핸드오프

시안: `K-GX E-SFC Policy Lab.dc.html` (5개 화면, 상단 탭으로 전환), `ChartCard.dc.html`.
토큰: `design-tokens.json`. 구현 대상: Next.js App Router + 순수 CSS(CSS Modules 권장) + recharts + KaTeX.

## 원칙
- 연구용 계기판. 면은 그림자 대신 1px 선으로 나눈다. 크림 바탕(`paper.bg`) 위에 흰 계열 카드(`paper.surface`).
- 네이비 = 구조·현재값·주요 텍스트. 골드 = "사용자가 바꾼 것"(변경 표시, 기본값 눈금, 고정 A안)과 섹션 eyebrow.
- 숫자는 모두 tabular numerals(`font-feature-settings:'tnum'`), 음수는 U+2212 `−`.
- 색만으로 의미를 전달하지 않는다: Δ는 ▲▼＝, 판정은 ✓/✕ + 글자, 등급은 채움/외곽선/점선, 부호표는 +/−.

## CSS 변수 이름 제안
`--navy-900`, `--gold-400`, `--paper-bg`, `--line`, `--text-2`, `--delta-pos`, `--ok-fg` … (`design-tokens.json` 경로를 kebab-case로)

## 반응형
- 1440: 패널 300 + 본문 ≈1056. KPI 4열, 차트 3열(`repeat(auto-fill,minmax(310px,1fr))`).
- 1024: 본문 ≈656. KPI 4열 유지, 차트 2열. 넓은 표(거래흐름행렬·부호표)는 가로 스크롤, 첫 열 sticky.
- 미디어쿼리 없이 grid `auto-fill/minmax`로 대응. 1024 미만은 범위 밖(필요 시 패널을 드로어로).

---

## 컴포넌트

### AppShell
- 구조: `NavBar`(sticky top, 56px) + `<main>` (max-width 1440, padding `28px clamp(20px,2.5vw,32px) 72px`, 세로 gap 28).
- 페이지 헤더: eyebrow(`01 · 개요`, gold-500 12/600) → h1(28/700 navy-900) → lead(15/1.75, max-width 880).
- 실험실·정합 화면은 `ComparisonBar` + 2열 grid(`300px minmax(0,1fr)`, gap 20, align-items:start).

### NavBar
- 배경 navy-950, 하단 선 #22355C. 좌측 제품명(15/700 흰색) + 부제(11, #97A3BA).
- 탭: 높이 100%, padding 0 12, 13.5px. 비활성 #B9C3D6/500, hover 흰색, 활성 흰색/600 + 하단 2px gold-300.
- 라우트: `/`, `/study`, `/lab`, `/alignment`, `/registry`. 활성 판정은 `usePathname()`.

### ControlPanel
- sticky `top:72px`, `max-height:calc(100vh - 88px)`, 내부 3단: 상단 고정(드롭다운 3개) / 도구줄 / 스크롤 영역 / 하단 변경 요약.
- 드롭다운: 메가프로젝트 공급 시나리오(G·R·M·N), 전력시장·요금 설계, 한국은행 반응함수. 라벨 12/600 text-2, select 32px.
- 도구줄(bg `paper.subtle`): 검색 입력(⌕ 아이콘, × 지우기; 이름·id·출처 대상) / `Segmented` [전체 N | 변경됨 n] / "모두 접기·펼치기".
- 그룹 헤더(접이식 버튼): ▼/▶ + 그룹명(13/700) + 변경 배지(`● n`, gold-100 바탕) + 파라미터 수. 검색 중이거나 "변경됨" 필터가 켜지면 일치 그룹은 강제로 펼친다. 결과 없음 상태 문구 제공.
- 하단 바: 변경이 있을 때만. `● n개 변경됨` + [모두 되돌리기].
- 상태: `{scenario, market, cb, values, collapsed, query, changedOnly}` — 실험실과 정합 화면이 공유(Context 또는 URL search params).

### ParamSlider
- 1행: 변경 점(6px, gold-400; 기본값이면 투명) · 라벨(12.5) · `GradeBadge` · 값(13/600; 변경 시 gold-600) · 단위(11 muted) · 되돌리기 ↺(기본값이면 opacity .25 + disabled).
- 2행: `<input type=range>` (`accent-color: navy-700`). 트랙 아래 기본값 위치에 2×5px gold-300 눈금(`left: calc(7px + (100% - 14px) * frac)`).
- 이진 파라미터(`toggle`)는 슬라이더 대신 `Segmented` [켬|끔].
- 3행: 출처 한 줄(11 muted). 변경 시 우측에 `기본 1.5`.
- 변경된 행 배경 `paper.changedRow`.
- props: `{id,label,value,default,min,max,step,unit,grade,source,kind:'range'|'toggle',onChange,onReset}`. 표시 자릿수 = step의 소수 자릿수.

### Segmented
- 컨테이너: inline-flex, padding 2, gap 2, 1px `line.strong`, radius 5, 흰 바탕.
- 항목: 높이 24–26, padding 0 9–12, 12px. 선택 = navy-900 바탕/흰 글자/600, 비선택 = 투명/text-2/500.
- 사용처: 변경 필터, 켬/끔, 거래흐름행렬↔대차대조표, 연도(2026·2030·2035·2040·2050), 등록부 등급 필터.
- `role="radiogroup"` + 화살표 키 이동.

### KpiTile
- 카드(surface, 1px line, radius 6, padding 12 14). 라벨 12 text-2 → 값 24/700 navy-900 + 단위 12 muted → Δ 줄.
- Δ: `▲ +2.27 기준 대비`. 양수 `delta.positive`(파랑), 음수 `delta.negative`(주홍), |Δ| < 반올림 단위면 `＝ 0.00` muted. 값과 Δ의 자릿수는 지표별로 지정.
- Δ는 방향(증감)이지 좋고 나쁨이 아니므로 녹/적을 쓰지 않는다.
- props: `{label, value, unit, digits, base?, deltaDigits}` — `base` 없으면 Δ 줄 생략.

### ChartCard
- 카드 안에 제목(14/600 navy-900) + 단위(12 muted) → 플롯(176px) → x축 → 범례.
- recharts: `LineChart` + `CartesianGrid horizontal only stroke=chart.grid` + `YAxis width=44 tick 11` + `XAxis ticks=[2026,2030,…,2050]`.
- 현재 = 실선 2px, 기준 = **같은 색** 점선 `4 3`, 1.4px, opacity .8. 범례 끝에 "— 현재 ┄ 기준" 열쇠(기준이 있을 때).
- 시리즈 색 순서 `chart.series`; 시나리오 비교 차트는 `chart.scenario` G/R/M/N, 참조선(K-ETS 상한 등)은 `chart.reference`.
- 툴팁: navy-950 바탕, 연도 + 시리즈별 현재값·기준값. 커서 세로선 navy 35%.
- y축 눈금은 1·2·2.5·5 단위 nice step, 4칸 내외.

### DataTable
- 컨테이너 surface + 1px line + radius 6, `overflow-x:auto`.
- th: sunken 바탕, 12/600 text-2, padding 8–9 × 10–14, 숫자 열 우측 정렬. 등록부는 `position:sticky; top:56px`.
- td: 12.5–13px, 행 구분 `line.row`, 상단 정렬, 숫자 열 tabular + 우측 정렬.
- 합계 행: `navy.50` 바탕 + 700. 변경 행(등록부): `paper.changedRow` + 현재값 gold-600/700.
- 등록부 필터: 블록(select) · 등급(Segmented, 개수 표시) · 계보(select) · 검색 · [현재 시나리오 JSON 내보내기](유일한 primary 버튼, navy 채움). 결과 개수 표시. 224행이므로 가상 스크롤은 불필요.

### MatrixTable
- 거래흐름행렬/대차대조표 공용. 열 = 8부문 + `Σ 행`(navy-50 바탕, 좌측 강한 선). 첫 열 sticky left.
- 구획 행(경상·자본 거래 / 금융 거래 / 금융상품 / 실물): subtle 바탕, 11.5/700 gold-500.
- 0 셀은 `·`(#C4BBA6), 음수 text-2, 양수 text-1.
- 하단 `Σ 열` 행(700). 헤더 우측에 검사 `StatusBadge`: "행합·열합 = 0 · 최대 |잔차| 3.4e-13". 대차대조표는 "금융상품 행합 = 0 · 순자산 합 = 실물자본".
- 헤더 도구: `Segmented`(행렬 종류) · 단위 설명 · `Segmented`(연도).
- 방법론 스터디의 부호표도 같은 골격(셀에 22px +/− 칩, `color.sign`).

### StatusBadge
- pill(radius 999, padding 2–4 × 8–10, 12/600). 글리프 + 글자 필수: `✓ 정합`, `✕ 불일치`, `✓ SFC 검사 통과`.
- variants: `ok`, `bad`. 요약 카운트(`✓ 정합 4`, `✕ 불일치 2`)에도 사용.

### GradeBadge
- 17–18px 정사각, radius 3, 10.5–11/700.
- A = navy 채움·흰 글자 / B = navy-100 바탕·실선 외곽 / C = 투명·골드 **점선** 외곽. 흑백·색약에서도 채움-선-점선으로 구분.
- `title="등급 A"` 및 `aria-label` 부여.
- 같은 문법의 출처 배지: 공식(채움) / 보도(외곽선) / ? 미확인(점선).

### Callout
- `gold.50` 바탕, 1px `gold.200`, radius 6, padding 16 18. 좌측 22px 원형 아이콘(gold-400, "!"). 제목 14/700 gold-700, 본문 13/1.7.
- 좌측 굵은 색 띠는 쓰지 않는다.

### QSection
- 상단 1px `line.strong` 구분 + padding-top 12.
- 헤더: `Q1` 칩(navy-900 바탕, 13/800 흰색) + 질문 h3(17/700, `text-wrap: pretty`).
- "도구에서의 처리" 블록: sunken 바탕, radius 5, 13/1.7, 앞에 굵은 라벨.
- 본문: KpiTile 행(auto-fit minmax 150) → 표·차트 grid(auto-fit minmax 310).

### ComparisonBar (실험실·정합 상단)
- 비교 기준 select(K-GX 없음 / 메가프로젝트 없음 / 파라미터 기본값 / 고정한 A안) — 앞에 점선 아이콘으로 "점선 = 기준"을 상기.
- [현재 설정을 A안으로 고정] → 고정 후 기준을 A안으로 전환하고 `A안 고정됨 · 14:32 · 변경 n개` 칩 표시.
- [파라미터 전체 초기화]. 우측 끝 `StatusBadge ok`: "SFC 검사 통과 · 최대 잔차 6.4e-12 조원".

## KaTeX
`katex/dist/katex.min.css` 전역 import, 수식 셀은 `katex.renderToString(tex, {throwOnError:false})` (서버 컴포넌트에서 렌더 가능). 원문 수식 열 15px.

## 시안의 목업 데이터
- 차트·KPI·행렬 수치는 슬라이더에 반응하는 간이식으로 만든 것이다. 실제 값은 엔진 출력으로 바꿀 것.
- 스크린샷에서 잘린 부분(참조모형 2–5의 역할 문구, Q2–Q5 질문·처리 문단, 식 번호·쪽 번호, 일부 파라미터 출처)은 시안용으로 채운 문구다. 원문으로 교체 필요.
- 등록부는 53행만 수록(스크린샷 13행 + 슬라이더 40개). 실제 224행은 `params.py`, `params_esfc.py`에서.

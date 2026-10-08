# K-GX E-SFC Policy Lab

Track B 연구("Climate-consistent fiscal policy for the megaprojects and K-GX")를 위한 PLANiT Institute의 정책분석 실험 도구.
DEFINE-UK 계열 생태 스톡-플로우 정합(E-SFC) 모형을 연간 축약형으로 구현하고, 전력 원장(Layer 1)·K-GX 재정/정책금융·K-ETS를 같은 회계 안에 붙였다.

> **상태: v0.1 실험판 (2026-10-08).** 모형 선택과 보정은 미확정이다.
> 행태 파라미터 대부분이 등급 C이므로 결과는 수준이 아니라 기준 대비 차이·부호·순서로 읽는다. 이 저장소는 방법론 학습·논의용 샌드박스이며 연구 결과물이나 정책 권고가 아니다.

## 무엇을 하나

| 화면 | 내용 |
|---|---|
| `/` 개요 | 연구 질문, 구조, 연구 설계 Step 1–4 ↔ 도구, 방법론 쟁점 ↔ 모듈, K-GX 사실(출처 등급) |
| `/study` 방법론 스터디 | 참조모형 5종의 핵심 식(원문 식 번호·쪽)과 이 도구의 구현, 대차대조표 구조와 폐쇄 |
| `/lab` DEFINE-UK E-SFC 실험실 | 반응함수 5종, 신용할당, 녹색비중·GDCR, 재정준칙, 채무 프리미엄, SFF 피해함수 실험. 거래흐름행렬·대차대조표 실시간 검사 |
| `/alignment` 전력 × K-GX 정합 | 방법론 쟁점 Q1–Q5 순서: 배출→재정 경로와 귀착, K-GX 봉투, 시장설계, LNG·환율 물가, K-ETS |
| `/registry` 등록부 | 파라미터 224개의 값·범위·단위·등급·출처·계보, 시나리오 JSON 내보내기 |

## 참조모형 (계보)

| 코드 | 문헌 | 쓰임 |
|---|---|---|
| DEF | DEFINE-UK Model Manual v1.1 (Sep 2026) | 부문 구성, 신용할당(식183–184, 224–225), 녹색비중(185), 전력 한계가격(89–91), 비화석 비중 로짓(109), 금리 규칙(427) |
| SFF | Dafermos, Nikolaidi & Galanis (2017) Ecol. Econ. 131 | 녹색/일반 투자 분할(식68–70), 투자함수(62), 피해함수와 생산성/자본 분할(55–57) |
| MFM | World Bank MFMod Technical Description (2019, WP 8965) | 재정 항등식, 테일러 규칙, 하이브리드 필립스(축약), 채무 프리미엄(기본 폐쇄에는 없음 → 스위치) |
| MFE | Electricity Transition in MFMod (2024, WP 10854) | 전력계획 → 거시 soft-link: capex 수입비중, 연료 수입, 요금 → CPI, 전력자본 이중계상 방지 |
| GMM | IMF WP/2023/269 Getting to Know GMMET | 재생+백업 구조 → VRE 비중에 볼록한 가스 보강·저장 요구 |
| L1 | PLANiT Track B Layer-1 ledger (`params.py`) | 부하·믹스·비용·배출·요금 파라미터와 출처 ID(S01…) |
| KGX | K-GX 전략 국민보고회(2026-10-07) 등 | 재정 200조·기후금융 790조·민간 220조, 녹색국채 2028, 생산세액공제, 지역별 요금 |

## 구조

```
src/engine/params.ts   파라미터 등록부(유일한 숫자 출처)
src/engine/model.ts    엔진: 2025 보정 → 2026–2050 연간 해, 거래 원장, 대차대조표, 검사, 귀착
src/lib/content.ts     스터디 내용(식·출처), 방법론 쟁점 매핑, K-GX 사실
src/app/*              Next.js App Router 페이지(전부 정적 프리렌더, 엔진은 브라우저에서 실행)
tests/engine.test.ts   16개 테스트(240개 조합의 SFC 정합 + 행태 검사)
docs/MODEL.md          식 목록(계산 순서), 폐쇄, 보정, 한계
```

엔진은 의존성 없는 순수 TypeScript다. 서버 함수가 없으므로 Vercel에는 정적 사이트로 올라간다.

## 실행

```bash
npm ci
npm test          # node --test (Node 22.6+ 의 TS 타입 제거 기능 사용; Node 23.6+ 권장)
npm run dev       # http://localhost:3000
npm run build     # 정적 빌드 + 타입 검사
```

엔진만 쓰기:

```ts
import { run, at, incidence } from "./src/engine/model.ts";
const s = run({ rule: "ait", design: "admin", supply: "R", params: { ets_mode: 1 } });
const b = run({ rule: "ait", design: "admin", supply: "R", params: { ets_mode: 1, mp_on: 0 } });
at(s, 2035, "dE"); incidence(s, b, 2026, 2035); s.maxCheck; // SFC 최대 잔차
```

## 검사

매년: 부문 순대출 합 = 0, 잉여식(국채 보유 합 = 발행, 계산에 쓰지 않음), 각 상품의 부문 합 = 0, 부문별 순대출 = 순금융자산 증감, GDP 지출 = 소득.
`npm test`가 반응함수 5 × 시장설계 3 × 공급 시나리오 4 × 스위치 묶음 4 = 240개 조합 모두에서 이를 1e-8 조원 이내로 확인하고,
워터베드·요금 이연·금리 채널·CfD WACC·AIT look-through·LNG/FX 전가·정책금융 대차·재정준칙·피해함수의 방향을 검사한다.

## Vercel 배포

페이지에는 `noindex`가 설정되어 있다.

1. Vercel → Add New → Project → GitHub `PLANiT-Institute/kgx-esfc-lab` Import
2. Framework: Next.js (자동 감지), Root Directory: `./`, Build: `npm run build`, Install: `npm ci`, 환경변수 없음
3. Deploy. 이후 `main` 푸시마다 자동 배포, PR마다 미리보기

CLI: `npx vercel` (미리보기) → `npx vercel --prod`.

## 다음 단계 (제안, 미승인)

- 초기 스톡을 한은 자금순환표 2025로 교체(현재 등급 C), 국고채 스프레드–채무비율 회귀로 `mu1` 한국 추정
- 790조의 기관·수단별 표(금융위) 확보 시 `pf_*` 교체, D2 기대손실 가중 재계산
- 산업연관표로 간접 물가 전가(`io_el`) 재계산(Choi 2013과 약 4배 차이)
- 시장설계 위험프리미엄(`rp_cfd`, `rp_pool`)의 한국 근거: IPP PF 조건 자료
- 모형 선택(DEFINE-UK 확장 vs 별도 구축)은 별도 검토 후 결정

## 라이선스

미정. DEFINE-UK 원 코드는 포함하지 않았다(식 형태만 참조).

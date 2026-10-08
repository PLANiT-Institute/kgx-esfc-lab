// Study content: reference models, implementation map, Track B methodological issues (Q1-Q5), K-GX facts.
// Equation numbers/pages refer to the original documents; "구현" = what this tool actually codes (simplified, annual).

export interface Eq { id: string; tex: string; ref: string; impl: string }
export interface ModelCard {
  key: string;
  title: string;
  cite: string;
  url: string;
  role: string;
  adopt: string[];
  omit: string[];
  eqs: Eq[];
}

export const MODELS: ModelCard[] = [
  {
    key: "DEF",
    title: "DEFINE-UK Model Manual v1.1",
    cite: "DEFINE-UK v1.1 manual, September 2026 (define-model.org) — 7부문(가계·비금융기업·전력·MFI·NMFI·정부·해외), 분기, 영국 국민계정 기반",
    url: "https://define-model.org/wp-content/uploads/2026/09/define_uk_manual_1_1_sep26.pdf",
    role: "핵심 골격. 부문 구성, 신용할당, 녹색투자 비중, 전력가격 결정(한계비용·평균비용 혼합), 금리 규칙의 형태를 그대로 따른다.",
    adopt: [
      "부문별 순대출 = 순금융자산 증감, 잉여식(국채 보유 합 = 발행) 매기 검사",
      "투자 = 희망투자 × (1 − 신용할당률), 신용할당은 DSR·BIS비율의 로지스틱(식 183–184, 224–225)",
      "녹색 비중 로짓(식 185), 전력부문 비화석 비중의 상대수익 로짓(식 109) — '내생 믹스' 스위치",
      "전력가격 = 비화석 평균비용과 화석 한계비용 사이(식 89–91) — '한계가격 풀' 설계",
      "정책금리 Δln r = ε(α ln INF₋₁ − ln r₋₁)(식 427) — 'DEFINE 규칙' 선택지",
      "대출금리 = 정책금리 + 스프레드(식 428–431의 축약)",
    ],
    omit: [
      "NMFI(연기금·보험) 별도 부문 → 가계에 통합(국채 보유에 반영)",
      "주식·주택시장, 임금몫 로지스틱(식 59), 전력·생산 2×2 레온티에프(식 171–175)",
      "좌초자산 동학(식 137–143), 분기 빈도 → 연간",
      "AIT는 DEFINE-UK에 없음(후행 규칙만) — 별도 모듈로 추가",
    ],
    eqs: [
      { id: "식183–184", tex: "\\frac{I^D_t}{K_{t-1}}=\\alpha_0+\\alpha_1(u_{t-1}-u_T)+\\ldots,\\quad I_t=(1-CR_t)\\,I^D_t", ref: "PDF 32", impl: "gK = gK0 + a_u(u₋₁−u₀) + a_p(rp₋₁−rp₀) − a_r(rr−rr₀); I = (1−CR)/(1−CR₀)·P(gK+δ)K₋₁" },
      { id: "식224–225", tex: "CR^*_t=\\frac{CR_{max}}{1+r_0e^{\\,r_1-r_2DSR_{t-1}+r_3(CAR_{t-1}-CAR_{min})}}", ref: "PDF 36", impl: "cr_max, cr_dsr, cr_car (2025에 CR₀=5%로 보정)" },
      { id: "식185", tex: "\\beta_t=\\alpha_0+\\alpha_1\\tanh(P^{NELEC}/P^{ELEC})+\\ldots", ref: "PDF 33", impl: "로짓 β = Λ(z₀ + b_τ·KAU + b_r·(r_c − r_g)·100 + b_trend·t)" },
      { id: "식89–91", tex: "P^{ELEC}_t=P^{min}_t+(P^{max}_t-P^{min}_t)(1-\\beta^{NFF}_t)^{\\mu}", ref: "PDF 24", impl: "'한계가격 풀' 설계에서 소매요금 = P^ELEC + 망비용" },
      { id: "식109", tex: "prop^{NFF}_t=\\frac{1}{1+e^{-(\\alpha_0+\\alpha_1(r^{K,NFF}_{t-1}-r^{K,FF}_{t-1}))}}", ref: "PDF 26", impl: "endo_mix=1: 청정 비중 = Λ(b0 + b1·LCOE 격차% − 설계 위험)" },
      { id: "식427", tex: "\\Delta\\ln r_t=\\varepsilon\\,(\\alpha\\ln INF_{t-1}-\\ln r_{t-1})", ref: "PDF 53", impl: "rule='define' (eps_r, alpha_r)" },
    ],
  },
  {
    key: "SFF",
    title: "A stock-flow-fund ecological macroeconomic model",
    cite: "Dafermos, Nikolaidi & Galanis (2017), Ecological Economics 131 — 물리적 흐름(물질·에너지·탄소)과 SFC 금융의 결합",
    url: "https://doi.org/10.1016/j.ecolecon.2016.08.013",
    role: "녹색·일반 투자 분할과 신용할당, 피해함수. 물리계정과 금융계정을 한 체계에 두는 원형.",
    adopt: [
      "녹색 투자비중이 녹색·일반 대출금리 차에 반응(식 70) → GDCR(녹색차등자본규제) 실험",
      "Weitzman형 피해함수와 생산성/자본 경로 분할(식 55–57), 적응률 adK·adP",
      "녹색자본 비중이 배출 원단위를 낮추는 연결(식 44의 축약)",
    ],
    omit: [
      "물질·에너지 매장량 계정과 레온티에프 잠재산출 4제약(식 45–49)",
      "탄소순환·기온 동학 → 전지구 기온 외생 경로(한국 배출은 전지구 기온을 거의 움직이지 않음)",
      "녹색 회사채 시장 → K-GX 녹색국채(2028~) 표지로 대체",
    ],
    eqs: [
      { id: "식62", tex: "I^D=[\\alpha_0+\\alpha_1r_{-1}+\\alpha_2u_{-1}]K_{-1}+\\delta K_{-1}", ref: "p.6", impl: "투자함수 형태(이윤율·가동률)" },
      { id: "식68–70", tex: "I^G=\\beta I^D,\\quad \\beta=\\beta_0+\\beta_1-\\beta_2(int_G-int_C)", ref: "p.7", impl: "b_r·(rLc − rLg), GDCR: rw_g − gdcr, rw_c + gdcr, 스프레드 = chi·gdcr" },
      { id: "식55–57", tex: "D_T=1-\\frac{1}{1+\\eta_1T+\\eta_2T^2+\\eta_3T^{6.754}},\\; D_{TP}=pD_T,\\; D_{TF}=1-\\frac{1-D_T}{1-D_{TP}}", ref: "p.5–6", impl: "dmg_on: 2025 대비 증분 피해만 반영(η₂=0.00284, η₃=5e−6, p=0.1)" },
    ],
  },
  {
    key: "MFM",
    title: "The World Bank Macro-Fiscal Model (MFMod) Technical Description",
    cite: "Burns, Campagne, Jooste, Stephan & Bui (2019), WB Policy Research WP 8965",
    url: "https://documents1.worldbank.org/curated/en/294311565103938951/pdf/The-World-Bank-Macro-Fiscal-Model-Technical-Description.pdf",
    role: "재정 항등식·이자부담·테일러 규칙·물가 방정식의 표준형. 정책기관(재정당국·한은)과 대화할 때 통용되는 형식.",
    adopt: [
      "채무 누적 항등식과 평균 국채금리의 점진 조정(κB)",
      "테일러 규칙(평활 ρ, 물가갭 φπ, 산출갭 φy) — 헤드라인/근원 두 판",
      "하이브리드 필립스(후행 관성 + 목표 고정 기대 + 비용 전가 + 갭)의 축약",
      "채무 연동 국채 프리미엄: MFMod 기본 폐쇄에는 없음 → 스위치(prem_on, 기본 0), 계수는 Canelli 2024",
    ],
    omit: ["UIP 환율 결정 → 환율은 외생 충격(fx_shock)", "콥-더글러스 잠재산출·임금 ECM → 자본·생산성 추세 기반 가동률"],
    eqs: [
      { id: "Taylor", tex: "i_t=\\rho i_{t-1}+(1-\\rho)[r^*+\\pi^*+\\phi_\\pi(\\pi_{t-1}-\\pi^*)+\\phi_y\\,gap_{t-1}]", ref: "Eq.49", impl: "rule='taylorH'/'taylorC'; φπ 1.5(한국 추정 0.30–2.06), φy 0.48" },
      { id: "Debt", tex: "B_t=B_{t-1}-NL^{GOV}_t,\\quad i^B_t=i^B_{t-1}+\\kappa_B(i_t+tp+prem_t-i^B_{t-1})", ref: "Eqs.26–38", impl: "prem = μ₁·max(0, (B+α_off·장부밖)/Y − 기준)" },
      { id: "Phillips", tex: "\\pi^C_t=\\lambda\\pi^*+(1-\\lambda)\\pi^H_{t-1}+\\kappa_u(u_{t-1}-u_0)+\\theta_{el}\\Delta p^{el}_{t-1}+\\theta_{fx}\\Delta e_t", ref: "Eq.14 축약", impl: "근원(전기·연료 직접분 제외) → 헤드라인은 가중합" },
    ],
  },
  {
    key: "MFE",
    title: "Electricity Transition in MFMod",
    cite: "World Bank Policy Research WP 10854 (2024) — 전력계획모형(EPM 등)과 거시모형의 soft-link",
    url: "https://documents1.worldbank.org/curated/en/099534207172413272/pdf/IDU-7b8800dc-d406-40bd-8ce4-e64ce1541ef5.pdf",
    role: "전력계획 → 거시 연결 방식. 우리 Layer-1 원장(부하·믹스·비용·배출)을 거시 블록에 넘기는 규칙.",
    adopt: [
      "전력 capex를 투자로 넣되 기술별 수입비중을 분리(mimp_*) — 수입 누출",
      "발전연료는 수입(LNG·석탄)으로 유출, 전력가격은 CPI 직접·간접 경로로",
      "전력자본을 GDP 생산능력에 이중 계상하지 않음 → 가동률 분모에서 전력자본 제외",
    ],
    omit: [
      "논문의 CES 연료 둥지 → 시나리오 믹스 또는 DEFINE식 로짓",
      "논문에는 공기업 유틸리티 재정 블록이 없음 → 한국형 전력부문(한전) 부채·이연 계정을 직접 설계",
    ],
    eqs: [
      { id: "soft-link", tex: "\\text{Plan}\\to\\text{Macro}: \\{Gen_k, \\Delta Cap_k, Capex_k(1-m_k)\\to I,\\; Capex_k m_k + Fuel\\to M,\\; P^{el}\\to CPI\\}", ref: "§3.2, Eqs.39–47", impl: "모든 증분 흐름이 거래행렬의 행으로 기록" },
      { id: "CPI", tex: "P^{C,E}=P^{Y,E}(1+levy)", ref: "Eqs.28–31", impl: "가계 전기요금 변화 = π_elec, 가중치 1.61%(통계청)" },
    ],
  },
  {
    key: "GMM",
    title: "Getting to Know GMMET",
    cite: "IMF WP/2023/269 — 4지역 일반균형, 전력기술 CES(σ=20)와 '재생+백업' 효용",
    url: "https://www.imf.org/-/media/files/publications/wp/2023/english/wpiea2023269-print-pdf.pdf",
    role: "간헐성 처리. VRE 비중이 오를수록 백업·저장 요구가 볼록하게 증가한다는 구조를 축약형으로 차용.",
    adopt: [
      "백업 필요 p = (L/M)^{1/γ} 구조 → 가스 보강 비중 φₜ, 저장비율이 계통 VRE 비중의 제곱에 반응(int_on)",
      "통화·재정 규칙은 GIMF 상속(GMMET 고유 기여 아님) — 우리 규칙 선택지와 별개로 취급",
    ],
    omit: ["4지역 일반균형·무역·전기차 둥지", "GMMET 보정값(지역 평균)은 한국 이식 불가 — 형태만 사용"],
    eqs: [
      { id: "Annex I", tex: "p=(L/M)^{1/\\gamma},\\quad B=\\frac{\\gamma pL}{\\gamma+1},\\quad R=\\frac{pL}{\\gamma+1}", ref: "pp.63–65", impl: "φₜ = φ₀ + s·(VRE²ₜ₋₁ − VRE²₂₀₂₅), 저장비율 동일 형태" },
    ],
  },
];

export interface Step { step: string; proposal: string; tool: string }
export const PROPOSAL_STEPS: Step[] = [
  { step: "1. 에너지 시나리오", proposal: "메가프로젝트 부하를 재생/가스/혼합으로 공급; 부하·투자·K-GX 목표는 고정", tool: "공급 시나리오 G·R·M(+N 원전·SMR 선택지), 부하 경로(8.4→18.4GW), 11차 전기본 내재분 차감" },
  { step: "2. 통화 채널", proposal: "사회적 비용 → 물가 → 정책금리 → 녹색산업 자본비용; 고정금리 vs 테일러형", tool: "요금 설계·전가율 → CPI(직접·간접) → 5개 반응함수 → WACC → 재생 설치·녹색투자" },
  { step: "3. 재정 채널", proposal: "NDC/탄소예산 안에서 추가 배출을 메우는 재정노력, K-GX 통화·달력", tool: "K-ETS 수용/경직 → ITMO·국내감축(γ=1−KAU/MAC) → 정부 순차입, D1/D2/D3" },
  { step: "4. 정책 패키지", proposal: "모형 밖에서 설계(재정당국 협의)", tool: "K-GX 수단 배분·추가성 가정을 바꿔 보는 실험대 — 최적화는 하지 않음" },
];

export interface Issue { id: string; q: string; approach: string; module: string; status: string }
export const ISSUES: Issue[] = [
  {
    id: "Q1",
    q: "메가프로젝트 전력 배출은 어떤 경로로 재정 부담이 되는가? 왜 민간 투자자가 아니라 예산·요금에 떨어지는가? '사회적 비용'은 무엇으로 정의하는가?",
    approach: "NDC·K-ETS 상한이 경로를 정한다. 상한이 경직적이면 배출권 가격 상승과 타 업체 감축(워터베드)으로, 상한을 늘려 수용하면 국가가 ITMO·국내 감축으로 메운다. 행정요금 아래에서는 배출권·연료 비용이 소비자에게 다 전가되지 않고 전력부문 부채로 쌓여 공공재정 문제가 된다. 사회적 비용 = 증분 시스템 자원비용(발전·저장·계통 연금 + 연료 + 타 부문 감축 + ITMO)과 그 귀착(데이터센터·소비자·전력부문·예산·ETS 기업).",
    module: "전력×K-GX 정합 › Q1 패널(귀착표), 파라미터 ets_mode·gap_route·sigma·rho_t",
    status: "작동: 귀착표는 '메가프로젝트 없음' 기준 대비 누적(2026–2035)",
  },
  {
    id: "Q2",
    q: "시나리오별 '기후정합 재정 패키지'에는 무엇이 들어가며, 어떤 예산 결정 시점을 겨냥하는가?",
    approach: "K-GX 수단(재정 200조의 보조·세액공제·이차보전·출자·공공투자, 정책금융 790조의 대출·보증·출자, 2028 녹색국채)에 증액 소요를 매핑하고 예산 달력(2027 세제·재정사업, 2028 녹색국채)에 맞춰 본다.",
    module: "전력×K-GX 정합 › Q2 패널(K-GX 봉투 대비 소요, 수단별 흐름)",
    status: "작동: 배분 비율은 공개되지 않아 등급 C 가정",
  },
  {
    id: "Q3",
    q: "전력시장 설계: 행정가격·단일구매자 급전이 독립발전사업자(IPP)의 자금조달을 제약하는 binding constraint일 수 있는가? 민간투자는 가격·시장규칙에 어떻게 반응하는가?",
    approach: "검증 전 가설로 구현. 설계 스위치(행정/CfD/풀)가 재생 WACC 위험프리미엄·요금 전가·이연을 바꾸고, 내생 믹스(DEFINE 식109)는 상대수익에 따라 청정 비중을 정한다. 계통 접속비용은 설계와 무관하게 남는 비용으로 따로 둔다.",
    module: "전력×K-GX 정합 › Q3 패널, 파라미터 rp_cfd·rp_pool·endo_mix·b1_mix",
    status: "작동: 프리미엄 크기는 문헌 방향만 있음(등급 C)",
  },
  {
    id: "Q4",
    q: "물가 경로: 전환 자체나 통화 반응보다 LNG 수입 의존과 환율·에너지가격 충격이 더 잘 입증된 경로 아닌가?",
    approach: "LNG 가격·환율 충격을 명시적 경로로 두고, 요금 설계별 전가(풀=즉시, 행정=이연)와 반응함수별 금리 대응을 분리해 본다.",
    module: "DEFINE 실험실 / 전력×K-GX › Q4 패널, gas_shock·fx_shock",
    status: "작동",
  },
  {
    id: "Q5",
    q: "탄소가격·K-ETS 개편은 재정 선택지에 들어가는가?",
    approach: "K-GX 전략(2026-10-07) 문건 자체에는 K-ETS 개편이 없다(확인). 도구에서는 유상할당 경로(발전 15%→50%), KAU·K-MSR 상한, 상한 경직/수용을 정책 선택지로 둔다.",
    module: "전력×K-GX 정합 › Q5 패널, auction2030·kau_ceiling·ets_mode",
    status: "작동",
  },
];

export interface Fact { k: string; v: string; src: string; url?: string; grade: "official" | "news" | "unverified" }
export const KGX_FACTS: Fact[] = [
  { k: "기간·규모", v: "2026–2035, 재정 200조 + 기후금융 790조 이상 = 정부 1,000조; 민간 10대 시그니처 220조", src: "재경부·기후부 합동 보도자료 2026-10-07", url: "https://www.korea.kr/briefing/pressReleaseView.do?newsId=156784526", grade: "official" },
  { k: "790조 경로", v: "5대 정책금융기관(산은·기은·수은·신보·기보), 지방 50%↑, 중소·중견 70%↑; 2026 목표 56.7조", src: "K-GX 보도자료; 금융위 기후금융 활성화 방안(2026-02-25)", url: "https://www.fsc.go.kr/no010101/86326", grade: "official" },
  { k: "기관별·수단별 분해", v: "공개되지 않음 → 도구는 대출 55%·보증 35%·출자 10%, 전력 30% 가정(등급 C)", src: "미확인", grade: "unverified" },
  { k: "녹색국채", v: "2027 상반기 제도 마련, 2028 최초 발행(규모 미공개)", src: "K-GX 보도자료", grade: "official" },
  { k: "국내생산세액공제", v: "2027 시행, 10년 한시, 태양광·풍력·이차전지·반도체·핵심소재·AI로봇부품; 지역계수 1.0–1.5; 2034 75%·2035 50%·2036 25%", src: "2026 세제개편안 보도(세정일보 2026-08-03)", grade: "news" },
  { k: "선지원·후공제(하이브리드)", v: "대통령 제안, 부총리 '연구' — 확정 정책 아님", src: "아시아경제 2026-10-07", grade: "news" },
  { k: "지역별 산업용 요금", v: "남부권 평균단가 10%(최대 18원/kWh) 인하 등 11개 지역, 경감 약 2.8조 추정, 연내 도입 목표", src: "기후부·한전 공청회 2026-08-26", url: "https://www.korea.kr/news/policyNewsView.do?newsId=148970678", grade: "official" },
  { k: "재생에너지", v: "2030년 100GW 목표, 송전용량 확충, BESS·양수", src: "K-GX 보도자료", grade: "official" },
  { k: "K-ETS 개편", v: "K-GX 문건에 언급 없음", src: "K-GX 보도자료 원문 확인", grade: "official" },
];

export const CAVEATS = [
  "행태 파라미터와 2025 초기 스톡 대부분이 등급 C다. 결과는 수준이 아니라 기준 대비 차이·부호·순서로 읽는다.",
  "연간 축약 모형이다. DEFINE-UK 원 모형의 재현이 아니며, 원문 식 번호는 계보 표시다.",
  "메가프로젝트 자체 투자(데이터센터·반도체 설비)는 시나리오 공통 고정으로 보고 제외했다. 비교 대상은 전력 공급 방식과 정책 조합이다.",
  "모형 선택(DEFINE-UK·GMMET·MFMod 계열)과 보정은 미확정이다. 이 도구는 학습·실험용 샌드박스이며 연구 결과물이 아니다.",
  "'규제가 binding constraint'라는 시장설계 가설(Q3)은 검증 전 가설로 구현했다.",
];

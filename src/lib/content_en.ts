// English version of src/lib/content.ts (same structure; equations and URLs identical).
import { MODELS as KO_MODELS, type ModelCard, type Step, type Issue, type Fact } from "./content";

const tex = (key: string) => KO_MODELS.find((m) => m.key === key)!;

export const MODELS_EN: ModelCard[] = [
  {
    ...tex("DEF"),
    cite: "DEFINE-UK v1.1 manual, September 2026 (define-model.org) — 7 sectors (households, non-financial firms, electricity, MFIs, NMFIs, government, rest of world), quarterly, built on UK national accounts",
    role: "Core skeleton. Sector structure, credit rationing, green investment share, electricity price formation (mix of marginal and average cost) and the form of the rate rule follow DEFINE-UK.",
    adopt: [
      "Sectoral net lending = change in net financial assets; redundant equation (sum of bond holdings = issuance) checked every period",
      "Investment = desired investment × (1 − credit rationing); rationing is logistic in DSR and capital ratio (eqs. 183–184, 224–225)",
      "Green-share logit (eq. 185) and relative-return logit for the power sector's non-fossil share (eq. 109) — the 'endogenous mix' switch",
      "Electricity price between non-fossil average cost and fossil marginal cost (eqs. 89–91) — the 'marginal-price pool' design",
      "Policy rate Δln r = ε(α ln INF₋₁ − ln r₋₁) (eq. 427) — the 'DEFINE rule' option",
      "Lending rate = policy rate + spread (reduced form of eqs. 428–431)",
    ],
    omit: [
      "Separate NMFI sector (pensions · insurance) → merged into households (reflected in bond holdings)",
      "Equity and housing markets, wage-share logistic (eq. 59), 2×2 Leontief between power and production (eqs. 171–175)",
      "Stranded-asset dynamics (eqs. 137–143); quarterly → annual frequency",
      "DEFINE-UK has no AIT (lagged rule only) — added as a separate module",
    ],
    eqs: tex("DEF").eqs.map((e, i) => ({ ...e, id: e.id.replace("식", "Eq. "), impl: [
      "gK = gK0 + a_u(u₋₁−u₀) + a_p(rp₋₁−rp₀) − a_r(rr−rr₀); I = (1−CR)/(1−CR₀)·P(gK+δ)K₋₁",
      "cr_max, cr_dsr, cr_car (calibrated to CR₀ = 5% in 2025)",
      "Logit β = Λ(z₀ + b_τ·KAU + b_r·(r_c − r_g)·100 + b_trend·t)",
      "In the 'marginal-price pool' design, retail tariff = P^ELEC + network charge",
      "endo_mix = 1: clean share = Λ(b0 + b1·LCOE gap % − design risk)",
      "rule = 'define' (eps_r, alpha_r)",
    ][i] })),
  },
  {
    ...tex("SFF"),
    cite: "Dafermos, Nikolaidi & Galanis (2017), Ecological Economics 131 — combines physical flows (matter, energy, carbon) with SFC finance",
    role: "Green/conventional investment split, credit rationing and the damage function. The prototype for holding physical and financial accounts in one system.",
    adopt: [
      "Green investment share responds to the green–conventional loan rate gap (eq. 70) → GDCR (green-differentiated capital requirements) experiment",
      "Weitzman-type damage function split into productivity and capital channels (eqs. 55–57), adaptation rates adK · adP",
      "Link from green capital share to lower emission intensity (reduced form of eq. 44)",
    ],
    omit: [
      "Matter and energy reserve accounts and the four Leontief potential-output constraints (eqs. 45–49)",
      "Carbon-cycle and temperature dynamics → exogenous global temperature path (Korean emissions barely move global temperature)",
      "Green corporate bond market → replaced by the K-GX green government bond (2028+) label",
    ],
    eqs: tex("SFF").eqs.map((e, i) => ({ ...e, id: e.id.replace("식", "Eq. "), impl: [
      "Investment function form (profit rate · utilisation)",
      "b_r·(rLc − rLg); GDCR: rw_g − gdcr, rw_c + gdcr, spread = chi·gdcr",
      "dmg_on: incremental damage relative to 2025 only (η₂ = 0.00284, η₃ = 5e−6, p = 0.1)",
    ][i] })),
  },
  {
    ...tex("MFM"),
    role: "Standard forms for fiscal identities, interest burden, Taylor rule and price equations — the format fiscal authorities and the Bank of Korea already use.",
    adopt: [
      "Debt accumulation identity and gradual adjustment of the average bond yield (κB)",
      "Taylor rule (smoothing ρ, inflation gap φπ, output gap φy) — headline and core versions",
      "Reduced form of the hybrid Phillips curve (lagged inertia + anchored expectations + cost pass-through + gap)",
      "Debt-linked sovereign premium: absent in the MFMod base closure → switch (prem_on, default 0), coefficient from Canelli 2024",
    ],
    omit: ["UIP exchange-rate determination → exchange rate is an exogenous shock (fx_shock)", "Cobb-Douglas potential output and wage ECM → utilisation based on capital and productivity trend"],
    eqs: tex("MFM").eqs.map((e, i) => ({ ...e, ref: e.ref.replace(" 축약", " (reduced)"), impl: [
      "rule = 'taylorH' / 'taylorC'; φπ 1.5 (Korean estimates 0.30–2.06), φy 0.48",
      "prem = μ₁·max(0, (B + α_off·off-balance)/Y − baseline)",
      "Core (excl. direct electricity and fuel) → headline is the weighted sum",
    ][i] })),
  },
  {
    ...tex("MFE"),
    cite: "World Bank Policy Research WP 10854 (2024) — soft-linking a power-planning model (EPM etc.) with the macro model",
    role: "How the power plan feeds the macro model: the rules for passing our Layer-1 ledger (load, mix, costs, emissions) into the macro block.",
    adopt: [
      "Power capex enters investment with technology-specific import shares (mimp_*) — import leakage",
      "Power fuel leaks abroad as imports (LNG · coal); electricity prices reach CPI through direct and indirect channels",
      "No double counting of power capital in GDP capacity → power capital excluded from the utilisation denominator",
    ],
    omit: [
      "The paper's CES fuel nest → scenario mixes or a DEFINE-type logit",
      "The paper has no state-owned utility fiscal block → a Korean power-sector (KEPCO-type) debt and deferral account designed from scratch",
    ],
    eqs: tex("MFE").eqs.map((e, i) => ({ ...e, impl: [
      "Every incremental flow is recorded as a row of the transaction-flow matrix",
      "Change in household electricity tariff = π_elec, CPI weight 1.61% (Statistics Korea)",
    ][i] })),
  },
  {
    ...tex("GMM"),
    cite: "IMF WP/2023/269 — four-region general equilibrium, power-technology CES (σ = 20) and a 'renewables-plus-backup' utility",
    role: "Intermittency. Borrows, in reduced form, the structure in which backup and storage needs rise convexly with the VRE share.",
    adopt: [
      "Backup need p = (L/M)^{1/γ} → gas firming share φₜ and storage ratio respond to the square of system VRE share (int_on)",
      "Monetary and fiscal rules are inherited from GIMF (not GMMET's own contribution) — treated separately from our rule options",
    ],
    omit: ["Four-region general equilibrium, trade and EV nests", "GMMET calibration (regional averages) does not transfer to Korea — form only"],
    eqs: tex("GMM").eqs.map((e) => ({ ...e, impl: "φₜ = φ₀ + s·(VRE²ₜ₋₁ − VRE²₂₀₂₅); same form for the storage ratio" })),
  },
];

export const PROPOSAL_STEPS_EN: Step[] = [
  { step: "1. Energy scenarios", proposal: "Megaproject load served by renewables-led, gas-led or mixed supply; load, investment and the K-GX target held fixed", tool: "Supply scenarios G · R · M (+ N nuclear · SMR option), load path (8.4 → 18.4 GW), net of demand already in the 11th Basic Plan" },
  { step: "2. Monetary channel", proposal: "Social cost → prices → policy rate → cost of capital for green industry; fixed rate vs Taylor-type", tool: "Tariff design · pass-through → CPI (direct · indirect) → five rate rules → WACC → renewable build-out · green investment" },
  { step: "3. Fiscal channel", proposal: "Fiscal effort to cover the extra emissions within the NDC / carbon budget, in K-GX currency and calendar", tool: "K-ETS accommodating / rigid → ITMO · domestic abatement (γ = 1 − KAU/MAC) → government net borrowing, D1/D2/D3" },
  { step: "4. Policy package", proposal: "Designed outside the model (with fiscal authorities)", tool: "A test bench for K-GX instrument allocation and additionality assumptions — no optimisation" },
];

export const ISSUES_EN: Issue[] = [
  {
    id: "Q1",
    q: "Through which mechanism do the megaprojects' power emissions become a fiscal burden? Why would it fall on the budget or tariffs rather than private investors? How is 'social cost' defined?",
    approach: "The NDC and the K-ETS cap set the route. With a rigid cap, extra emissions show up as a higher allowance price and abatement by other covered firms (waterbed); with an accommodating cap, the state closes the gap through ITMOs or domestic abatement. Under administered tariffs, allowance and fuel costs are not fully passed to consumers and accumulate as power-sector debt, which makes it a public-finance question. Social cost = incremental system resource cost (annuitised generation, storage and grid + fuel + abatement elsewhere + ITMOs) and its incidence (data centres, consumers, power sector, budget, ETS firms).",
    module: "Power × K-GX › Q1 panel (incidence table); parameters ets_mode · gap_route · sigma · rho_t",
    status: "Working: incidence is cumulative 2026–2035 against the 'no megaprojects' baseline",
  },
  {
    id: "Q2",
    q: "What does a 'climate-consistent fiscal package' per scenario contain, and which budget decision does it target?",
    approach: "Maps the additional requirement onto K-GX instruments (KRW 200 tn budget: grants, tax credits, interest subsidies, equity, public investment; KRW 790 tn policy finance: loans, guarantees, equity; green bonds from 2028) and onto the budget calendar (2027 tax and spending programmes, 2028 green bonds).",
    module: "Power × K-GX › Q2 panel (requirement vs K-GX envelope, flows by instrument)",
    status: "Working: allocation shares are unpublished, so they are grade-C assumptions",
  },
  {
    id: "Q3",
    q: "Electricity market design: could administered prices and single-buyer dispatch be a binding constraint on independent power producers' (IPP) financing? How does private investment respond to prices and market rules?",
    approach: "Implemented as an untested hypothesis. The design switch (administered / CfD / pool) changes the renewable WACC risk premium, tariff pass-through and deferral; the endogenous mix (DEFINE eq. 109) sets the clean share by relative returns. Grid connection cost is kept separate, as a cost that remains regardless of design.",
    module: "Power × K-GX › Q3 panel; parameters rp_cfd · rp_pool · endo_mix · b1_mix",
    status: "Working: premium sizes are directional from the literature only (grade C)",
  },
  {
    id: "Q4",
    q: "Inflation channel: isn't LNG import dependence, with the related FX and energy-price shocks, a better-documented channel than the transition itself or the monetary response?",
    approach: "LNG price and FX shocks are explicit channels; pass-through by tariff design (pool = immediate, administered = deferred) is separated from the rate response under each rule.",
    module: "DEFINE lab / Power × K-GX › Q4 panel; gas_shock · fx_shock",
    status: "Working",
  },
  {
    id: "Q5",
    q: "Are carbon pricing and K-ETS reform among the fiscal options?",
    approach: "The K-GX strategy document (2026-10-07) itself contains no K-ETS reform (checked). The tool treats the auction path (power 15% → 50%), KAU and the K-MSR ceiling, and a rigid vs accommodating cap as policy options.",
    module: "Power × K-GX › Q5 panel; auction2030 · kau_ceiling · ets_mode",
    status: "Working",
  },
];

export const KGX_FACTS_EN: Fact[] = [
  { k: "Period · size", v: "2026–2035: budget KRW 200 tn + climate finance KRW 790 tn+ = KRW 1,000 tn public; private: 10 signature projects, KRW 220 tn", src: "MOEF · MCEE joint press release, 2026-10-07", url: "https://www.korea.kr/briefing/pressReleaseView.do?newsId=156784526", grade: "official" },
  { k: "Route of the KRW 790 tn", v: "Five policy finance institutions (KDB · IBK · KEXIM · KODIT · KIBO); ≥50% outside the capital region, ≥70% to SMEs and mid-caps; 2026 target KRW 56.7 tn", src: "K-GX press release; FSC climate finance plan (2026-02-25)", url: "https://www.fsc.go.kr/no010101/86326", grade: "official" },
  { k: "Split by institution · instrument", v: "Not published → the tool assumes loans 55% · guarantees 35% · equity 10%, power 30% (grade C)", src: "Unverified", grade: "unverified" },
  { k: "Green government bonds", v: "Framework by H1 2027, first issue in 2028 (size not disclosed)", src: "K-GX press release", grade: "official" },
  { k: "Domestic production tax credit", v: "From 2027, 10 years; solar, wind, batteries, semiconductors, core materials, AI robot parts; regional factor 1.0–1.5; tapering to 75% (2034), 50% (2035), 25% (2036)", src: "2026 tax reform reporting (Sejung Ilbo, 2026-08-03)", grade: "news" },
  { k: "Upfront subsidy, later credit offset (hybrid)", v: "Presidential suggestion; Deputy PM to 'study' it — not adopted policy", src: "Asia Economy, 2026-10-07", grade: "news" },
  { k: "Regional industrial tariffs", v: "11 zones incl. southern region −10% of average tariff (up to KRW 18/kWh); relief ~KRW 2.8 tn; target: within 2026", src: "MCEE · KEPCO public hearing, 2026-08-26", url: "https://www.korea.kr/news/policyNewsView.do?newsId=148970678", grade: "official" },
  { k: "Renewables", v: "100 GW by 2030, transmission capacity expansion, BESS · pumped storage", src: "K-GX press release", grade: "official" },
  { k: "K-ETS reform", v: "Not mentioned in the K-GX document", src: "K-GX press release (full text checked)", grade: "official" },
];

export const CAVEATS_EN = [
  "Most behavioural parameters and 2025 initial stocks are grade C. Read results as differences from the baseline, signs and rankings — not levels.",
  "An annual reduced-form model. It is not a replication of DEFINE-UK; original equation numbers indicate lineage.",
  "The megaprojects' own investment (data centres, fabs) is treated as fixed across scenarios and excluded. What is compared is how the power is supplied and the policy mix.",
  "Model choice (DEFINE-UK · GMMET · MFMod family) and calibration are not settled. This tool is a learning and experimentation sandbox, not a research output.",
  "The market-design hypothesis that 'regulation is the binding constraint' (Q3) is implemented as an untested hypothesis.",
];

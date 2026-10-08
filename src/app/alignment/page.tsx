"use client";
import { useDeferredValue, useMemo } from "react";
import { useStore } from "@/components/Store";
import { ControlPanel, ComparisonBar, type PGroup } from "@/components/Controls";
import { ChartCard as Chart, KpiTile as Kpi } from "@/components/Chart";
import { PageHeader, QSection, StatusBadge } from "@/components/UI";
import { run, at, cum, incidence, DESIGN_LABEL, RULE_LABEL, SUPPLY_LABEL, type Settings, type Design, type MonRule, type Supply, type RunOut } from "@/engine/model.ts";
import { useI18n } from "@/lib/i18n";

const pct = (v: number) => v * 100;
const f1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1).replace("-", "−") : "–");
const f2 = (v: number) => (Number.isFinite(v) ? v.toFixed(2).replace("-", "−") : "–");

const INC_EN: [string, string][] = [
  ["Dedicated data-centre tariff", "(1 − σ) of incremental system cost"],
  ["General consumer bills (households + firms)", "Share of socialised σ recovered in tariffs + general-equilibrium effects"],
  ["Increase in power-sector debt (deferral, stock)", "Unrecovered cost under administered tariffs → KEPCO bonds etc."],
  ["Direct budget spending (ITMOs · abatement subsidy · tariff compensation)", "Direct part of the K-GX top-up"],
  ["Increase in government net borrowing (total)", "Incl. macro feedback through taxes and interest"],
  ["Net cost to ETS firms (waterbed)", "Under a rigid cap: abatement cost − allowance sales"],
  ["Own cost of domestic abatement to firms", "(1 − γ) · domestic MAC"],
];

function noMP(s: Settings): Settings { return { ...s, params: { ...(s.params ?? {}), mp_on: 0 } }; }

const GROUPS: PGroup[] = [
  { title: "메가프로젝트 부하", en: "Megaproject load", ids: ["mp_on", "LD_2029", "LD_2035", "LD_semi", "LD_real", "LD_lf", "dc_rev"] },
  { title: "요금·귀착 (Q1)", en: "Tariffs · incidence (Q1)", ids: ["sigma", "rho_t", "lag_t", "step_t", "ratchet", "reg_tariff_on", "reg_relief", "reg_fund"] },
  { title: "K-ETS·감축 경로 (Q1·Q5)", en: "K-ETS · abatement route (Q1 · Q5)", ids: ["ets_mode", "gap_route", "kau2026", "kau_g", "kau_ceiling", "kau_slope", "auction2030", "itmo_usd", "itmo_cap", "mac_dom_usd"] },
  { title: "K-GX 재정 200조 (Q2)", en: "K-GX budget KRW 200 tn (Q2)", ids: ["kgx_on", "kgx_budget", "al_grant", "al_psgrant", "al_rnd", "al_ptc", "al_isub", "al_inj", "al_pubinv", "hybrid", "green_bond", "fiscal_rule"] },
  { title: "K-GX 정책금융·민간 (Q2)", en: "K-GX policy finance · private (Q2)", ids: ["kgx_pf", "pf_loan", "pf_guar", "pf_ps", "pf_spread", "pf_el", "guar_el", "kgx_priv"] },
  { title: "추가성 가정 (Track A2)", en: "Additionality (Track A2)", ids: ["add_grant", "add_ptc", "add_pf", "add_guar", "add_priv"] },
  { title: "시장설계·민간투자 (Q3)", en: "Market design · private investment (Q3)", ids: ["rp_cfd", "rp_pool", "re_eps", "mo_beta", "kgx_re100", "endo_mix", "b0_mix", "b1_mix", "mu_mprice", "net_charge"] },
  { title: "간헐성 (GMMET형)", en: "Intermittency (GMMET-type)", ids: ["int_on", "fi_base", "fi_slope", "sto_ratio", "sto_slope"] },
  { title: "LNG·환율 물가 경로 (Q4)", en: "LNG · FX inflation channel (Q4)", ids: ["gas_shock", "fx_shock", "shock_y0", "shock_y1", "gas_price", "th_fu", "io_fu", "th_fx", "w_el", "io_el"] },
  { title: "발전기술 비용", en: "Generation technology costs", ids: ["cx_solar", "cx_on", "cx_off", "cx_gas", "cx_nuc", "cx_sto", "cx_grid", "w0", "mimp_solar", "mimp_wind", "mimp_gas"] },
];

export default function Alignment() {
  const { scen, ref, settings } = useStore();
  const i18 = useI18n();
  const t = i18.t;
  const Q = (id: string) => i18.issues.find((x) => x.id === id)!;
  const deferred = useDeferredValue(settings);
  const Y = 2035;

  // comparison grids (each against its own no-megaproject run)
  const designs = useMemo(() => (Object.keys(DESIGN_LABEL) as Design[]).map((d) => {
    const s = { ...deferred, design: d }; const a = run(s), b = run(noMP(s)); return { d, a, b };
  }), [deferred]);
  const rules = useMemo(() => (Object.keys(RULE_LABEL) as MonRule[]).map((r) => {
    const s = { ...deferred, rule: r }; const a = run(s), b = run(noMP(s)); return { r, a, b };
  }), [deferred]);
  const supplies = useMemo(() => (Object.keys(SUPPLY_LABEL) as Supply[]).map((x) => {
    const s = { ...deferred, supply: x }; const a = run(s), b = run(noMP(s)); return { x, a, b };
  }), [deferred]);
  const etsModes = useMemo(() => [0, 1].map((m) => {
    const s = { ...deferred, params: { ...(deferred.params ?? {}), ets_mode: m } }; const a = run(s), b = run(noMP(s)); return { m, a, b };
  }), [deferred]);
  const baseNoMP = useMemo(() => run(noMP(deferred)), [deferred]);

  const inc = incidence(scen, baseNoMP, 2026, 2035);
  const inc50 = incidence(scen, baseNoMP, 2026, 2050);
  const kgxBudget = cum(scen, "kgxBudget", 2026, 2035) + cum(scen, "ptc", 2026, 2036);
  const directExtra = (r: RunOut, b: RunOut) => (cum(r, "itmoCost", 2026, 2035) + cum(r, "domSub", 2026, 2035) + cum(r, "regComp", 2026, 2035)) - (cum(b, "itmoCost", 2026, 2035) + cum(b, "domSub", 2026, 2035) + cum(b, "regComp", 2026, 2035));
  const dd = (r: RunOut, b: RunOut, k: string, y = Y) => at(r, y, k) - at(b, y, k);
  const peak = (r: RunOut, b: RunOut, k: string, y0 = 2026, y1 = 2040) => {
    let m = 0; for (let y = y0; y <= y1; y++) { const x = at(r, y, k) - at(b, y, k); if (Math.abs(x) > Math.abs(m)) m = x; } return m;
  };

  const score = [
    { k: t("메가프로젝트가 만든 NDC 추가 갭 2035 (배출 증가 − ITMO)", "Extra NDC gap from megaprojects 2035 (emissions increase − ITMOs)"), v: at(scen, Y, "ndcGap") - at(baseNoMP, Y, "ndcGap"), unit: "Mt", ok: at(scen, Y, "ndcGap") - at(baseNoMP, Y, "ndcGap") <= 0.5, note: t(`연구 설계상 K-GX 기준선은 고정. 참고: 기준선 자체의 2035 갭 ${at(baseNoMP, Y, "ndcGap").toFixed(0)} Mt(등급 C 비전력 경로)`, `The K-GX baseline is held fixed by design. For reference: the baseline's own 2035 gap is ${at(baseNoMP, Y, "ndcGap").toFixed(0)} Mt (grade-C non-power path)`) },
    { k: t("메가프로젝트 직접 추가배출 2035", "Direct extra emissions from megaprojects 2035"), v: at(scen, Y, "dE"), unit: "Mt", ok: at(scen, Y, "dE") < 5, note: t("가스 보강 포함", "Including gas firming") },
    { k: t("K-GX 재정 대비 추가 직접소요(2026–35)", "Direct top-up relative to K-GX budget (2026–35)"), v: (100 * directExtra(scen, baseNoMP)) / Math.max(1, kgxBudget), unit: t("% of 재정 봉투", "% of budget envelope"), ok: directExtra(scen, baseNoMP) / Math.max(1, kgxBudget) < 0.1, note: t("연구 설계 Step 4의 '총지출 증가분 점유 ≤ 10%' 기준 차용", "Borrows the research design's Step 4 criterion: share of spending increase ≤ 10%") },
    { k: t("전력부문 부채/GDP 2035 (기준 대비)", "Power-sector debt / GDP 2035 (vs baseline)"), v: 100 * (at(scen, Y, "psDebtY") - at(baseNoMP, Y, "psDebtY")), unit: "pp", ok: at(scen, Y, "psDebtY") - at(baseNoMP, Y, "psDebtY") < 0.01, note: t("행정요금 이연의 장부 밖 재정 위험", "Off-budget fiscal risk from tariff deferral") },
    { k: t("재생 설비 2030 (K-GX 100GW 목표)", "Renewable capacity 2030 (K-GX 100 GW target)"), v: at(scen, 2030, "reCap"), unit: "GW", ok: at(scen, 2030, "reCap") >= 100, note: t("11차 계획 78GW; kgx_re100 스위치로 경로 상향", "11th plan: 78 GW; raise the path with the kgx_re100 switch") },
    { k: t("헤드라인 CPI 최대 증분(2026–40)", "Peak headline CPI increment (2026–40)"), v: 100 * peak(scen, baseNoMP, "piH"), unit: "pp", ok: Math.abs(peak(scen, baseNoMP, "piH")) < 0.002, note: t("AIT 밴드(±1pp)보다 훨씬 작으면 통화 반응 거의 없음", "Far smaller than the AIT band (±1pp) → almost no monetary response") },
  ];

  return (
    <>
      <PageHeader n="04" eyebrow={t("전력 × K-GX 정합", "Power × K-GX")} title={t("전력 × K-GX 정합 — Track B 방법론 쟁점(Q1–Q5) 실험", "Power × K-GX alignment — experiments on Track B methodology issues (Q1–Q5)")}>
        {t("Track B 방법론의 다섯 가지 쟁점과 2026-10-07 발표된 K-GX 전략(재정 200조·기후금융 790조·민간 220조, 2026–2035)을 같은 회계 안에서 다룬다. 기준(점선·차이)은 기본적으로 '같은 설정에서 메가프로젝트 없음'이다. 모든 수치는 등급 C 보정 위의 방향·상대 크기로 읽는다.",
          "Handles the five Track B methodology issues and the K-GX strategy announced on 2026-10-07 (budget KRW 200 tn · climate finance KRW 790 tn · private KRW 220 tn, 2026–2035) within one set of accounts. The baseline (dashed lines, differences) is 'same settings without the megaprojects' by default. Read all figures as directions and relative sizes on a grade-C calibration.")}
      </PageHeader>
      <ComparisonBar />
      <div className="layout">
        <ControlPanel groups={GROUPS} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>{t("정합성 점검표", "Consistency checklist")}</h3>
              <span className="small muted">{i18.supply(settings.supply)} · {i18.design(settings.design)} · {i18.rule(settings.rule)}</span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <StatusBadge ok>{t("정합", "Consistent")} {score.filter((x) => x.ok).length}</StatusBadge>
                <StatusBadge ok={false}>{t("불일치", "Inconsistent")} {score.filter((x) => !x.ok).length}</StatusBadge>
              </span>
            </div>
            <table>
              <thead><tr><th>{t("지표", "Indicator")}</th><th className="num">{t("값", "Value")}</th><th>{t("단위", "Unit")}</th><th>{t("판정", "Verdict")}</th><th>{t("읽는 법", "How to read")}</th></tr></thead>
              <tbody>{score.map((s) => (
                <tr key={s.k}><td>{s.k}</td><td className="num">{f2(s.v)}</td><td>{s.unit}</td><td><StatusBadge ok={s.ok} /></td><td className="small muted">{s.note}</td></tr>
              ))}</tbody>
            </table>
          </div>

          {/* ---------------- Q1 */}
          <QSection id="Q1" question={Q("Q1").q} approach={Q("Q1").approach}>
          <div className="kpis auto">
            <Kpi t={t("증분 부하 2035", "Incremental load 2035")} a={at(scen, Y, "incLoad")} unit="TWh" />
            <Kpi t={t("직접 추가배출 2035", "Direct extra emissions 2035")} a={at(scen, Y, "dE")} unit="Mt" />
            <Kpi t={t("증분 자원비용 2035 (사회적 비용)", "Incremental resource cost 2035 (social cost)")} a={at(scen, Y, "sc_resource")} unit={t("조원/년", "KRW tn/yr")} />
            <Kpi t="KAU 2035" a={at(scen, Y, "kau") / 1000} b={at(ref, Y, "kau") / 1000} unit={t("천원/t", "KRW '000/t")} />
          </div>
          <div className="grid g2">
            <div className="card">
              <h3>{t("귀착: 누가 증분 비용을 내는가 (메가프로젝트 없음 대비, 조원)", "Incidence: who pays the incremental cost (vs no megaprojects, KRW tn)")}</h3>
              <table>
                <thead><tr><th>{t("부담 주체", "Bearer")}</th><th className="num">{t("2026–35 누적", "2026–35 cumulative")}</th><th className="num">{t("2026–50 누적", "2026–50 cumulative")}</th><th>{t("정의", "Definition")}</th></tr></thead>
                <tbody>
                  {inc.map((x, i) => (<tr key={x.label}><td>{t(x.label, INC_EN[i][0])}</td><td className="num">{f1(x.value)}</td><td className="num">{f1(inc50[i].value)}</td><td className="small muted">{t(x.note, INC_EN[i][1])}</td></tr>))}
                  <tr><th>{t("증분 자원비용 합(사회적 비용)", "Total incremental resource cost (social cost)")}</th><th className="num">{f1(cum(scen, "sc_resource", 2026, 2035))}</th><th className="num">{f1(cum(scen, "sc_resource", 2026, 2050))}</th><th className="small">{t("발전·저장·계통 연금 + 연료 + 타부문 감축 + ITMO (배출권 대금 등 이전은 제외)", "Annuitised generation · storage · grid + fuel + abatement elsewhere + ITMOs (transfers such as allowance payments excluded)")}</th></tr>
                </tbody>
              </table>
              <p className="small muted">{t("전력부문 부채는 잔액(연말) 차이, 나머지는 흐름의 누적. 귀착 항목은 서로 겹칠 수 있어(예: 요금 미회수 → 부채) 합이 자원비용과 같지 않다.", "Power-sector debt is a difference in end-year stocks; the rest are cumulative flows. Incidence items can overlap (e.g. unrecovered tariffs → debt), so they do not sum to the resource cost.")}</p>
            </div>
            <Chart title={t("배출 경로: 메가프로젝트 직접분과 국가 총량 차이", "Emissions: difference in national total and power sector")} unit="Mt" scen={scen} ref={baseNoMP} diff series={[
              { key: "EMtot", label: t("국가 배출 차이(감축 반영 후)", "National emissions (after abatement)") }, { key: "emPower", label: t("전환부문 차이", "Power sector") },
            ]} />
            <Chart title={t("증분 시스템 비용 구성 (현재 설정)", "Incremental system cost (current settings)")} unit={t("조원/년", "KRW tn/yr")} scen={scen} series={[
              { key: "incAnn", label: t("설비·계통 연금", "Plant · grid annuity"), ref: false }, { key: "incFuel", label: t("연료", "Fuel"), ref: false }, { key: "itmoCost", label: "ITMO", ref: false }, { key: "domCost", label: t("국내감축", "Domestic abatement"), ref: false }, { key: "abateCostW", label: t("워터베드 감축", "Waterbed abatement"), ref: false },
            ]} />
            <Chart title={t("요금: 적용요금 vs 원가요금(T*)", "Tariff: applied vs cost-based (T*)")} unit={t("원/kWh", "KRW/kWh")} scen={scen} ref={ref} series={[
              { key: "tariff", label: t("적용 평균요금", "Applied average tariff") }, { key: "tariffStar", label: t("원가 기준 요금 T*", "Cost-based tariff T*"), ref: false },
            ]} />
          </div>

          {/* ---------------- Q2 */}
          </QSection>
          <QSection id="Q2" question={Q("Q2").q} approach={Q("Q2").approach}>
          <div className="grid g2">
            <div className="card">
              <h3>{t("K-GX 봉투와 메가프로젝트 증액 소요 (2026–2035 누적, 조원)", "K-GX envelope and the megaproject top-up (2026–2035 cumulative, KRW tn)")}</h3>
              <table>
                <tbody>
                  <tr><td>{t("재정 집행(보조·R&D·이차보전·출자·공공투자)", "Budget spending (grants · R&D · interest subsidies · equity · public investment)")}</td><td className="num">{f1(cum(scen, "kgxBudget", 2026, 2035))}</td></tr>
                  <tr><td>{t("국내생산세액공제 사용분(2027–2036)", "Domestic production tax credit used (2027–2036)")}</td><td className="num">{f1(cum(scen, "ptc", 2026, 2036))}</td></tr>
                  <tr><td>{t("정책금융 공급(대출·보증·출자)", "Policy finance supplied (loans · guarantees · equity)")}</td><td className="num">{f1(cum(scen, "pfFlow", 2026, 2035))}</td></tr>
                  <tr><td className="small">{t("― 대출 / 보증 / 출자", "― loans / guarantees / equity")}</td><td className="num small">{f1(cum(scen, "pfLoans", 2026, 2035))} / {f1(cum(scen, "pfGuar", 2026, 2035))} / {f1(cum(scen, "pfEq", 2026, 2035))}</td></tr>
                  <tr><td>{t("민간 시그니처 투자(발표)", "Private signature investment (announced)")}</td><td className="num">{f1(cum(scen, "priv", 2026, 2035))}</td></tr>
                  <tr><td>{t("추가 녹색투자로 이어진 몫(추가성 가정 적용)", "Turned into extra green investment (additionality assumptions)")}</td><td className="num">{f1(cum(scen, "addInv", 2026, 2035))}</td></tr>
                  <tr><th>{t("메가프로젝트 직접 재정소요 증가(ITMO·국내감축 보조·요금보전)", "Direct fiscal top-up from megaprojects (ITMOs · abatement subsidy · tariff compensation)")}</th><th className="num">{f1(directExtra(scen, baseNoMP))}</th></tr>
                  <tr><td>{t("정부 순차입 증가(거시 되먹임 포함)", "Increase in government net borrowing (incl. macro feedback)")}</td><td className="num">{f1(-(cum(scen, "nlGOV", 2026, 2035) - cum(baseNoMP, "nlGOV", 2026, 2035)))}</td></tr>
                  <tr><td>{t("녹색국채 잔액 2035 (2028~ 발행)", "Green bonds outstanding 2035 (issued from 2028)")}</td><td className="num">{f1(at(scen, Y, "Bgreen"))}</td></tr>
                  <tr><td>{t("보증잔액 2035 (장부 밖)", "Guarantees outstanding 2035 (off balance sheet)")}</td><td className="num">{f1(at(scen, Y, "CL"))}</td></tr>
                </tbody>
              </table>
              <p className="small muted">{t("예산 달력: 2027 세제개편(생산세액공제 시행)·재정지원사업, 2027 상반기 녹색국채 제도, 2028 첫 발행. 790조의 기관·수단별 분해는 미공개라 가정값이다.", "Budget calendar: 2027 tax reform (production tax credit) and support programmes, green bond framework in H1 2027, first issue in 2028. The split of the KRW 790 tn by institution and instrument is unpublished, so it is assumed.")}</p>
            </div>
            <Chart title={t("K-GX 연간 흐름", "K-GX annual flows")} unit={t("조원/년", "KRW tn/yr")} scen={scen} series={[
              { key: "kgxBudget", label: t("재정 집행", "Budget spending"), ref: false }, { key: "ptc", label: t("세액공제", "Tax credit"), ref: false }, { key: "pfFlow", label: t("정책금융 공급", "Policy finance"), ref: false }, { key: "addInv", label: t("추가 녹색투자", "Extra green investment"), ref: false },
            ]} />
            <Chart title={t("공공부채 경계 D1/D2/D3", "Public debt perimeters D1/D2/D3")} unit="% GDP" scen={scen} ref={ref} series={[
              { key: "debtRatio", label: t("D1 국채", "D1 government bonds"), f: pct }, { key: "D2", label: t("D2 +정책금융·보증EL", "D2 + policy finance · guarantee EL"), f: pct }, { key: "D3", label: t("D3 +전력부문", "D3 + power sector"), f: pct },
            ]} />
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3>{t(`공급 시나리오별 비교 (각 시나리오의 '메가프로젝트 없음' 대비, ${Y})`, `Comparison by supply scenario (each vs its own 'no megaprojects' run, ${Y})`)}</h3>
              <table>
                <thead><tr><th>{t("시나리오", "Scenario")}</th><th className="num">{t("직접배출 Mt", "Direct emissions Mt")}</th><th className="num">{t("자원비용 누적 26–35", "Resource cost 26–35")}</th><th className="num">{t("직접 재정소요 26–35", "Direct fiscal top-up 26–35")}</th><th className="num">ΔD1 pp</th><th className="num">{t("Δ전력부채 조원", "Δ power debt KRW tn")}</th></tr></thead>
                <tbody>{supplies.map(({ x, a, b }) => (
                  <tr key={x}><td>{i18.supply(x)}</td><td className="num">{f1(at(a, Y, "dE"))}</td><td className="num">{f1(cum(a, "sc_resource", 2026, 2035))}</td><td className="num">{f1(directExtra(a, b))}</td><td className="num">{f2(100 * dd(a, b, "debtRatio"))}</td><td className="num">{f1(dd(a, b, "psDebt"))}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          {/* ---------------- Q3 */}
          </QSection>
          <QSection id="Q3" question={Q("Q3").q} approach={Q("Q3").approach}>
          <div className="grid g2">
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3>{t(`시장·요금 설계별 비교 (${Y}, 각 설계의 '메가프로젝트 없음' 대비)`, `Comparison by market · tariff design (${Y}, each vs its own 'no megaprojects' run)`)}</h3>
              <table>
                <thead><tr><th>{t("설계", "Design")}</th><th className="num">{t("재생 GW", "Renewables GW")}</th><th className="num">{t("재생 WACC %", "Renewable WACC %")}</th><th className="num">{t("Δ요금 원/kWh", "Δ tariff KRW/kWh")}</th><th className="num">{t("Δ전력부채 조원", "Δ power debt KRW tn")}</th><th className="num">{t("ΔCPI 최대 pp", "Peak ΔCPI pp")}</th></tr></thead>
                <tbody>{designs.map(({ d, a, b }) => (
                  <tr key={d}><td>{i18.design(d)}</td><td className="num">{f1(at(a, Y, "reCap"))}</td><td className="num">{f2(100 * at(a, Y, "wRE"))}</td><td className="num">{f1(dd(a, b, "tariff"))}</td><td className="num">{f1(dd(a, b, "psDebt"))}</td><td className="num">{f2(100 * peak(a, b, "piH"))}</td></tr>
                ))}</tbody>
              </table>
              <p className="small muted">{t("시장설계 가설(행정가격·단일구매자가 IPP 자금조달을 제약)은 rp_cfd·rp_pool로 구현했고 크기는 미검증이다. 계통 접속비용(cx_grid)은 설계와 무관하게 남는 반론 지점.", "The market-design hypothesis (administered prices and a single buyer constrain IPP financing) is implemented via rp_cfd · rp_pool; its size is untested. Grid connection cost (cx_grid) remains regardless of design.")}</p>
            </div>
            <Chart title={t("재생에너지 설비: 계획 vs 실현", "Renewable capacity: plan vs realised")} unit="GW" scen={scen} ref={ref} series={[
              { key: "reCap", label: t("실현", "Realised") }, { key: "rePlan", label: t("계획 경로", "Plan path"), ref: false },
            ]} />
            <Chart title={t("재생 WACC와 ΔLCOE", "Renewable WACC and ΔLCOE")} unit="%" scen={scen} ref={ref} series={[
              { key: "wRE", label: t("재생 WACC", "Renewable WACC"), f: pct }, { key: "dLCOEg", label: t("ΔLCOE(기준 대비)", "ΔLCOE (vs reference)"), f: pct },
            ]} />
            <Chart title={t("증분 공급 중 청정 비중·가스 보강 φ (GMMET형)", "Clean share of incremental supply · gas firming φ (GMMET-type)")} unit="%" scen={scen} series={[
              { key: "cleanShare", label: t("청정 비중", "Clean share"), f: pct, ref: false }, { key: "phi", label: t("가스 보강 φ", "Gas firming φ"), f: pct, ref: false }, { key: "vreSys", label: t("계통 VRE 비중", "System VRE share"), f: pct, ref: false },
            ]} />
          </div>

          {/* ---------------- Q4 */}
          </QSection>
          <QSection id="Q4" question={Q("Q4").q} approach={Q("Q4").approach}>
          <div className="grid g2">
            <Chart title={t("물가: 헤드라인·근원·전기요금", "Inflation: headline · core · electricity")} unit={t("%/년", "%/yr")} scen={scen} ref={ref} series={[
              { key: "piH", label: t("헤드라인", "Headline"), f: pct }, { key: "piC", label: t("근원", "Core"), f: pct }, { key: "piElec", label: t("전기요금", "Electricity"), f: pct },
            ]} />
            <Chart title={t("정책금리", "Policy rate")} unit="%" scen={scen} ref={ref} series={[{ key: "i", label: t("정책금리", "Policy rate"), f: pct }]} />
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3>{t("반응함수별 비교 (각 규칙의 '메가프로젝트 없음' 대비)", "Comparison by rate rule (each vs its own 'no megaprojects' run)")}</h3>
              <table>
                <thead><tr><th>{t("규칙", "Rule")}</th><th className="num">{t("ΔCPI 최대 pp", "Peak ΔCPI pp")}</th><th className="num">{t("Δ금리 최대 bp", "Peak Δ rate bp")}</th><th className="num">{t("Δ재생 GW 2035", "Δ renewables GW 2035")}</th><th className="num">{t("ΔD1 2035 pp", "ΔD1 2035 pp")}</th></tr></thead>
                <tbody>{rules.map(({ r, a, b }) => (
                  <tr key={r}><td>{i18.rule(r)}</td><td className="num">{f2(100 * peak(a, b, "piH"))}</td><td className="num">{f1(10000 * peak(a, b, "i"))}</td><td className="num">{f1(dd(a, b, "reCap"))}</td><td className="num">{f2(100 * dd(a, b, "debtRatio"))}</td></tr>
                ))}</tbody>
              </table>
              <p className="small muted">{t("LNG 가격·환율 충격(gas_shock, fx_shock)을 켜고 설계를 '한계가격 풀'과 '행정요금'으로 바꿔 보면, 같은 충격이 물가로 가는지(풀) 전력부문 부채로 가는지(행정) 갈린다.", "Turn on the LNG price and FX shocks (gas_shock, fx_shock) and switch between the marginal-price pool and administered tariffs: the same shock goes to prices (pool) or to power-sector debt (administered).")}</p>
            </div>
            <Chart title={t("수입 연료비와 전력부문 부채", "Imported fuel bill and power-sector debt")} unit={t("조원", "KRW tn")} scen={scen} ref={ref} series={[
              { key: "fuelImp", label: t("발전연료 수입", "Power fuel imports") }, { key: "psDebt", label: t("전력부문 부채", "Power-sector debt") },
            ]} />
          </div>

          {/* ---------------- Q5 */}
          </QSection>
          <QSection id="Q5" question={Q("Q5").q} approach={Q("Q5").approach}>
          <div className="grid g2">
            <Chart title={t("KAU 가격·유상할당 비중", "KAU price · auction share")} unit={t("천원/t, %", "KRW '000/t, %")} scen={scen} ref={ref} series={[
              { key: "kau", label: t("KAU(천원/t)", "KAU (KRW '000/t)"), f: (v) => v / 1000 }, { key: "auction", label: t("발전 유상할당 %", "Power auction share %"), f: pct, ref: false },
            ]} />
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3>{t("K-ETS 상한 반응별 비교 (2026–35 누적, '메가프로젝트 없음' 대비)", "Comparison by K-ETS cap response (2026–35 cumulative, vs no megaprojects)")}</h3>
              <table>
                <thead><tr><th>{t("상한", "Cap")}</th><th className="num">{t("KAU 2035 천원", "KAU 2035 KRW '000")}</th><th className="num">{t("워터베드 감축 Mt(2035)", "Waterbed abatement Mt (2035)")}</th><th className="num">{t("직접 재정소요", "Direct fiscal top-up")}</th><th className="num">{t("ETS 기업 순부담", "Net cost to ETS firms")}</th><th className="num">{t("전력 배출권 비용", "Power allowance cost")}</th></tr></thead>
                <tbody>{etsModes.map(({ m, a, b }) => (
                  <tr key={m}><td>{m ? t("경직(워터베드)", "Rigid (waterbed)") : t("수용(국가가 갭 해소)", "Accommodating (state closes gap)")}</td><td className="num">{f1(at(a, Y, "kau") / 1000)}</td><td className="num">{f1(at(a, Y, "Ew"))}</td><td className="num">{f1(directExtra(a, b))}</td><td className="num">{f1(cum(a, "abateCostW", 2026, 2035) - cum(a, "wbTransfer", 2026, 2035))}</td><td className="num">{f1(cum(a, "etsPS", 2026, 2035) - cum(b, "etsPS", 2026, 2035))}</td></tr>
                ))}</tbody>
              </table>
              <p className="small muted">{t("경직 상한에서는 추가 배출이 KAU 상승과 타 업체 감축으로 흡수되어 예산 부담이 거의 없다(K-MSR 상한을 넘는 누출분만 국가 몫). 행정요금 아래에서 늘어난 배출권 비용은 소비자보다 전력부문에 먼저 쌓인다(Q1의 '한전 다리').", "Under a rigid cap, extra emissions are absorbed by a higher KAU and abatement by other firms, so the budget cost is close to zero (only leakage above the K-MSR ceiling falls on the state). Under administered tariffs, the higher allowance cost lands on the power sector before consumers (the 'KEPCO bridge' in Q1).")}</p>
            </div>
          </div>
          </QSection>
        </div>
      </div>
    </>
  );
}

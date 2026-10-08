"use client";
import { useDeferredValue, useMemo } from "react";
import { useStore } from "@/components/Store";
import { ControlPanel, ComparisonBar, type PGroup } from "@/components/Controls";
import { ChartCard as Chart, KpiTile as Kpi } from "@/components/Chart";
import { PageHeader, QSection, StatusBadge } from "@/components/UI";
import { run, at, cum, incidence, DESIGN_LABEL, RULE_LABEL, SUPPLY_LABEL, type Settings, type Design, type MonRule, type Supply, type RunOut } from "@/engine/model.ts";
import { ISSUES } from "@/lib/content";

const pct = (v: number) => v * 100;
const f1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1).replace("-", "−") : "–");
const f2 = (v: number) => (Number.isFinite(v) ? v.toFixed(2).replace("-", "−") : "–");

function noMP(s: Settings): Settings { return { ...s, params: { ...(s.params ?? {}), mp_on: 0 } }; }

const GROUPS: PGroup[] = [
  { title: "메가프로젝트 부하", ids: ["mp_on", "LD_2029", "LD_2035", "LD_semi", "LD_real", "LD_lf", "dc_rev"] },
  { title: "요금·귀착 (Q1)", ids: ["sigma", "rho_t", "lag_t", "step_t", "ratchet", "reg_tariff_on", "reg_relief", "reg_fund"] },
  { title: "K-ETS·감축 경로 (Q1·Q5)", ids: ["ets_mode", "gap_route", "kau2026", "kau_g", "kau_ceiling", "kau_slope", "auction2030", "itmo_usd", "itmo_cap", "mac_dom_usd"] },
  { title: "K-GX 재정 200조 (Q2)", ids: ["kgx_on", "kgx_budget", "al_grant", "al_psgrant", "al_rnd", "al_ptc", "al_isub", "al_inj", "al_pubinv", "hybrid", "green_bond", "fiscal_rule"] },
  { title: "K-GX 정책금융·민간 (Q2)", ids: ["kgx_pf", "pf_loan", "pf_guar", "pf_ps", "pf_spread", "pf_el", "guar_el", "kgx_priv"] },
  { title: "추가성 가정 (Track A2)", ids: ["add_grant", "add_ptc", "add_pf", "add_guar", "add_priv"] },
  { title: "시장설계·민간투자 (Q3)", ids: ["rp_cfd", "rp_pool", "re_eps", "mo_beta", "kgx_re100", "endo_mix", "b0_mix", "b1_mix", "mu_mprice", "net_charge"] },
  { title: "간헐성 (GMMET형)", ids: ["int_on", "fi_base", "fi_slope", "sto_ratio", "sto_slope"] },
  { title: "LNG·환율 물가 경로 (Q4)", ids: ["gas_shock", "fx_shock", "shock_y0", "shock_y1", "gas_price", "th_fu", "io_fu", "th_fx", "w_el", "io_el"] },
  { title: "발전기술 비용", ids: ["cx_solar", "cx_on", "cx_off", "cx_gas", "cx_nuc", "cx_sto", "cx_grid", "w0", "mimp_solar", "mimp_wind", "mimp_gas"] },
];
const Q = (id: string) => ISSUES.find((x) => x.id === id)!;

export default function Alignment() {
  const { scen, ref, settings } = useStore();
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
    { k: "메가프로젝트가 만든 NDC 추가 갭 2035 (배출 증가 − ITMO)", v: at(scen, Y, "ndcGap") - at(baseNoMP, Y, "ndcGap"), unit: "Mt", ok: at(scen, Y, "ndcGap") - at(baseNoMP, Y, "ndcGap") <= 0.5, note: `연구 설계상 K-GX 기준선은 고정. 참고: 기준선 자체의 2035 갭 ${at(baseNoMP, Y, "ndcGap").toFixed(0)} Mt(등급 C 비전력 경로)` },
    { k: "메가프로젝트 직접 추가배출 2035", v: at(scen, Y, "dE"), unit: "Mt", ok: at(scen, Y, "dE") < 5, note: "가스 보강 포함" },
    { k: "K-GX 재정 대비 추가 직접소요(2026–35)", v: (100 * directExtra(scen, baseNoMP)) / Math.max(1, kgxBudget), unit: "% of 재정 봉투", ok: directExtra(scen, baseNoMP) / Math.max(1, kgxBudget) < 0.1, note: "연구 설계 Step 4의 '총지출 증가분 점유 ≤ 10%' 기준 차용" },
    { k: "전력부문 부채/GDP 2035 (기준 대비)", v: 100 * (at(scen, Y, "psDebtY") - at(baseNoMP, Y, "psDebtY")), unit: "pp", ok: at(scen, Y, "psDebtY") - at(baseNoMP, Y, "psDebtY") < 0.01, note: "행정요금 이연의 장부 밖 재정 위험" },
    { k: "재생 설비 2030 (K-GX 100GW 목표)", v: at(scen, 2030, "reCap"), unit: "GW", ok: at(scen, 2030, "reCap") >= 100, note: "11차 계획 78GW; kgx_re100 스위치로 경로 상향" },
    { k: "헤드라인 CPI 최대 증분(2026–40)", v: 100 * peak(scen, baseNoMP, "piH"), unit: "pp", ok: Math.abs(peak(scen, baseNoMP, "piH")) < 0.002, note: "AIT 밴드(±1pp)보다 훨씬 작으면 통화 반응 거의 없음" },
  ];

  return (
    <>
      <PageHeader n="04" eyebrow="전력 × K-GX 정합" title="전력 × K-GX 정합 — Track B 방법론 쟁점(Q1–Q5) 실험">
        Track B 방법론의 다섯 가지 쟁점과 2026-10-07 발표된 K-GX 전략(재정 200조·기후금융 790조·민간 220조, 2026–2035)을 같은 회계 안에서 다룬다.
        기준(점선·차이)은 기본적으로 &apos;같은 설정에서 메가프로젝트 없음&apos;이다. 모든 수치는 등급 C 보정 위의 방향·상대 크기로 읽는다.
      </PageHeader>
      <ComparisonBar />
      <div className="layout">
        <ControlPanel groups={GROUPS} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>정합성 점검표</h3>
              <span className="small muted">{SUPPLY_LABEL[settings.supply]} · {DESIGN_LABEL[settings.design]} · {RULE_LABEL[settings.rule]}</span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <StatusBadge ok>정합 {score.filter((x) => x.ok).length}</StatusBadge>
                <StatusBadge ok={false}>불일치 {score.filter((x) => !x.ok).length}</StatusBadge>
              </span>
            </div>
            <table>
              <thead><tr><th>지표</th><th className="num">값</th><th>단위</th><th>판정</th><th>읽는 법</th></tr></thead>
              <tbody>{score.map((s) => (
                <tr key={s.k}><td>{s.k}</td><td className="num">{f2(s.v)}</td><td>{s.unit}</td><td><StatusBadge ok={s.ok} /></td><td className="small muted">{s.note}</td></tr>
              ))}</tbody>
            </table>
          </div>

          {/* ---------------- Q1 */}
          <QSection id="Q1" question={Q("Q1").q} approach={Q("Q1").approach}>
          <div className="kpis auto">
            <Kpi t="증분 부하 2035" a={at(scen, Y, "incLoad")} unit="TWh" />
            <Kpi t="직접 추가배출 2035" a={at(scen, Y, "dE")} unit="Mt" />
            <Kpi t="증분 자원비용 2035 (사회적 비용)" a={at(scen, Y, "sc_resource")} unit="조원/년" />
            <Kpi t="KAU 2035" a={at(scen, Y, "kau") / 1000} b={at(ref, Y, "kau") / 1000} unit="천원/t" />
          </div>
          <div className="grid g2">
            <div className="card">
              <h3>귀착: 누가 증분 비용을 내는가 (메가프로젝트 없음 대비, 조원)</h3>
              <table>
                <thead><tr><th>부담 주체</th><th className="num">2026–35 누적</th><th className="num">2026–50 누적</th><th>정의</th></tr></thead>
                <tbody>
                  {inc.map((x, i) => (<tr key={x.label}><td>{x.label}</td><td className="num">{f1(x.value)}</td><td className="num">{f1(inc50[i].value)}</td><td className="small muted">{x.note}</td></tr>))}
                  <tr><th>증분 자원비용 합(사회적 비용)</th><th className="num">{f1(cum(scen, "sc_resource", 2026, 2035))}</th><th className="num">{f1(cum(scen, "sc_resource", 2026, 2050))}</th><th className="small">발전·저장·계통 연금 + 연료 + 타부문 감축 + ITMO (배출권 대금 등 이전은 제외)</th></tr>
                </tbody>
              </table>
              <p className="small muted">전력부문 부채는 잔액(연말) 차이, 나머지는 흐름의 누적. 귀착 항목은 서로 겹칠 수 있어(예: 요금 미회수 → 부채) 합이 자원비용과 같지 않다.</p>
            </div>
            <Chart title="배출 경로: 메가프로젝트 직접분과 국가 총량 차이" unit="Mt" scen={scen} ref={baseNoMP} diff series={[
              { key: "EMtot", label: "국가 배출 차이(감축 반영 후)" }, { key: "emPower", label: "전환부문 차이" },
            ]} />
            <Chart title="증분 시스템 비용 구성 (현재 설정)" unit="조원/년" scen={scen} series={[
              { key: "incAnn", label: "설비·계통 연금", ref: false }, { key: "incFuel", label: "연료", ref: false }, { key: "itmoCost", label: "ITMO", ref: false }, { key: "domCost", label: "국내감축", ref: false }, { key: "abateCostW", label: "워터베드 감축", ref: false },
            ]} />
            <Chart title="요금: 적용요금 vs 원가요금(T*)" unit="원/kWh" scen={scen} ref={ref} series={[
              { key: "tariff", label: "적용 평균요금" }, { key: "tariffStar", label: "원가 기준 요금 T*", ref: false },
            ]} />
          </div>

          {/* ---------------- Q2 */}
          </QSection>
          <QSection id="Q2" question={Q("Q2").q} approach={Q("Q2").approach}>
          <div className="grid g2">
            <div className="card">
              <h3>K-GX 봉투와 메가프로젝트 증액 소요 (2026–2035 누적, 조원)</h3>
              <table>
                <tbody>
                  <tr><td>재정 집행(보조·R&D·이차보전·출자·공공투자)</td><td className="num">{f1(cum(scen, "kgxBudget", 2026, 2035))}</td></tr>
                  <tr><td>국내생산세액공제 사용분(2027–2036)</td><td className="num">{f1(cum(scen, "ptc", 2026, 2036))}</td></tr>
                  <tr><td>정책금융 공급(대출·보증·출자)</td><td className="num">{f1(cum(scen, "pfFlow", 2026, 2035))}</td></tr>
                  <tr><td className="small">― 대출 / 보증 / 출자</td><td className="num small">{f1(cum(scen, "pfLoans", 2026, 2035))} / {f1(cum(scen, "pfGuar", 2026, 2035))} / {f1(cum(scen, "pfEq", 2026, 2035))}</td></tr>
                  <tr><td>민간 시그니처 투자(발표)</td><td className="num">{f1(cum(scen, "priv", 2026, 2035))}</td></tr>
                  <tr><td>추가 녹색투자로 이어진 몫(추가성 가정 적용)</td><td className="num">{f1(cum(scen, "addInv", 2026, 2035))}</td></tr>
                  <tr><th>메가프로젝트 직접 재정소요 증가(ITMO·국내감축 보조·요금보전)</th><th className="num">{f1(directExtra(scen, baseNoMP))}</th></tr>
                  <tr><td>정부 순차입 증가(거시 되먹임 포함)</td><td className="num">{f1(-(cum(scen, "nlGOV", 2026, 2035) - cum(baseNoMP, "nlGOV", 2026, 2035)))}</td></tr>
                  <tr><td>녹색국채 잔액 2035 (2028~ 발행)</td><td className="num">{f1(at(scen, Y, "Bgreen"))}</td></tr>
                  <tr><td>보증잔액 2035 (장부 밖)</td><td className="num">{f1(at(scen, Y, "CL"))}</td></tr>
                </tbody>
              </table>
              <p className="small muted">예산 달력: 2027 세제개편(생산세액공제 시행)·재정지원사업, 2027 상반기 녹색국채 제도, 2028 첫 발행. 790조의 기관·수단별 분해는 미공개라 가정값이다.</p>
            </div>
            <Chart title="K-GX 연간 흐름" unit="조원/년" scen={scen} series={[
              { key: "kgxBudget", label: "재정 집행", ref: false }, { key: "ptc", label: "세액공제", ref: false }, { key: "pfFlow", label: "정책금융 공급", ref: false }, { key: "addInv", label: "추가 녹색투자", ref: false },
            ]} />
            <Chart title="공공부채 경계 D1/D2/D3" unit="% GDP" scen={scen} ref={ref} series={[
              { key: "debtRatio", label: "D1 국채", f: pct }, { key: "D2", label: "D2 +정책금융·보증EL", f: pct }, { key: "D3", label: "D3 +전력부문", f: pct },
            ]} />
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3>공급 시나리오별 비교 (각 시나리오의 '메가프로젝트 없음' 대비, {Y})</h3>
              <table>
                <thead><tr><th>시나리오</th><th className="num">직접배출 Mt</th><th className="num">자원비용 누적 26–35</th><th className="num">직접 재정소요 26–35</th><th className="num">ΔD1 pp</th><th className="num">Δ전력부채 조원</th></tr></thead>
                <tbody>{supplies.map(({ x, a, b }) => (
                  <tr key={x}><td>{SUPPLY_LABEL[x]}</td><td className="num">{f1(at(a, Y, "dE"))}</td><td className="num">{f1(cum(a, "sc_resource", 2026, 2035))}</td><td className="num">{f1(directExtra(a, b))}</td><td className="num">{f2(100 * dd(a, b, "debtRatio"))}</td><td className="num">{f1(dd(a, b, "psDebt"))}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          {/* ---------------- Q3 */}
          </QSection>
          <QSection id="Q3" question={Q("Q3").q} approach={Q("Q3").approach}>
          <div className="grid g2">
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3>시장·요금 설계별 비교 ({Y}, 각 설계의 '메가프로젝트 없음' 대비)</h3>
              <table>
                <thead><tr><th>설계</th><th className="num">재생 GW</th><th className="num">재생 WACC %</th><th className="num">Δ요금 원/kWh</th><th className="num">Δ전력부채 조원</th><th className="num">ΔCPI 최대 pp</th></tr></thead>
                <tbody>{designs.map(({ d, a, b }) => (
                  <tr key={d}><td>{DESIGN_LABEL[d]}</td><td className="num">{f1(at(a, Y, "reCap"))}</td><td className="num">{f2(100 * at(a, Y, "wRE"))}</td><td className="num">{f1(dd(a, b, "tariff"))}</td><td className="num">{f1(dd(a, b, "psDebt"))}</td><td className="num">{f2(100 * peak(a, b, "piH"))}</td></tr>
                ))}</tbody>
              </table>
              <p className="small muted">시장설계 가설(행정가격·단일구매자가 IPP 자금조달을 제약)은 rp_cfd·rp_pool로 구현했고 크기는 미검증이다. 계통 접속비용(cx_grid)은 설계와 무관하게 남는 반론 지점.</p>
            </div>
            <Chart title="재생에너지 설비: 계획 vs 실현" unit="GW" scen={scen} ref={ref} series={[
              { key: "reCap", label: "실현" }, { key: "rePlan", label: "계획 경로", ref: false },
            ]} />
            <Chart title="재생 WACC와 ΔLCOE" unit="%" scen={scen} ref={ref} series={[
              { key: "wRE", label: "재생 WACC", f: pct }, { key: "dLCOEg", label: "ΔLCOE(기준 대비)", f: pct },
            ]} />
            <Chart title="증분 공급 중 청정 비중·가스 보강 φ (GMMET형)" unit="%" scen={scen} series={[
              { key: "cleanShare", label: "청정 비중", f: pct, ref: false }, { key: "phi", label: "가스 보강 φ", f: pct, ref: false }, { key: "vreSys", label: "계통 VRE 비중", f: pct, ref: false },
            ]} />
          </div>

          {/* ---------------- Q4 */}
          </QSection>
          <QSection id="Q4" question={Q("Q4").q} approach={Q("Q4").approach}>
          <div className="grid g2">
            <Chart title="물가: 헤드라인·근원·전기요금" unit="%/년" scen={scen} ref={ref} series={[
              { key: "piH", label: "헤드라인", f: pct }, { key: "piC", label: "근원", f: pct }, { key: "piElec", label: "전기요금", f: pct },
            ]} />
            <Chart title="정책금리" unit="%" scen={scen} ref={ref} series={[{ key: "i", label: "정책금리", f: pct }]} />
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3>반응함수별 비교 (각 규칙의 '메가프로젝트 없음' 대비)</h3>
              <table>
                <thead><tr><th>규칙</th><th className="num">ΔCPI 최대 pp</th><th className="num">Δ금리 최대 bp</th><th className="num">Δ재생 GW 2035</th><th className="num">ΔD1 2035 pp</th></tr></thead>
                <tbody>{rules.map(({ r, a, b }) => (
                  <tr key={r}><td>{RULE_LABEL[r]}</td><td className="num">{f2(100 * peak(a, b, "piH"))}</td><td className="num">{f1(10000 * peak(a, b, "i"))}</td><td className="num">{f1(dd(a, b, "reCap"))}</td><td className="num">{f2(100 * dd(a, b, "debtRatio"))}</td></tr>
                ))}</tbody>
              </table>
              <p className="small muted">LNG 가격·환율 충격(gas_shock, fx_shock)을 켜고 설계를 '한계가격 풀'과 '행정요금'으로 바꿔 보면, 같은 충격이 물가로 가는지(풀) 전력부문 부채로 가는지(행정) 갈린다.</p>
            </div>
            <Chart title="수입 연료비와 전력부문 부채" unit="조원" scen={scen} ref={ref} series={[
              { key: "fuelImp", label: "발전연료 수입" }, { key: "psDebt", label: "전력부문 부채" },
            ]} />
          </div>

          {/* ---------------- Q5 */}
          </QSection>
          <QSection id="Q5" question={Q("Q5").q} approach={Q("Q5").approach}>
          <div className="grid g2">
            <Chart title="KAU 가격·유상할당 비중" unit="천원/t, %" scen={scen} ref={ref} series={[
              { key: "kau", label: "KAU(천원/t)", f: (v) => v / 1000 }, { key: "auction", label: "발전 유상할당 %", f: pct, ref: false },
            ]} />
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3>K-ETS 상한 반응별 비교 (2026–35 누적, '메가프로젝트 없음' 대비)</h3>
              <table>
                <thead><tr><th>상한</th><th className="num">KAU 2035 천원</th><th className="num">워터베드 감축 Mt(2035)</th><th className="num">직접 재정소요</th><th className="num">ETS 기업 순부담</th><th className="num">전력 배출권 비용</th></tr></thead>
                <tbody>{etsModes.map(({ m, a, b }) => (
                  <tr key={m}><td>{m ? "경직(워터베드)" : "수용(국가가 갭 해소)"}</td><td className="num">{f1(at(a, Y, "kau") / 1000)}</td><td className="num">{f1(at(a, Y, "Ew"))}</td><td className="num">{f1(directExtra(a, b))}</td><td className="num">{f1(cum(a, "abateCostW", 2026, 2035) - cum(a, "wbTransfer", 2026, 2035))}</td><td className="num">{f1(cum(a, "etsPS", 2026, 2035) - cum(b, "etsPS", 2026, 2035))}</td></tr>
                ))}</tbody>
              </table>
              <p className="small muted">경직 상한에서는 추가 배출이 KAU 상승과 타 업체 감축으로 흡수되어 예산 부담이 거의 없다(K-MSR 상한을 넘는 누출분만 국가 몫). 행정요금 아래에서 늘어난 배출권 비용은 소비자보다 전력부문에 먼저 쌓인다(Q1의 '한전 다리').</p>
            </div>
          </div>
          </QSection>
        </div>
      </div>
    </>
  );
}

"use client";
import { useStore } from "@/components/Store";
import { ControlPanel, ComparisonBar, type PGroup } from "@/components/Controls";
import { ChartCard, KpiTile } from "@/components/Chart";
import { Matrices } from "@/components/Matrix";
import { PageHeader } from "@/components/UI";
import { at, SECTORS, SECTOR_LABEL } from "@/engine/model.ts";

const pct = (v: number) => v * 100;
const GROUPS: PGroup[] = [
  { title: "통화정책 반응함수", ids: ["phi_pi", "phi_y", "rho_i", "rstar", "eps_r", "alpha_r", "ait_band", "ait_h", "di_exo"] },
  { title: "기업 투자·신용할당", ids: ["a_u", "a_p", "a_r", "delta_k", "cr_on", "cr_max", "cr_dsr", "cr_car", "def0", "def_dsr", "s_f"] },
  { title: "녹색투자 비중·GDCR", ids: ["theta0", "b_r", "b_tau", "b_trend", "gdcr", "chi", "rw_g", "rw_c"] },
  { title: "가계 소비·포트폴리오", ids: ["alpha2", "tau_h", "lambda1", "cash_c", "tr_share"] },
  { title: "은행·금리 스프레드", ids: ["sL", "sLh", "sD", "kappa_B", "term", "rr", "bb", "s_b"] },
  { title: "물가·환율·LNG 충격", ids: ["lam_e", "kappa_u", "g_prod", "io_el", "th_fx", "gas_shock", "fx_shock", "shock_y0", "shock_y1"] },
  { title: "재정·채무 프리미엄", ids: ["fiscal_rule", "d_star", "kappa_f", "prem_on", "mu1", "alpha_off", "g_drift", "tau_f", "tau_ind"] },
  { title: "물리적 피해 (SFF)", ids: ["dmg_on", "T2050", "eta2", "eta3", "p_prod", "adK", "adP"] },
];

export default function Lab() {
  const { scen, ref } = useStore();
  const Y = 2035;
  return (
    <>
      <PageHeader n="03" eyebrow="실험실" title="DEFINE-UK 계열 E-SFC 실험실">
        8부문(가계·기업·전력·은행·K-GX 정책금융·정부·한국은행·해외) 연간 스톡-플로우 정합 모형. 행태식은 DEFINE-UK v1.1의 형태(신용할당, 녹색비중 로짓,
        금리 규칙, 한계가격)를 따르고 재정·물가 표준형은 MFMod, 피해함수는 Dafermos 외(2017)에서 가져왔다. 슬라이더를 움직이면 2025 보정 후 2026–2050을 즉시 다시 푼다.
        실선은 현재 설정, 점선은 비교 기준이다.
      </PageHeader>
      <ComparisonBar />
      <div className="layout">
        <ControlPanel groups={GROUPS} pickers={["supply", "design", "rule"]} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <div className="kpis">
            <KpiTile t={`실질 GDP ${Y} (2025=100)`} a={(at(scen, Y, "YR") / at(scen, 2025, "YR")) * 100} b={(at(ref, Y, "YR") / at(ref, 2025, "YR")) * 100} unit="" />
            <KpiTile t={`헤드라인 CPI ${Y}`} a={pct(at(scen, Y, "piH"))} b={pct(at(ref, Y, "piH"))} unit="%" digits={2} />
            <KpiTile t={`정책금리 ${Y}`} a={pct(at(scen, Y, "i"))} b={pct(at(ref, Y, "i"))} unit="%" digits={2} />
            <KpiTile t={`국가채무/GDP ${Y}`} a={pct(at(scen, Y, "debtRatio"))} b={pct(at(ref, Y, "debtRatio"))} unit="%" />
            <KpiTile t={`녹색자본 비중 ${Y}`} a={pct(at(scen, Y, "theta"))} b={pct(at(ref, Y, "theta"))} unit="%" />
            <KpiTile t={`신용할당률 ${Y}`} a={pct(at(scen, Y, "CR"))} b={pct(at(ref, Y, "CR"))} unit="%" />
            <KpiTile t={`은행 BIS비율 ${Y}`} a={pct(at(scen, Y, "CAR"))} b={pct(at(ref, Y, "CAR"))} unit="%" />
            <KpiTile t={`국가 배출 ${Y}`} a={at(scen, Y, "EMtot")} b={at(ref, Y, "EMtot")} unit="Mt" />
          </div>
          <div className="charts">
            <ChartCard title="물가: 헤드라인·근원·전기요금" unit="%/년" scen={scen} ref={ref} series={[
              { key: "piH", label: "헤드라인", f: pct }, { key: "piC", label: "근원", f: pct }, { key: "piElec", label: "가계 전기요금", f: pct, ref: false },
            ]} />
            <ChartCard title="금리: 정책·국채·기업대출" unit="%" scen={scen} ref={ref} series={[
              { key: "i", label: "정책금리", f: pct }, { key: "iB", label: "국채 평균", f: pct }, { key: "rLc", label: "일반 대출", f: pct, ref: false }, { key: "rLg", label: "녹색 대출", f: pct, ref: false },
            ]} />
            <ChartCard title="실질성장률과 가동률 갭" unit="%, pp" scen={scen} ref={ref} series={[
              { key: "gR", label: "실질성장률", f: pct }, { key: "u", label: "가동률 갭 (u − 80%)", f: (v) => (v - 0.8) * 100 },
            ]} />
            <ChartCard title="녹색투자 비중 β·녹색자본 비중 θ" unit="%" scen={scen} ref={ref} series={[
              { key: "beta", label: "녹색투자 비중 β", f: pct }, { key: "theta", label: "녹색자본 비중 θ", f: pct },
            ]} />
            <ChartCard title="신용할당·은행 자본비율" unit="%" scen={scen} ref={ref} series={[
              { key: "CR", label: "신용할당률", f: pct }, { key: "CAR", label: "BIS비율", f: pct },
            ]} />
            <ChartCard title="공공부채 경계 D1·D2·D3" unit="% GDP" scen={scen} ref={ref} series={[
              { key: "debtRatio", label: "D1 국채", f: pct }, { key: "D2", label: "D2 +정책금융", f: pct, ref: false }, { key: "D3", label: "D3 +전력부문", f: pct, ref: false },
            ]} />
            <ChartCard title="부문별 순대출 (현재 설정)" unit="% GDP" scen={scen} zero series={SECTORS.filter((s) => s !== "CB").map((s) => ({
              key: `nl_${s}`, label: SECTOR_LABEL[s], f: (_v: number, row: Record<string, number>) => (100 * (row[`nl_${s}`] ?? 0)) / row.Y, ref: false,
            }))} />
            <ChartCard title="배출: 국가 총량과 NDC 경로" unit="Mt" scen={scen} ref={ref} series={[
              { key: "EMtot", label: "국가 순배출(ITMO 제외)" }, { key: "ndcPath", label: "NDC 경로", ref: false, color: "#8A8F99" }, { key: "emPower", label: "전환부문" },
            ]} />
          </div>
          <Matrices run={scen} />
        </div>
      </div>
    </>
  );
}

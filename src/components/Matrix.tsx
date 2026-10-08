"use client";
import { useState } from "react";
import { SECTORS, type RunOut, type Instrument } from "@/engine/model.ts";
import { Segmented, StatusBadge } from "./UI";
import { useI18n } from "@/lib/i18n";

const f = (v: number) => (Math.abs(v) < 0.05 ? "·" : v.toLocaleString("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace("-", "−"));
const e = (v: number) => (Math.abs(v) < 1e-12 ? "0" : Math.abs(v).toExponential(1));
const YEARS = [2026, 2030, 2035, 2040, 2050];

function Cells({ r }: { r: Record<string, number> }) {
  const sum = SECTORS.reduce((a, s) => a + (r[s] ?? 0), 0);
  return (
    <>
      {SECTORS.map((s) => {
        const v = r[s] ?? 0;
        return <td key={s} className={`num ${Math.abs(v) < 0.05 ? "z" : v < 0 ? "neg" : ""}`}>{f(v)}</td>;
      })}
      <td className="num sum">{e(sum)}</td>
    </>
  );
}

export function Matrices({ run }: { run: RunOut }) {
  const [year, setYear] = useState(2035);
  const i = useI18n();
  const [kind, setKind] = useState<"tfm" | "bsm">("tfm");
  const yo = run.years.find((y) => y.year === year)!;
  const prev = run.years.find((y) => y.year === year - 1);
  const instr = Object.keys(yo.bs) as Instrument[];

  const groups = new Map<string, Map<string, Record<string, number>>>();
  for (const t of yo.tx) {
    const g = groups.get(t.group) ?? new Map<string, Record<string, number>>();
    const r = g.get(t.row) ?? {};
    r[t.from] = (r[t.from] ?? 0) - t.amount;
    r[t.to] = (r[t.to] ?? 0) + t.amount;
    g.set(t.row, r);
    groups.set(t.group, g);
  }
  const dRows = instr.map((k) => {
    const r: Record<string, number> = {};
    for (const s of SECTORS) r[s] = -((yo.bs[k][s] ?? 0) - (prev?.bs[k][s] ?? 0));
    return [k, r] as const;
  });
  const colSum: Record<string, number> = {};
  for (const s of SECTORS) colSum[s] = yo.nl[s] + dRows.reduce((a, [, r]) => a + r[s], 0);
  const maxRes = Math.max(...Object.values(colSum).map(Math.abs), Math.abs(yo.checks.nlSum), yo.checks.sectorNW, yo.checks.instrSum);
  const nfw: Record<string, number> = {};
  for (const s of SECTORS) nfw[s] = instr.reduce((a, k) => a + (yo.bs[k][s] ?? 0), 0);
  const realK: Record<string, number> = { NFC: yo.v.Knfc * yo.v.P, PS: yo.v.Kps * yo.v.P, GOV: yo.v.Kgov * yo.v.P };

  return (
    <div className="mx">
      <div className="bar">
        <Segmented label={i.t("행렬", "Matrix")} value={kind} onChange={setKind} options={[{ v: "tfm", label: i.t("거래흐름행렬", "Transaction-flow matrix") }, { v: "bsm", label: i.t("대차대조표", "Balance sheet") }]} />
        <span className="small muted">{kind === "tfm" ? i.t("조원 · + 수취 / − 지급 · 금융 행은 자금 사용(−: 자산 증가)", "KRW tn · + receipt / − payment · financial rows are uses of funds (−: asset increase)") : i.t(`조원 · ${year}년 말 잔액 · + 자산 / − 부채`, `KRW tn · end-${year} stocks · + asset / − liability`)}</span>
        <span className="yr"><Segmented label={i.t("연도", "Year")} value={year} onChange={setYear} options={YEARS.map((y) => ({ v: y, label: String(y) }))} /></span>
        <StatusBadge ok={maxRes < 1e-6} sub={`${i.t("최대 |잔차|", "max |residual|")} ${e(maxRes)}`}>{kind === "tfm" ? i.t("행합·열합 = 0", "Row & column sums = 0") : i.t("금융상품 행합 = 0", "Instrument rows sum to 0")}</StatusBadge>
      </div>
      <div className="wrap">
        <table>
          <thead><tr>
            <th>{kind === "tfm" ? i.t("거래", "Transaction") : i.t("상품", "Instrument")}</th>
            {SECTORS.map((s) => <th key={s} className="num">{i.sector(s)}</th>)}
            <th className="num sum">{i.t("Σ 행", "Σ row")}</th>
          </tr></thead>
          {kind === "tfm" ? (
            <tbody>
              <tr className="head"><td colSpan={10}>{i.t("경상·자본 거래", "Current and capital transactions")}</td></tr>
              {[...groups.entries()].flatMap(([, g]) => [...g.entries()].map(([label, r]) => (
                <tr key={label}><td>{i.tx(label)}</td><Cells r={r} /></tr>
              )))}
              <tr className="total"><td>{i.t("순대출 (저축 − 투자)", "Net lending (saving − investment)")}</td><Cells r={yo.nl} /></tr>
              <tr className="head"><td colSpan={10}>{i.t("금융 거래", "Financial transactions")}</td></tr>
              {dRows.map(([k, r]) => <tr key={k}><td>Δ {i.instr(k)}</td><Cells r={r} /></tr>)}
              <tr className="total"><td>{i.t("Σ 열", "Σ column")}</td>{SECTORS.map((s) => <td key={s} className="num">{e(colSum[s])}</td>)}<td className="num sum" /></tr>
            </tbody>
          ) : (
            <tbody>
              <tr className="head"><td colSpan={10}>{i.t("금융상품", "Financial instruments")}</td></tr>
              {instr.map((k) => {
                const r: Record<string, number> = {};
                for (const s of SECTORS) r[s] = yo.bs[k][s] ?? 0;
                return <tr key={k}><td>{i.instr(k)}</td><Cells r={r} /></tr>;
              })}
              <tr className="total"><td>{i.t("순금융자산", "Net financial wealth")}</td><Cells r={nfw} /></tr>
              <tr className="head"><td colSpan={10}>{i.t("실물", "Real")}</td></tr>
              <tr><td>{i.t("실물자본 (명목)", "Fixed capital (nominal)")}</td>{SECTORS.map((s) => <td key={s} className={`num ${realK[s] ? "" : "z"}`}>{realK[s] ? f(realK[s]) : "·"}</td>)}<td className="num sum">{f(Object.values(realK).reduce((a, b) => a + b, 0))}</td></tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

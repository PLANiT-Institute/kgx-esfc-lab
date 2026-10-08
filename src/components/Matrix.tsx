"use client";
import { useState } from "react";
import { SECTORS, SECTOR_LABEL, INSTR_LABEL, type RunOut, type Instrument } from "@/engine/model.ts";

const f = (v: number) => (Math.abs(v) < 0.05 ? "·" : v.toFixed(1));

export function Matrices({ run }: { run: RunOut }) {
  const [year, setYear] = useState(2035);
  const yo = run.years.find((y) => y.year === year)!;
  const prev = run.years.find((y) => y.year === year - 1);
  // transaction-flow matrix: aggregate by row label
  const rows = new Map<string, Record<string, number>>();
  for (const t of yo.tx) {
    const r = rows.get(t.row) ?? {};
    r[t.from] = (r[t.from] ?? 0) - t.amount;
    r[t.to] = (r[t.to] ?? 0) + t.amount;
    rows.set(t.row, r);
  }
  const instr = Object.keys(yo.bs) as Instrument[];
  const dRows = instr.map((k) => {
    const r: Record<string, number> = {};
    for (const s of SECTORS) r[s] = -((yo.bs[k][s] ?? 0) - (prev?.bs[k][s] ?? 0));
    return [k, r] as const;
  });
  const colSum = (s: string) => yo.nl[s as keyof typeof yo.nl] + dRows.reduce((a, [, r]) => a + r[s], 0);
  return (
    <div className="card">
      <div className="flow">
        <h3 style={{ margin: 0 }}>거래흐름행렬(TFM)과 대차대조표(BSM)</h3>
        <select value={year} onChange={(e) => setYear(+e.target.value)}>
          {run.years.filter((y) => y.year >= 2026).map((y) => <option key={y.year}>{y.year}</option>)}
        </select>
        <span className="small muted">+ 수취 / − 지급. 금융 행은 자금의 사용(−: 자산 증가). 각 열 합 = 0, 각 행 합 = 0.</span>
      </div>
      <div className="grid" style={{ marginTop: 8 }}>
        <div className="scroll">
          <table className="matrix">
            <thead><tr><th>거래 (조원)</th>{SECTORS.map((s) => <th key={s} className="num">{SECTOR_LABEL[s]}</th>)}<th className="num">행합</th></tr></thead>
            <tbody>
              {[...rows.entries()].map(([label, r]) => {
                const sum = SECTORS.reduce((a, s) => a + (r[s] ?? 0), 0);
                return (
                  <tr key={label}><td>{label}</td>{SECTORS.map((s) => <td key={s} className={`num ${Math.abs(r[s] ?? 0) < 0.05 ? "z" : ""}`}>{f(r[s] ?? 0)}</td>)}<td className="num">{Math.abs(sum) < 1e-9 ? "0" : sum.toExponential(1)}</td></tr>
                );
              })}
              <tr><th>순대출(저축−투자)</th>{SECTORS.map((s) => <th key={s} className="num">{f(yo.nl[s])}</th>)}<th className="num">{Math.abs(yo.checks.nlSum) < 1e-9 ? "0" : yo.checks.nlSum.toExponential(1)}</th></tr>
              {dRows.map(([k, r]) => (
                <tr key={k}><td>Δ{INSTR_LABEL[k]}</td>{SECTORS.map((s) => <td key={s} className={`num ${Math.abs(r[s]) < 0.05 ? "z" : ""}`}>{f(r[s])}</td>)}<td className="num">{(() => { const x = SECTORS.reduce((a, s) => a + r[s], 0); return Math.abs(x) < 1e-8 ? "0" : x.toExponential(1); })()}</td></tr>
              ))}
              <tr><th>열합</th>{SECTORS.map((s) => <th key={s} className="num">{Math.abs(colSum(s)) < 1e-8 ? "0" : colSum(s).toExponential(1)}</th>)}<th /></tr>
            </tbody>
          </table>
        </div>
        <div className="scroll">
          <table className="matrix">
            <thead><tr><th>잔액 {year}말 (조원)</th>{SECTORS.map((s) => <th key={s} className="num">{SECTOR_LABEL[s]}</th>)}<th className="num">합</th></tr></thead>
            <tbody>
              {instr.map((k) => {
                const sum = SECTORS.reduce((a, s) => a + (yo.bs[k][s] ?? 0), 0);
                return <tr key={k}><td>{INSTR_LABEL[k]}</td>{SECTORS.map((s) => <td key={s} className={`num ${Math.abs(yo.bs[k][s] ?? 0) < 0.05 ? "z" : ""}`}>{f(yo.bs[k][s] ?? 0)}</td>)}<td className="num">{Math.abs(sum) < 1e-8 ? "0" : sum.toExponential(1)}</td></tr>;
              })}
              <tr><th>순금융자산</th>{SECTORS.map((s) => { const x = instr.reduce((a, k) => a + (yo.bs[k][s] ?? 0), 0); return <th key={s} className="num">{f(x)}</th>; })}<th className="num">0</th></tr>
              <tr><td>실물자본(명목)</td>{SECTORS.map((s) => { const k = s === "NFC" ? yo.v.Knfc : s === "PS" ? yo.v.Kps : s === "GOV" ? yo.v.Kgov : 0; return <td key={s} className={`num ${k ? "" : "z"}`}>{k ? (k * yo.v.P).toFixed(0) : "·"}</td>; })}<td /></tr>
            </tbody>
          </table>
          <p className="small muted">검사({year}): 순대출 합 {yo.checks.nlSum.toExponential(1)}, 잉여식(국채) {yo.checks.bondRedundant.toExponential(1)}, 부문 순대출=순금융자산 증감 {yo.checks.sectorNW.toExponential(1)}, GDP 지출=소득 {yo.checks.gdpIncome.toExponential(1)}</p>
        </div>
      </div>
    </div>
  );
}

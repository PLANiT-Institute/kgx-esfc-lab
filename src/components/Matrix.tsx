"use client";
import { useState } from "react";
import { SECTORS, SECTOR_LABEL, INSTR_LABEL, type RunOut, type Instrument } from "@/engine/model.ts";
import { Segmented, StatusBadge } from "./UI";

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
        <Segmented label="행렬" value={kind} onChange={setKind} options={[{ v: "tfm", label: "거래흐름행렬" }, { v: "bsm", label: "대차대조표" }]} />
        <span className="small muted">{kind === "tfm" ? "조원 · + 수취 / − 지급 · 금융 행은 자금 사용(−: 자산 증가)" : `조원 · ${year}년 말 잔액 · + 자산 / − 부채`}</span>
        <span className="yr"><Segmented label="연도" value={year} onChange={setYear} options={YEARS.map((y) => ({ v: y, label: String(y) }))} /></span>
        <StatusBadge ok={maxRes < 1e-6} sub={`최대 |잔차| ${e(maxRes)}`}>{kind === "tfm" ? "행합·열합 = 0" : "금융상품 행합 = 0"}</StatusBadge>
      </div>
      <div className="wrap">
        <table>
          <thead><tr>
            <th>{kind === "tfm" ? "거래" : "상품"}</th>
            {SECTORS.map((s) => <th key={s} className="num">{SECTOR_LABEL[s]}</th>)}
            <th className="num sum">Σ 행</th>
          </tr></thead>
          {kind === "tfm" ? (
            <tbody>
              <tr className="head"><td colSpan={10}>경상·자본 거래</td></tr>
              {[...groups.entries()].flatMap(([, g]) => [...g.entries()].map(([label, r]) => (
                <tr key={label}><td>{label}</td><Cells r={r} /></tr>
              )))}
              <tr className="total"><td>순대출 (저축 − 투자)</td><Cells r={yo.nl} /></tr>
              <tr className="head"><td colSpan={10}>금융 거래</td></tr>
              {dRows.map(([k, r]) => <tr key={k}><td>Δ {INSTR_LABEL[k]}</td><Cells r={r} /></tr>)}
              <tr className="total"><td>Σ 열</td>{SECTORS.map((s) => <td key={s} className="num">{e(colSum[s])}</td>)}<td className="num sum" /></tr>
            </tbody>
          ) : (
            <tbody>
              <tr className="head"><td colSpan={10}>금융상품</td></tr>
              {instr.map((k) => {
                const r: Record<string, number> = {};
                for (const s of SECTORS) r[s] = yo.bs[k][s] ?? 0;
                return <tr key={k}><td>{INSTR_LABEL[k]}</td><Cells r={r} /></tr>;
              })}
              <tr className="total"><td>순금융자산</td><Cells r={nfw} /></tr>
              <tr className="head"><td colSpan={10}>실물</td></tr>
              <tr><td>실물자본 (명목)</td>{SECTORS.map((s) => <td key={s} className={`num ${realK[s] ? "" : "z"}`}>{realK[s] ? f(realK[s]) : "·"}</td>)}<td className="num sum">{f(Object.values(realK).reduce((a, b) => a + b, 0))}</td></tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

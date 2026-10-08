"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import type { RunOut } from "@/engine/model.ts";

export interface SeriesSpec { key: string; label: string; color?: string; f?: (v: number, y: Record<string, number>) => number; ref?: boolean }

const COLORS = ["#1f6f5c", "#b4532a", "#3b5ba5", "#8a5a9b", "#6b8e23", "#a0522d"];

export function Chart({ title, unit, scen, ref, series, from = 2026, height = 220, diff = false, zero = false }: {
  title: string; unit: string; scen: RunOut; ref?: RunOut; series: SeriesSpec[]; from?: number; height?: number; diff?: boolean; zero?: boolean;
}) {
  const data = scen.years.filter((y) => y.year >= from).map((y, idx) => {
    const row: Record<string, number> = { year: y.year };
    const ry = ref?.years.find((r) => r.year === y.year);
    for (const s of series) {
      const val = s.f ? s.f(y.v[s.key], y.v) : y.v[s.key];
      if (diff && ry) {
        const rv = s.f ? s.f(ry.v[s.key], ry.v) : ry.v[s.key];
        row[s.key] = val - rv;
      } else {
        row[s.key] = val;
        if (ry && s.ref !== false) row[`${s.key}__ref`] = s.f ? s.f(ry.v[s.key], ry.v) : ry.v[s.key];
      }
    }
    void idx;
    return row;
  });
  const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));
  return (
    <div className="card">
      <h3>{title} <span className="muted small">({diff ? "기준 대비 차이, " : ""}{unit})</span></h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#eceee9" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={fmt} domain={["auto", "auto"]} />
          <Tooltip formatter={(v: number) => fmt(v)} labelStyle={{ fontWeight: 600 }} />
          {(diff || zero) && <ReferenceLine y={0} stroke="#999" />}
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Line key={s.key} dataKey={s.key} name={s.label} stroke={s.color ?? COLORS[i % COLORS.length]} dot={false} strokeWidth={2} isAnimationActive={false} />
          ))}
          {!diff && ref && series.filter((s) => s.ref !== false).map((s, i) => (
            <Line key={s.key + "r"} dataKey={`${s.key}__ref`} name={`${s.label} (기준)`} stroke={s.color ?? COLORS[i % COLORS.length]} strokeDasharray="4 3" strokeOpacity={0.55} dot={false} strokeWidth={1.5} isAnimationActive={false} legendType="none" />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Kpi({ t, a, b, unit, digits = 1, scale = 1 }: { t: string; a: number; b?: number; unit: string; digits?: number; scale?: number }) {
  const av = a * scale, bv = b !== undefined ? b * scale : undefined;
  const d = bv !== undefined ? av - bv : undefined;
  return (
    <div className="kpi">
      <div className="t">{t}</div>
      <div className="n">{av.toFixed(digits)} <span className="small muted">{unit}</span></div>
      {d !== undefined && <div className={`d ${d > 0 ? "pos" : d < 0 ? "neg" : ""}`}>기준 대비 {d >= 0 ? "+" : ""}{d.toFixed(digits + 1)}</div>}
    </div>
  );
}

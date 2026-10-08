"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import type { RunOut } from "@/engine/model.ts";
import { useI18n } from "@/lib/i18n";

export interface SeriesSpec { key: string; label: string; color?: string; f?: (v: number, y: Record<string, number>) => number; ref?: boolean }

export const SERIES_COLORS = ["#1F3A68", "#B8892B", "#2F8073", "#8C4A6B", "#4C66A3", "#A35A2A", "#7B5A9A"];
const TICKS = [2026, 2030, 2035, 2040, 2045, 2050];
const fmt = (v: number) => {
  if (!Number.isFinite(v)) return "–";
  const a = Math.abs(v);
  const s = a >= 1000 ? v.toLocaleString("ko-KR", { maximumFractionDigits: 0 }) : a >= 100 ? v.toFixed(0) : a >= 10 ? v.toFixed(1) : a >= 1 ? v.toFixed(2) : v.toFixed(3);
  return s.replace("-", "−");
};

interface TipPayload { dataKey: string; value: number; color: string; name: string }
function Tip({ active, payload, label, series, diff }: { active?: boolean; payload?: TipPayload[]; label?: number; series: SeriesSpec[]; diff: boolean }) {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));
  return (
    <div className="tip">
      <div className="y">{label}</div>
      {series.map((s, i) => byKey[s.key] === undefined ? null : (
        <div className="r" key={s.key}>
          <i style={{ background: s.color ?? SERIES_COLORS[i % SERIES_COLORS.length] }} />
          <span className="n">{s.label}</span>
          <b>{fmt(byKey[s.key])}</b>
          {!diff && byKey[`${s.key}__ref`] !== undefined && <span className="b">/ {fmt(byKey[`${s.key}__ref`])}</span>}
        </div>
      ))}
    </div>
  );
}

export function ChartCard({ title, unit, scen, ref, series, from = 2026, height = 176, diff = false, zero = false }: {
  title: string; unit: string; scen: RunOut; ref?: RunOut; series: SeriesSpec[]; from?: number; height?: number; diff?: boolean; zero?: boolean;
}) {
  const data = scen.years.filter((y) => y.year >= from).map((y) => {
    const row: Record<string, number> = { year: y.year };
    const ry = ref?.years.find((r) => r.year === y.year);
    for (const s of series) {
      const val = s.f ? s.f(y.v[s.key], y.v) : y.v[s.key];
      if (diff && ry) row[s.key] = val - (s.f ? s.f(ry.v[s.key], ry.v) : ry.v[s.key]);
      else {
        row[s.key] = val;
        if (ry && s.ref !== false) row[`${s.key}__ref`] = s.f ? s.f(ry.v[s.key], ry.v) : ry.v[s.key];
      }
    }
    return row;
  });
  const hasRef = !diff && !!ref && series.some((s) => s.ref !== false);
  const { t } = useI18n();
  return (
    <div className="chart">
      <div className="h"><b>{title}</b><span>({diff ? t("기준 대비 차이, ", "difference vs baseline, ") : ""}{unit})</span></div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#EEE8DB" />
          <XAxis dataKey="year" ticks={TICKS} tick={{ fontSize: 11, fill: "#737985" }} stroke="#CBC2AD" tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#737985" }} width={44} tickFormatter={fmt} domain={["auto", "auto"]} stroke="#CBC2AD" tickLine={false} axisLine={false} tickCount={5} />
          <Tooltip content={<Tip series={series} diff={diff} />} cursor={{ stroke: "rgba(31,58,104,0.35)" }} />
          {(diff || zero) && <ReferenceLine y={0} stroke="#8A8F99" />}
          {series.map((s, i) => (
            <Line key={s.key} dataKey={s.key} name={s.label} stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]} dot={false} strokeWidth={2} isAnimationActive={false} />
          ))}
          {hasRef && series.filter((s) => s.ref !== false).map((s) => {
            const i = series.indexOf(s);
            return <Line key={s.key + "r"} dataKey={`${s.key}__ref`} stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]} strokeDasharray="4 3" strokeOpacity={0.8} dot={false} strokeWidth={1.4} isAnimationActive={false} />;
          })}
        </LineChart>
      </ResponsiveContainer>
      <div className="legend">
        {series.map((s, i) => <span key={s.key}><i style={{ borderColor: s.color ?? SERIES_COLORS[i % SERIES_COLORS.length] }} />{s.label}</span>)}
        {hasRef && <span className="key"><i /> {t("현재", "current")} <i className="dash" style={{ marginLeft: 6 }} /> {t("기준", "baseline")}</span>}
      </div>
    </div>
  );
}

export function KpiTile({ t, a, b, unit, digits = 1, scale = 1 }: { t: string; a: number; b?: number; unit: string; digits?: number; scale?: number }) {
  const { t: tr } = useI18n();
  const av = a * scale;
  const bv = b !== undefined ? b * scale : undefined;
  const d = bv !== undefined ? av - bv : undefined;
  const dd = digits + 1;
  const isZero = d !== undefined && Math.abs(d) < 0.5 * Math.pow(10, -dd);
  const cls = d === undefined ? "" : isZero ? "zero" : d > 0 ? "pos" : "neg";
  const arrow = isZero ? "＝" : d !== undefined && d > 0 ? "▲" : "▼";
  return (
    <div className="kpi">
      <div className="t">{t}</div>
      <div className="v"><b>{Number.isFinite(av) ? av.toFixed(digits).replace("-", "−") : "–"}</b><span>{unit}</span></div>
      {d !== undefined && (
        <div className={`d ${cls}`}>
          <span className="a">{arrow}</span>
          <span className="x">{isZero ? (0).toFixed(dd) : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(dd)}`}</span>
          <span className="m">{tr("기준 대비", "vs baseline")}</span>
        </div>
      )}
    </div>
  );
}

"use client";
import { useMemo, useState } from "react";
import { PARAM_INDEX, DEFAULTS, type ParamDef } from "@/engine/params.ts";
import { RULE_LABEL, DESIGN_LABEL, SUPPLY_LABEL, type MonRule, type Design, type Supply } from "@/engine/model.ts";
import { useStore, REF_LABEL, type RefMode } from "./Store";
import { useI18n } from "@/lib/i18n";
import { GradeBadge, Segmented, StatusBadge } from "./UI";

const PCT_UNITS = new Set(["비율", "/년"]);
const decimals = (step: number) => (step >= 1 ? 0 : Math.min(4, Math.max(0, Math.ceil(-Math.log10(step) - 1e-9))));

/** Display a parameter value: ratios as %, otherwise with the slider step's precision. */
export function fmtVal(v: number, p: ParamDef | { unit: string; step?: number }): string {
  const step = (p as ParamDef).step ?? 0.01;
  if (PCT_UNITS.has(p.unit) && Math.abs(v) < 1.5) {
    const d = Math.max(0, decimals(step) - 2);
    return `${(v * 100).toFixed(d)}%`.replace("-", "−");
  }
  if (Math.abs(v) >= 1000) return v.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  return v.toFixed(decimals(step)).replace("-", "−");
}
const unitLabel = (p: ParamDef, u: (x: string) => string) => (PCT_UNITS.has(p.unit) ? "" : p.unit === "스위치" || p.unit === "선택" ? "" : u(p.unit));

export function ParamSlider({ id }: { id: string }) {
  const { over, setParam, resetParams } = useStore();
  const i = useI18n();
  const p = PARAM_INDEX[id];
  const on = i.t("켬", "On"), off = i.t("끔", "Off");
  if (!p) return null;
  const val = (over as Record<string, number>)[id] ?? DEFAULTS[id];
  const changed = val !== DEFAULTS[id];
  const isToggle = p.unit === "스위치";
  const isChoice = p.unit === "선택";
  const frac = p.max > p.min ? (p.value - p.min) / (p.max - p.min) : 0;
  return (
    <div className={`prm ${changed ? "changed" : ""}`}>
      <div className="l1">
        <span className="dot" />
        <span className="lab" title={p.id}>{i.pLabel(p)}</span>
        <GradeBadge g={p.grade} />
        <span className="val">{isToggle ? (val ? on : off) : isChoice ? String(val) : fmtVal(val, p)}</span>
        <span className="unit">{unitLabel(p, i.unit)}</span>
        <button className="rst" title={i.t("기본값으로 되돌리기", "Reset to default")} disabled={!changed} onClick={() => resetParams([id])}>↺</button>
      </div>
      {isToggle ? (
        <Segmented options={[{ v: 1, label: on }, { v: 0, label: off }]} value={val ? 1 : 0} onChange={(v) => setParam(id, v)} />
      ) : (
        <div className="track">
          <span className="tick" style={{ left: `calc(7px + (100% - 14px) * ${frac})` }} />
          <input type="range" min={p.min} max={p.max} step={p.step} value={val} aria-label={i.pLabel(p)}
            onChange={(e) => setParam(id, parseFloat(e.target.value))} />
        </div>
      )}
      <div className="l3">
        <span>{i.pNote(p) ?? i.pSource(p)}</span>
        {changed && <span className="def">{i.t("기본", "default")} {isToggle ? (p.value ? on : off) : isChoice ? p.value : fmtVal(p.value, p)}</span>}
      </div>
    </div>
  );
}

export interface PGroup { title: string; en?: string; ids: string[] }

export function ControlPanel({ groups, pickers = ["supply", "design", "rule"] }: { groups: PGroup[]; pickers?: ("rule" | "design" | "supply")[] }) {
  const s = useStore();
  const i = useI18n();
  const [q, setQ] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>(() => Object.fromEntries(groups.map((g, i) => [g.title, i > 0])));
  const overMap = s.over as Record<string, number>;
  const isChanged = (id: string) => overMap[id] !== undefined && overMap[id] !== DEFAULTS[id];
  const allIds = groups.flatMap((g) => g.ids);
  const changedN = allIds.filter(isChanged).length;
  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => groups.map((g) => ({
    ...g,
    shown: g.ids.filter((id) => {
      const p = PARAM_INDEX[id];
      if (!p) return false;
      if (onlyChanged && !isChanged(id)) return false;
      if (query && !`${p.id} ${p.label} ${p.source} ${p.note ?? ""} ${i.pLabel(p)} ${i.pSource(p)}`.toLowerCase().includes(query)) return false;
      return true;
    }),
  })), [groups, query, onlyChanged, s.over, i.lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const forceOpen = query !== "" || onlyChanged;
  const allClosed = groups.every((g) => closed[g.title]);
  const anyShown = filtered.some((g) => g.shown.length > 0);

  return (
    <aside className="panel">
      <div className="top">
        {pickers.includes("supply") && (
          <label className="f"><span>{i.t("메가프로젝트 공급 시나리오", "Megaproject supply scenario")}</span>
            <select className="select" value={s.supply} onChange={(e) => s.setSupply(e.target.value as Supply)}>
              {Object.keys(SUPPLY_LABEL).map((k) => <option key={k} value={k}>{i.supply(k)}</option>)}
            </select></label>
        )}
        {pickers.includes("design") && (
          <label className="f"><span>{i.t("전력시장·요금 설계", "Power market · tariff design")}</span>
            <select className="select" value={s.design} onChange={(e) => s.setDesign(e.target.value as Design)}>
              {Object.keys(DESIGN_LABEL).map((k) => <option key={k} value={k}>{i.design(k)}</option>)}
            </select></label>
        )}
        {pickers.includes("rule") && (
          <label className="f"><span>{i.t("한국은행 반응함수", "Bank of Korea reaction function")}</span>
            <select className="select" value={s.rule} onChange={(e) => s.setRule(e.target.value as MonRule)}>
              {Object.keys(RULE_LABEL).map((k) => <option key={k} value={k}>{i.rule(k)}</option>)}
            </select></label>
        )}
      </div>
      <div className="tools">
        <div className="search">
          <span className="ic">⌕</span>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={i.t("파라미터 검색 (이름·id·출처)", "Search parameters (name · id · source)")} />
          {q && <button className="x" onClick={() => setQ("")} aria-label={i.t("검색 지우기", "Clear search")}>×</button>}
        </div>
        <div className="row">
          <Segmented label={i.t("표시", "Show")} value={onlyChanged ? "c" : "a"} onChange={(v) => setOnlyChanged(v === "c")}
            options={[{ v: "a", label: `${i.t("전체", "All")} ${allIds.length}` }, { v: "c", label: `${i.t("변경됨", "Changed")} ${changedN}` }]} />
          <button className="linkbtn" onClick={() => setClosed(Object.fromEntries(groups.map((g) => [g.title, !allClosed])))}>
            {allClosed ? i.t("모두 펼치기", "Expand all") : i.t("모두 접기", "Collapse all")}
          </button>
        </div>
      </div>
      <div className="scroll">
        {filtered.map((g) => {
          if (forceOpen && g.shown.length === 0) return null;
          const open = forceOpen || !closed[g.title];
          const n = g.ids.filter(isChanged).length;
          return (
            <div className="grp" key={g.title}>
              <button onClick={() => setClosed((c) => ({ ...c, [g.title]: !c[g.title] }))} aria-expanded={open}>
                <span className="chev">{open ? "▼" : "▶"}</span>
                <span className="name">{i.t(g.title, g.en ?? g.title)}</span>
                {n > 0 && <span className="chg">● {n}</span>}
                <span className="cnt">{g.ids.length}</span>
              </button>
              {open && g.shown.map((id) => <ParamSlider key={id} id={id} />)}
            </div>
          );
        })}
        {!anyShown && <div className="empty">{i.t("일치하는 파라미터가 없다.", "No matching parameters.")}</div>}
      </div>
      {changedN > 0 && (
        <div className="foot">
          <b>● {i.t(`${changedN}개 변경됨`, `${changedN} changed`)}</b>
          <button onClick={() => s.resetParams(allIds)}>{i.t("모두 되돌리기", "Reset all")}</button>
        </div>
      )}
    </aside>
  );
}

export function ComparisonBar() {
  const s = useStore();
  const i = useI18n();
  const ok = s.scen.maxCheck < 1e-6;
  return (
    <div className="cbar">
      <span className="lbl"><i />{i.t("비교 기준", "Baseline")}</span>
      <select className="select" style={{ minWidth: 220 }} value={s.refMode} onChange={(e) => s.setRefMode(e.target.value as RefMode)}>
        {Object.keys(REF_LABEL).map((k) => <option key={k} value={k} disabled={k === "pinned" && !s.pinned}>{i.ref(k)}</option>)}
      </select>
      <button className="btn" onClick={s.pin}>{i.t("현재 설정을 A안으로 고정", "Pin current settings as case A")}</button>
      <button className="btn" onClick={() => s.resetParams()}>{i.t("파라미터 전체 초기화", "Reset all parameters")}</button>
      {s.pinned && s.refMode === "pinned" && <span className="pin">{i.t("A안 고정됨", "Case A pinned")} · {(s.pinnedAt ?? "").replace("변경", i.t("변경", "changed")).replace("개", i.t("개", ""))}</span>}
      <StatusBadge ok={ok} sub={i.t(`최대 잔차 ${s.scen.maxCheck.toExponential(1)} 조원`, `max residual ${s.scen.maxCheck.toExponential(1)} KRW tn`)}>{ok ? i.t("SFC 검사 통과", "SFC checks pass") : i.t("SFC 검사 실패", "SFC checks fail")}</StatusBadge>
    </div>
  );
}

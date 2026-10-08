"use client";
import { PARAM_INDEX, DEFAULTS } from "@/engine/params.ts";
import { RULE_LABEL, DESIGN_LABEL, SUPPLY_LABEL, type MonRule, type Design, type Supply } from "@/engine/model.ts";
import { useStore, REF_LABEL, type RefMode } from "./Store";

export function fmtVal(v: number, unit: string) {
  if (unit === "비율" || unit === "/년" || unit.startsWith("비율")) return Math.abs(v) < 1 ? `${(v * 100).toFixed(2).replace(/\.?0+$/, "")}%` : v.toString();
  if (Math.abs(v) >= 1000) return v.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  return (+v.toPrecision(4)).toString();
}

export function ParamSlider({ id }: { id: string }) {
  const { over, setParam, resetParams } = useStore();
  const p = PARAM_INDEX[id];
  if (!p) return <div className="small">unknown {id}</div>;
  const val = (over as Record<string, number>)[id] ?? DEFAULTS[id];
  const changed = (over as Record<string, number>)[id] !== undefined && val !== DEFAULTS[id];
  const isSwitch = p.unit === "스위치";
  const isChoice = p.unit === "선택";
  return (
    <div className="ctl">
      <label>
        <span>
          {p.label} <span className={`pill ${p.grade}`}>{p.grade}</span>
          {changed && (
            <a className="small" style={{ marginLeft: 4 }} onClick={() => resetParams([id])} href="#!">
              되돌리기
            </a>
          )}
        </span>
        <span className="v">{isSwitch ? (val ? "켬" : "끔") : isChoice ? val : `${fmtVal(val, p.unit)}${p.unit.startsWith("비율") || p.unit === "/년" ? "" : " " + p.unit}`}</span>
      </label>
      {isSwitch ? (
        <div className="seg">
          <button className={val ? "on" : ""} onClick={() => setParam(id, 1)}>켬</button>
          <button className={!val ? "on" : ""} onClick={() => setParam(id, 0)}>끔</button>
        </div>
      ) : (
        <input type="range" min={p.min} max={p.max} step={p.step} value={val} onChange={(e) => setParam(id, parseFloat(e.target.value))} />
      )}
      <div className="hint">{p.note ?? p.source}</div>
    </div>
  );
}

export function ScenarioPickers({ show = ["rule", "design", "supply"] }: { show?: ("rule" | "design" | "supply")[] }) {
  const s = useStore();
  return (
    <div>
      {show.includes("supply") && (
        <div className="ctl">
          <label><span>메가프로젝트 공급 시나리오</span></label>
          <select value={s.supply} onChange={(e) => s.setSupply(e.target.value as Supply)} style={{ width: "100%" }}>
            {Object.entries(SUPPLY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      )}
      {show.includes("design") && (
        <div className="ctl">
          <label><span>전력시장·요금 설계</span></label>
          <select value={s.design} onChange={(e) => s.setDesign(e.target.value as Design)} style={{ width: "100%" }}>
            {Object.entries(DESIGN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      )}
      {show.includes("rule") && (
        <div className="ctl">
          <label><span>한국은행 반응함수</span></label>
          <select value={s.rule} onChange={(e) => s.setRule(e.target.value as MonRule)} style={{ width: "100%" }}>
            {Object.entries(RULE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

export function RefPicker() {
  const s = useStore();
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="flow">
        <b>비교 기준(점선)</b>
        <select value={s.refMode} onChange={(e) => s.setRefMode(e.target.value as RefMode)}>
          {Object.entries(REF_LABEL).map(([k, v]) => <option key={k} value={k} disabled={k === "pinned" && !s.pinned}>{v}</option>)}
        </select>
        <button onClick={s.pin}>현재 설정을 A안으로 고정</button>
        <button onClick={() => s.resetParams()}>파라미터 전체 초기화</button>
        <span className={`check ${s.scen.maxCheck < 1e-6 ? "ok" : "bad"} small`}>
          SFC 검사: 최대 잔차 {s.scen.maxCheck.toExponential(1)} 조원 {s.scen.maxCheck < 1e-6 ? "(통과)" : "(실패)"}
        </span>
      </div>
    </div>
  );
}

export function Group({ title, ids, open = false }: { title: string; ids: string[]; open?: boolean }) {
  return (
    <details open={open}>
      <summary>{title}</summary>
      {ids.map((id) => <ParamSlider key={id} id={id} />)}
    </details>
  );
}

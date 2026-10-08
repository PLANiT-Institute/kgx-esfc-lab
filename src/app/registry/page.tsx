"use client";
import { useMemo, useState } from "react";
import { PARAMS, GROUPS, DEFAULTS } from "@/engine/params.ts";
import { useStore } from "@/components/Store";
import { fmtVal } from "@/components/Controls";

const LIN: Record<string, string> = { DEF: "DEFINE-UK", SFF: "Dafermos 2017", MFM: "MFMod 2019", MFE: "MFMod 전력 2024", GMM: "GMMET", L1: "PLANiT Layer 1", KGX: "K-GX", OWN: "자체" };

export default function Registry() {
  const { over, settings } = useStore();
  const [g, setG] = useState("all");
  const [grade, setGrade] = useState("all");
  const [lin, setLin] = useState("all");
  const [q, setQ] = useState("");
  const rows = useMemo(() => PARAMS.filter((p) => (g === "all" || p.group === g) && (grade === "all" || p.grade === grade) && (lin === "all" || p.lineage.includes(lin as never)) && (q === "" || (p.id + p.label + p.source).toLowerCase().includes(q.toLowerCase()))), [g, grade, lin, q]);
  const counts = { A: PARAMS.filter((p) => p.grade === "A").length, B: PARAMS.filter((p) => p.grade === "B").length, C: PARAMS.filter((p) => p.grade === "C").length };
  const download = () => {
    const blob = new Blob([JSON.stringify({ settings, overrides: over, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "kgx-esfc-scenario.json"; a.click();
  };
  return (
    <>
      <h1>파라미터·식 등록부</h1>
      <p className="lead">엔진이 쓰는 모든 숫자({PARAMS.length}개)의 값·범위·단위·등급·출처·계보. 등급 A {counts.A} · B {counts.B} · C {counts.C}. 출처 ID(S01…, E01…)는 Track B Layer-1·E-SFC 등록부(params.py, params_esfc.py)와 같다.</p>
      <div className="card flow" style={{ marginBottom: 12 }}>
        <select value={g} onChange={(e) => setG(e.target.value)}><option value="all">모든 블록</option>{Object.entries(GROUPS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={grade} onChange={(e) => setGrade(e.target.value)}><option value="all">모든 등급</option><option>A</option><option>B</option><option>C</option></select>
        <select value={lin} onChange={(e) => setLin(e.target.value)}><option value="all">모든 계보</option>{Object.entries(LIN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input placeholder="검색" value={q} onChange={(e) => setQ(e.target.value)} style={{ padding: 5, border: "1px solid #ddd", borderRadius: 6 }} />
        <button onClick={download}>현재 시나리오 JSON 내보내기</button>
      </div>
      <div className="card scroll" style={{ maxHeight: "none" }}>
        <table>
          <thead><tr><th>id</th><th>이름</th><th className="num">기본값</th><th className="num">현재</th><th>범위</th><th>단위</th><th>등급</th><th>계보</th><th>출처·메모</th></tr></thead>
          <tbody>{rows.map((p) => {
            const cur = (over as Record<string, number>)[p.id] ?? DEFAULTS[p.id];
            return (
              <tr key={p.id}><td className="mono small">{p.id}</td><td>{p.label}<div className="small muted">{GROUPS[p.group]}</div></td><td className="num">{fmtVal(p.value, p.unit)}</td>
                <td className="num" style={{ color: cur !== p.value ? "var(--accent2)" : undefined }}>{fmtVal(cur, p.unit)}</td>
                <td className="small mono">{fmtVal(p.min, p.unit)} – {fmtVal(p.max, p.unit)}</td><td className="small">{p.unit}</td><td><span className={`pill ${p.grade}`}>{p.grade}</span></td>
                <td className="small">{p.lineage.map((l) => LIN[l]).join(", ")}</td><td className="small">{p.source}{p.note ? <div className="muted">{p.note}</div> : null}</td></tr>
            );
          })}</tbody>
        </table>
      </div>
    </>
  );
}

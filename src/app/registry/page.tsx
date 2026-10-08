"use client";
import { useMemo, useState } from "react";
import { PARAMS, GROUPS, DEFAULTS } from "@/engine/params.ts";
import { useStore } from "@/components/Store";
import { fmtVal } from "@/components/Controls";
import { GradeBadge, PageHeader, Segmented } from "@/components/UI";
import { useI18n } from "@/lib/i18n";

const LIN: Record<string, [string, string]> = { DEF: ["DEFINE-UK", "DEFINE-UK"], SFF: ["Dafermos 2017", "Dafermos 2017"], MFM: ["MFMod 2019", "MFMod 2019"], MFE: ["MFMod 전력 2024", "MFMod power 2024"], GMM: ["GMMET", "GMMET"], L1: ["PLANiT Layer 1", "PLANiT Layer 1"], KGX: ["K-GX", "K-GX"], OWN: ["자체", "Own"] };

export default function Registry() {
  const { over, settings } = useStore();
  const i = useI18n();
  const t = i.t;
  const [g, setG] = useState("all");
  const [grade, setGrade] = useState("all");
  const [lin, setLin] = useState("all");
  const [q, setQ] = useState("");
  const rows = useMemo(() => PARAMS.filter((p) => (g === "all" || p.group === g) && (grade === "all" || p.grade === grade) && (lin === "all" || p.lineage.includes(lin as never)) && (q === "" || (p.id + p.label + p.source + i.pLabel(p) + i.pSource(p)).toLowerCase().includes(q.toLowerCase()))), [g, grade, lin, q, i]);
  const cnt = (k: string) => PARAMS.filter((p) => p.grade === k).length;
  const download = () => {
    const blob = new Blob([JSON.stringify({ settings, overrides: over, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "kgx-esfc-scenario.json"; a.click();
  };
  return (
    <>
      <PageHeader n="05" eyebrow={t("등록부", "Registry")} title={t("파라미터·식 등록부", "Parameter registry")}>
        {t(`엔진이 쓰는 모든 숫자(${PARAMS.length}개)의 값·범위·단위·등급·출처·계보. 출처 ID(S01…, E01…)는 Track B Layer-1·E-SFC 등록부(params.py, params_esfc.py)와 같다.`, `Every number the engine uses (${PARAMS.length}) with value, range, unit, grade, source and lineage. Source IDs (S01…, E01…) match the Track B Layer-1 and E-SFC registries (params.py, params_esfc.py). Grade A = official statistic, B = literature / derived, C = approximation / assumption.`)}
      </PageHeader>
      <div className="cbar">
        <select className="select" value={g} onChange={(e) => setG(e.target.value)}><option value="all">{t("모든 블록", "All blocks")}</option>{Object.keys(GROUPS).map((k) => <option key={k} value={k}>{i.group(k)}</option>)}</select>
        <Segmented label={t("등급", "Grade")} value={grade} onChange={setGrade} options={[{ v: "all", label: `${t("전체", "All")} ${PARAMS.length}` }, { v: "A", label: `A ${cnt("A")}` }, { v: "B", label: `B ${cnt("B")}` }, { v: "C", label: `C ${cnt("C")}` }]} />
        <select className="select" value={lin} onChange={(e) => setLin(e.target.value)}><option value="all">{t("모든 계보", "All lineages")}</option>{Object.entries(LIN).map(([k, v]) => <option key={k} value={k}>{t(v[0], v[1])}</option>)}</select>
        <input className="input" placeholder={t("검색 (id·이름·출처)", "Search (id · name · source)")} value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 200 }} />
        <span className="small muted">{t(`${rows.length}개 표시`, `${rows.length} shown`)}</span>
        <button className="btn primary" style={{ marginLeft: "auto" }} onClick={download}>{t("현재 시나리오 JSON 내보내기", "Export current scenario (JSON)")}</button>
      </div>
      <div className="table-wrap" style={{ overflow: "visible" }}>
        <table className="sticky-head">
          <thead><tr><th>id</th><th>{t("이름", "Name")}</th><th className="num">{t("기본값", "Default")}</th><th className="num">{t("현재", "Current")}</th><th>{t("범위", "Range")}</th><th>{t("단위", "Unit")}</th><th>{t("등급", "Grade")}</th><th>{t("계보", "Lineage")}</th><th>{t("출처·메모", "Source · note")}</th></tr></thead>
          <tbody>{rows.map((p) => {
            const cur = (over as Record<string, number>)[p.id] ?? DEFAULTS[p.id];
            const changed = cur !== p.value;
            return (
              <tr key={p.id} className={changed ? "changed" : ""}>
                <td className="mono small">{p.id}</td>
                <td>{i.pLabel(p)}<div className="small muted">{i.group(p.group)}</div></td>
                <td className="num">{fmtVal(p.value, p)}</td>
                <td className="num" style={changed ? { color: "var(--gold-600)", fontWeight: 700 } : undefined}>{fmtVal(cur, p)}</td>
                <td className="small" style={{ whiteSpace: "nowrap" }}>{fmtVal(p.min, p)} – {fmtVal(p.max, p)}</td>
                <td className="small">{i.unit(p.unit)}</td>
                <td><GradeBadge g={p.grade} /></td>
                <td className="small">{p.lineage.map((l) => t(LIN[l][0], LIN[l][1])).join(", ")}</td>
                <td className="small">{i.pSource(p)}{i.pNote(p) ? <div className="muted">{i.pNote(p)}</div> : null}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </>
  );
}

"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PARAM_INDEX, GROUPS, type ParamDef } from "@/engine/params.ts";
import { SECTOR_LABEL, INSTR_LABEL, RULE_LABEL, DESIGN_LABEL, SUPPLY_LABEL, type Sector, type Instrument } from "@/engine/model.ts";
import { MODELS, ISSUES, KGX_FACTS, CAVEATS, PROPOSAL_STEPS } from "./content";
import { MODELS_EN, ISSUES_EN, KGX_FACTS_EN, CAVEATS_EN, PROPOSAL_STEPS_EN } from "./content_en";
import { PARAM_EN, UNIT_EN, GROUP_EN, SECTOR_EN, INSTR_EN, RULE_EN, DESIGN_EN, SUPPLY_EN, REF_EN, TX_EN } from "./en";

export type Lang = "ko" | "en";
const KEY = "kgx-esfc-lab:lang";

const REF_KO: Record<string, string> = {
  noMP: "메가프로젝트 없음 (같은 설정)", noKGX: "K-GX 없음 (같은 설정)", pinned: "고정한 A안", baseRule: "기본 설정 (테일러·행정요금·G)",
};

function make(lang: Lang) {
  const en = lang === "en";
  const pick = <T,>(ko: T, eng: T): T => (en ? eng : ko);
  return {
    lang,
    t: pick as <T>(ko: T, eng: T) => T,
    pLabel: (p: ParamDef) => (en ? PARAM_EN[p.id]?.[0] ?? p.label : p.label),
    pSource: (p: ParamDef) => (en ? PARAM_EN[p.id]?.[1] ?? p.source : p.source),
    pNote: (p: ParamDef) => (en ? PARAM_EN[p.id]?.[2] : p.note),
    unit: (u: string) => (en ? UNIT_EN[u] ?? u : u),
    group: (g: string) => (en ? GROUP_EN[g] ?? GROUPS[g] : GROUPS[g]),
    sector: (s: Sector) => (en ? SECTOR_EN[s] : SECTOR_LABEL[s]),
    instr: (k: Instrument) => (en ? INSTR_EN[k] : INSTR_LABEL[k]),
    rule: (k: string) => (en ? RULE_EN[k] : RULE_LABEL[k as keyof typeof RULE_LABEL]),
    design: (k: string) => (en ? DESIGN_EN[k] : DESIGN_LABEL[k as keyof typeof DESIGN_LABEL]),
    supply: (k: string) => (en ? SUPPLY_EN[k] : SUPPLY_LABEL[k as keyof typeof SUPPLY_LABEL]),
    ref: (k: string) => (en ? REF_EN[k] : REF_KO[k]),
    tx: (row: string) => (en ? TX_EN[row] ?? row : row),
    models: en ? MODELS_EN : MODELS,
    issues: en ? ISSUES_EN : ISSUES,
    facts: en ? KGX_FACTS_EN : KGX_FACTS,
    caveats: en ? CAVEATS_EN : CAVEATS,
    steps: en ? PROPOSAL_STEPS_EN : PROPOSAL_STEPS,
    num: (v: number, d = 1) => (Number.isFinite(v) ? v.toLocaleString(en ? "en-US" : "ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−") : "–"),
  };
}
export type I18n = ReturnType<typeof make> & { setLang: (l: Lang) => void };

const Ctx = createContext<I18n | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("lang");
    const saved = localStorage.getItem(KEY);
    const l = q === "en" || q === "ko" ? q : saved === "en" ? "en" : "ko";
    setLangState(l);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === "en" ? "K-GX E-SFC Policy Lab · PLANiT" : "K-GX E-SFC Policy Lab · PLANiT";
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(KEY, l);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.history.replaceState(null, "", url.toString());
  };
  const value = useMemo(() => ({ ...make(lang), setLang }), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("LangProvider missing");
  return v;
}

export { PARAM_INDEX };

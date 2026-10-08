"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { run, DEFAULT_SETTINGS, type Settings, type RunOut, type MonRule, type Design, type Supply } from "@/engine/model.ts";
import type { Params } from "@/engine/params.ts";

export type RefMode = "noMP" | "noKGX" | "pinned" | "baseRule";
export const REF_LABEL: Record<RefMode, string> = {
  noMP: "메가프로젝트 없음 (같은 설정)",
  noKGX: "K-GX 없음 (같은 설정)",
  pinned: "고정한 A안",
  baseRule: "기본 설정 (테일러·행정요금·G)",
};

interface Store {
  rule: MonRule; design: Design; supply: Supply; over: Partial<Params>;
  refMode: RefMode; pinned: Settings | null;
  setRule: (r: MonRule) => void; setDesign: (d: Design) => void; setSupply: (s: Supply) => void;
  setParam: (k: string, v: number) => void; resetParams: (keys?: string[]) => void;
  setRefMode: (m: RefMode) => void; pin: () => void;
  settings: Settings; refSettings: Settings; scen: RunOut; ref: RunOut;
}

const Ctx = createContext<Store | null>(null);
const KEY = "kgx-esfc-lab:v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [rule, setRule] = useState<MonRule>(DEFAULT_SETTINGS.rule);
  const [design, setDesign] = useState<Design>(DEFAULT_SETTINGS.design);
  const [supply, setSupply] = useState<Supply>(DEFAULT_SETTINGS.supply);
  const [over, setOver] = useState<Partial<Params>>({});
  const [refMode, setRefMode] = useState<RefMode>("noMP");
  const [pinned, setPinned] = useState<Settings | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.rule) setRule(s.rule);
        if (s.design) setDesign(s.design);
        if (s.supply) setSupply(s.supply);
        if (s.over) setOver(s.over);
        if (s.refMode) setRefMode(s.refMode);
        if (s.pinned) setPinned(s.pinned);
      }
    } catch { /* ignore corrupted storage */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify({ rule, design, supply, over, refMode, pinned }));
  }, [loaded, rule, design, supply, over, refMode, pinned]);

  const settings: Settings = useMemo(() => ({ rule, design, supply, params: over }), [rule, design, supply, over]);
  const refSettings: Settings = useMemo(() => {
    if (refMode === "noMP") return { ...settings, params: { ...over, mp_on: 0 } };
    if (refMode === "noKGX") return { ...settings, params: { ...over, kgx_on: 0 } };
    if (refMode === "pinned" && pinned) return pinned;
    return DEFAULT_SETTINGS;
  }, [refMode, settings, over, pinned]);

  const scen = useMemo(() => safeRun(settings), [settings]);
  const ref = useMemo(() => safeRun(refSettings), [refSettings]);

  const store: Store = {
    rule, design, supply, over, refMode, pinned,
    setRule, setDesign, setSupply,
    setParam: (k, v) => setOver((o) => ({ ...o, [k]: v })),
    resetParams: (keys) => setOver((o) => {
      if (!keys) return {};
      const n = { ...o };
      for (const k of keys) delete (n as Record<string, number>)[k];
      return n;
    }),
    setRefMode,
    pin: () => { setPinned(settings); setRefMode("pinned"); },
    settings, refSettings, scen, ref,
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

function safeRun(s: Settings): RunOut {
  try { return run(s); } catch { return run(DEFAULT_SETTINGS); }
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}

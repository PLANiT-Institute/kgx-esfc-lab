// K-GX E-SFC Policy Lab engine (annual, 2025 calibration year + 2026–2050).
// Structure follows DEFINE-UK v1.1 (sectors, credit rationing, green share, rate rule, marginal electricity price),
// with modules from Dafermos et al. 2017 (SFF: green/conventional split, damages), MFMod 2019 (fiscal identities,
// Taylor rule, hybrid Phillips curve, debt premium as optional closure), Electricity Transition in MFMod 2024
// (power-plan soft link: capex import content, fuel imports, tariff -> CPI) and GMMET (convex firming need with VRE share).
// Units: trillion KRW (조원), TWh, Mt CO2, rates as fractions. Pure TypeScript, no dependencies.

import { withDefaults, type Params } from "./params.ts";

export type Sector = "HH" | "NFC" | "PS" | "BK" | "PB" | "GOV" | "CB" | "ROW";
export const SECTORS: Sector[] = ["HH", "NFC", "PS", "BK", "PB", "GOV", "CB", "ROW"];
export const SECTOR_LABEL: Record<Sector, string> = {
  HH: "가계", NFC: "비금융기업", PS: "전력부문", BK: "은행", PB: "K-GX 정책금융", GOV: "정부", CB: "한국은행", ROW: "해외",
};

export type MonRule = "define" | "taylorH" | "taylorC" | "ait" | "fixed";
export type Design = "admin" | "cfd" | "pool";
export type Supply = "G" | "R" | "M" | "N";

export interface Settings {
  rule: MonRule;
  design: Design;
  supply: Supply;
  params?: Partial<Params>;
}

export const DEFAULT_SETTINGS: Settings = { rule: "taylorH", design: "admin", supply: "G" };

export const RULE_LABEL: Record<MonRule, string> = {
  define: "DEFINE-UK 규칙 (식427, 후행 물가)",
  taylorH: "테일러: 헤드라인 CPI",
  taylorC: "테일러: 근원(look-through)",
  ait: "적응적 물가목표(AIT, 밴드·기간평균)",
  fixed: "고정금리 경로",
};
export const DESIGN_LABEL: Record<Design, string> = {
  admin: "행정요금·단일구매자 (현행)",
  cfd: "CfD·장기계약 (요금 전가 보장)",
  pool: "한계가격 풀 (DEFINE-UK식 시장가격)",
};
export const SUPPLY_LABEL: Record<Supply, string> = {
  G: "G: 가스 주도", R: "R: 재생 주도(가스 보강)", M: "M: 혼합", N: "N: 원전·SMR(2033~, 가스 가교)",
};

// Instruments: holder (+) / issuer (−)
export type Instrument =
  | "Cash" | "Res" | "Dep" | "Ln_nfc" | "Ln_ps" | "Ln_hh" | "PBL" | "PBE" | "PBB" | "Bond" | "Adv" | "FXR";
export const INSTR_LABEL: Record<Instrument, string> = {
  Cash: "현금", Res: "지급준비금", Dep: "예금", Ln_nfc: "기업 은행대출", Ln_ps: "전력부문 차입", Ln_hh: "가계대출",
  PBL: "정책대출", PBE: "정책 지분투자", PBB: "정책금융채", Bond: "국채", Adv: "한은 대출(−통안)", FXR: "외환보유액",
};

export interface Tx { row: string; group: string; from: Sector; to: Sector; amount: number }

export type BS = Record<Instrument, Partial<Record<Sector, number>>>;

export interface YearOut {
  year: number;
  v: Record<string, number>; // indicators
  tx: Tx[];
  nl: Record<Sector, number>;
  bs: BS;
  checks: { nlSum: number; bondRedundant: number; instrSum: number; gdpIncome: number; sectorNW: number };
}

export interface RunOut {
  settings: Settings;
  p: Params;
  years: YearOut[];
  maxCheck: number;
}

const crf = (w: number, n: number) => (w <= 0 ? 1 / n : w / (1 - Math.pow(1 + w, -n)));
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const logistic = (z: number) => 1 / (1 + Math.exp(-z));

function interp(year: number, pts: [number, number][]): number {
  if (year <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (year <= x1) return y0 + ((y1 - y0) * (year - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
}

const TECHS = ["solar", "on", "off", "gas", "nuc"] as const;
type Tech = (typeof TECHS)[number];
const LIFE: Record<Tech | "sto" | "grid", number> = { solar: 20, on: 20, off: 25, gas: 30, nuc: 60, sto: 15, grid: 40 };
const FOM: Record<Tech | "sto", number> = { solar: 0.015, on: 0.025, off: 0.03, gas: 0.025, nuc: 0.02, sto: 0.02 };

export const START = 2025;
export const END = 2050;

// -------- exogenous helper paths
function shockOn(p: Params, y: number) {
  return y >= p.shock_y0 && y <= p.shock_y1;
}
function fxIndex(p: Params, y: number) {
  return shockOn(p, y) ? 1 + p.fx_shock : 1;
}
function gasMult(p: Params, y: number) {
  return shockOn(p, y) ? p.gas_shock : 1;
}
function mpGW(p: Params, y: number) {
  if (!p.mp_on || y < 2026) return 0;
  const dc = interp(y, [[2026, 2.5], [2029, p.LD_2029], [2035, p.LD_2035]]);
  const semi = interp(y, [[2026, 0], [2035, p.LD_semi]]);
  const embedded = interp(y, [[2025, 0.5], [2030, p.LD_emb2030], [2036, 3.9], [2038, p.LD_emb2038]]) + 1.8;
  return Math.max(0, (dc - embedded) * p.LD_real + semi * p.LD_real);
}
function rePlan(p: Params, y: number) {
  const base = y <= 2038 ? interp(y, [[2025, p.re2025], [2030, p.re2030], [2036, 112.5], [2038, p.re2038]]) : p.re2038 + 4 * (y - 2038);
  const extra = p.kgx_re100 ? interp(y, [[2025, 0], [2030, 100 - p.re2030]]) : 0;
  return base + extra;
}
// K-GX budget phasing (2026–2035), ramped
function budgetWeight(y: number) {
  if (y < 2026 || y > 2035) return 0;
  const raw = (yy: number) => 1 + 0.1 * (yy - 2026);
  let s = 0;
  for (let yy = 2026; yy <= 2035; yy++) s += raw(yy);
  return raw(y) / s;
}
// production tax credit schedule: 2027–2036 with sunset taper 2034 75%, 2035 50%, 2036 25%
function ptcWeight(y: number) {
  const w = (yy: number) => (yy < 2027 || yy > 2036 ? 0 : yy <= 2033 ? 1 : yy === 2034 ? 0.75 : yy === 2035 ? 0.5 : 0.25);
  let s = 0;
  for (let yy = 2027; yy <= 2036; yy++) s += w(yy);
  return w(y) / s;
}
function pfFlow(p: Params, y: number) {
  if (y < 2026 || y > 2035) return 0;
  const d = (790 - 10 * p.kgx_pf2026) / 45;
  return (p.kgx_pf2026 + d * (y - 2026)) * (p.kgx_pf / 790);
}

interface State {
  y: number;
  // prices & rates
  P: number; CPI: number; piH: number; piC: number; piElec: number; piFuel: number; fxIdx: number; fuelIdx: number;
  iCore: number; i: number; iB: number; piHist: number[];
  // real & macro
  Y: number; YR: number; u: number; YD: number; C: number; X: number; Men: number;
  Knfc: number; Kg: number; Kps: number; Kgov: number; theta: number;
  rp: number; DSR: number; CAR: number; CR: number;
  // power
  T: number; Tstar: number[]; reCap: number; built: Record<Tech | "sto" | "grid", number>; incAnn: number; vre: number;
  // ecology
  omegaNP: number; EMnp: number;
  // stocks
  bs: BS; Epb: number; Ebk: number; CL: number; Bgreen: number;
}

function emptyBS(): BS {
  return { Cash: {}, Res: {}, Dep: {}, Ln_nfc: {}, Ln_ps: {}, Ln_hh: {}, PBL: {}, PBE: {}, PBB: {}, Bond: {}, Adv: {}, FXR: {} };
}
function nfw(bs: BS, s: Sector) {
  let x = 0;
  for (const k of Object.keys(bs) as Instrument[]) x += bs[k][s] ?? 0;
  return x;
}
const g = (bs: BS, k: Instrument, s: Sector) => bs[k][s] ?? 0;

// ------------------------------------------------------------------------------------------
export function run(settings: Settings = DEFAULT_SETTINGS): RunOut {
  const p = withDefaults(settings.params ?? {});
  const years: YearOut[] = [];

  // ---- opening stocks (end-2024), solved so the bank balance sheet closes
  const Lsum = p.Lnfc0 + p.Lps0 + p.Lh0;
  const Dps0 = 10;
  const Dtot0 = (Lsum - p.Ebk0 - p.Adv0) / (1 - p.bb - p.rr);
  const Dh0 = Dtot0 - p.Dnfc0 - Dps0 - p.Drow0;
  const Bbk0 = p.bb * Dtot0;
  const Res0 = p.rr * Dtot0;
  const Brow0 = p.b_row * p.B0;
  const Bh0 = p.B0 - Bbk0 - p.Bcb0 - Brow0;
  const FXR0 = p.Hh0 + Res0 - p.Adv0 - p.Bcb0;
  const bs0 = emptyBS();
  bs0.Cash = { HH: p.Hh0, CB: -p.Hh0 };
  bs0.Res = { BK: Res0, CB: -Res0 };
  bs0.Dep = { HH: Dh0, NFC: p.Dnfc0, PS: Dps0, ROW: p.Drow0, BK: -Dtot0 };
  bs0.Ln_nfc = { BK: p.Lnfc0, NFC: -p.Lnfc0 };
  bs0.Ln_ps = { BK: p.Lps0, PS: -p.Lps0 };
  bs0.Ln_hh = { BK: p.Lh0, HH: -p.Lh0 };
  bs0.PBL = {}; bs0.PBE = {}; bs0.PBB = {};
  bs0.Bond = { HH: Bh0, BK: Bbk0, CB: p.Bcb0, ROW: Brow0, GOV: -p.B0 };
  bs0.Adv = { CB: p.Adv0, BK: -p.Adv0 };
  bs0.FXR = { CB: FXR0, ROW: -FXR0 };
  const lambda0 = Bh0 / (Dh0 + Bh0);

  // ---- calibration constants filled during 2025
  const cal: Record<string, number> = {};

  let s: State = {
    y: START - 1,
    P: 1, CPI: 1, piH: p.pi_star, piC: p.pi_star, piElec: 0.02, piFuel: p.pi_star, fxIdx: 1, fuelIdx: 1,
    iCore: p.i0, i: p.i0, iB: 0.029, piHist: [p.pi_star, p.pi_star, p.pi_star, p.pi_star, p.pi_star],
    Y: p.Y0 / 1.04, YR: p.Y0 / 1.04, u: p.u0, YD: 0, C: 0, X: p.sh_X * p.Y0 / 1.04, Men: p.sh_Men * p.Y0 / 1.04,
    Knfc: p.K_nfc0, Kg: p.K_nfc0 * p.gK_share0, Kps: p.K_ps0, Kgov: p.K_gov0, theta: p.theta0,
    rp: 0, DSR: 0, CAR: 0, CR: 0.05,
    T: p.tariff0 * 1.02 / 1.02, Tstar: [], reCap: p.re2025 - (rePlan(p, 2025) - rePlan(p, 2024)), built: { solar: 0, on: 0, off: 0, gas: 0, nuc: 0, sto: 0, grid: 0 }, incAnn: 0, vre: 0,
    omegaNP: 0, EMnp: 0,
    bs: bs0, Epb: 0, Ebk: p.Ebk0, CL: 0, Bgreen: 0,
  };

  for (let y = START; y <= END; y++) {
    const calib = y === START;
    const prev = s;
    const ns: State = JSON.parse(JSON.stringify(prev));
    ns.y = y;
    const B = prev.bs;
    const tx: Tx[] = [];
    const T = (row: string, group: string, from: Sector, to: Sector, amount: number) => {
      if (from !== to && Math.abs(amount) > 0) tx.push({ row, group, from, to, amount });
    };
    const v: Record<string, number> = {};

    // ================= 1. exogenous
    const fxIdx = fxIndex(p, y);
    const dfx = fxIdx / prev.fxIdx - 1;
    const fuelIdx = gasMult(p, y) * fxIdx; // real index of imported fuel price in KRW
    const worldP = Math.pow(1 + p.pi_star, y - START); // world price drift
    ns.fxIdx = fxIdx;
    ns.fuelIdx = fuelIdx;

    // ================= 2. monetary policy (backward-looking, DEFINE timing)
    const gapY = (prev.u - p.u0) / p.u0;
    let iCore = p.i0;
    if (!calib) {
      switch (settings.rule) {
        case "define": {
          const inf = Math.max(0.1, prev.piH * 100);
          const lr = Math.log(Math.max(0.05, prev.iCore * 100));
          iCore = Math.exp(lr + p.eps_r * (p.alpha_r * Math.log(inf) - lr)) / 100;
          break;
        }
        case "taylorH":
        case "taylorC": {
          const pi = settings.rule === "taylorH" ? prev.piH : prev.piC;
          const tgt = p.rstar + p.pi_star + p.phi_pi * (pi - p.pi_star) + p.phi_y * gapY;
          iCore = p.rho_i * prev.iCore + (1 - p.rho_i) * tgt;
          break;
        }
        case "ait": {
          const h = Math.max(1, Math.round(p.ait_h));
          const hist = prev.piHist.slice(-h);
          const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
          const dev = avg - p.pi_star;
          const eff = Math.sign(dev) * Math.max(0, Math.abs(dev) - p.ait_band);
          const tgt = p.rstar + p.pi_star + p.phi_pi * eff + p.phi_y * gapY;
          iCore = p.rho_i * prev.iCore + (1 - p.rho_i) * tgt;
          break;
        }
        case "fixed":
          iCore = p.i0;
      }
    }
    const i = Math.max(0, iCore + (calib ? 0 : p.di_exo));
    ns.iCore = iCore;
    ns.i = i;

    // ================= 3. other interest rates (DEFINE eq 428–431 simplified; MFMod debt premium optional)
    const offBal = g(B, "PBL", "PB") + g(B, "PBE", "PB") + prev.CL - g(B, "Ln_ps", "PS");
    const ratioPrev = (-g(B, "Bond", "GOV") + p.alpha_off * offBal) / prev.Y;
    const ratio0 = p.B0 / (p.Y0 / 1.04);
    const prem = p.prem_on && !calib ? p.mu1 * Math.max(0, ratioPrev - ratio0) : 0;
    const iB = calib ? 0.029 : prev.iB + p.kappa_B * (i + p.term + prem - prev.iB);
    ns.iB = iB;
    const rD = Math.max(0, i - p.sD);
    const rLc = i + p.sL + p.chi * p.gdcr;
    const rLg = i + p.sL - p.chi * p.gdcr;
    const rLh = i + p.sLh;
    const rLps = iB + p.s_ps;
    const rPBL = iB + p.pf_spread;
    const rPBB = iB + p.pbb_spread;

    // ================= 4. prices (MFMod hybrid Phillips, simplified; DEFINE markup-utilisation)
    const piE = p.lam_e * p.pi_star + (1 - p.lam_e) * prev.piH;
    const dFuelIdx = fuelIdx / prev.fuelIdx - 1;
    const piC = calib ? p.pi_star : piE + p.kappa_u * (prev.u - p.u0) + p.io_el * (prev.piElec - p.pi_star) + p.io_fu * (prev.piFuel - p.pi_star) + p.th_fx * dfx;
    const P = calib ? 1 : prev.P * (1 + piC);
    ns.P = P;
    const piFuel = calib ? p.pi_star : (1 + p.pi_star) * (1 + p.th_fu * dFuelIdx) - 1;

    // ================= 5. power block (Layer-1 ledger soft-linked as in MFMod electricity 2024)
    const sales = p.sales0 * Math.pow(1 + p.g_sales, y - 2024);
    const gwInc = mpGW(p, y);
    const incLoad = gwInc * p.LD_lf * 8.76; // TWh delivered
    const incGen = incLoad * 1.03;
    // RE pipeline: rate- and design-sensitive (L1 eq B8, Egli/Polzin for design premium)
    const rpDesign = settings.design === "cfd" ? p.rp_cfd : settings.design === "pool" ? p.rp_pool : 0;
    const pfThis = p.kgx_on ? pfFlow(p, y) : 0;
    const pfPSloans = pfThis * p.pf_loan * p.pf_ps;
    const reAddPlan = Math.max(0, rePlan(p, y) - rePlan(p, y - 1));
    const reCapexPerGW = 0.65 * p.cx_solar / 1000 + 0.105 * p.cx_on / 1000 + 0.245 * p.cx_off / 1000;
    const planCapex = reAddPlan * reCapexPerGW * P;
    const conc = planCapex > 0 ? clamp(pfPSloans / planCapex, 0, 1) * Math.max(0, rLps - rPBL) : 0;
    const budgetW = p.kgx_on ? budgetWeight(y) : 0;
    // fiscal-rule cut ratio (uses previous debt ratio)
    const debtRatioPrev = -g(B, "Bond", "GOV") / prev.Y;
    const excess = Math.max(0, debtRatioPrev - p.d_star);
    const cut = calib || p.fiscal_rule === 0 ? 0 : Math.min(0.5, (p.kappa_f * excess) / p.sh_G);
    const cutGreen = p.fiscal_rule === 1 ? cut : 0;
    const alSum = p.al_grant + p.al_psgrant + p.al_rnd + p.al_ptc + p.al_isub + p.al_inj + p.al_pubinv || 1;
    const bud = p.kgx_budget * budgetW * (1 - cutGreen);
    const grantPS = (bud * p.al_psgrant) / alSum;
    const grantShare = planCapex > 0 ? clamp(grantPS / planCapex, 0, 0.5) : 0;
    const wRE = p.w0 + p.mo_beta * (i - p.i0) + rpDesign - conc;
    const dLCOEg = p.sK_re * (crf(wRE, 22) / crf(p.w0, 22) - 1) - p.sK_re * grantShare;
    const reFactor = calib ? 1 : clamp(1 - p.re_eps * dLCOEg, 0, p.re_cap_x);
    const reAdd = reAddPlan * reFactor;
    const reCap = calib ? p.re2025 : prev.reCap + reAdd;
    ns.reCap = reCap;
    const reGen = reCap * p.re_cf * 8.76;
    const nucGen = interp(y, [[2025, p.nuc0], [2038, p.nuc2038]]);
    const coalGen = p.coal0 * (1 - p.coal_cut * clamp((y - 2025) / 15, 0, 1));
    const baseNeed = sales * 1.05;
    const gasBase = Math.max(0, baseNeed - reGen - nucGen - coalGen);
    const vreSysPrev = calib ? reGen / (baseNeed) : prev.vre;
    const vre0 = (p.re2025 * p.re_cf * 8.76) / (p.sales0 * Math.pow(1 + p.g_sales, 1) * 1.05);
    // GMMET-type convex firming & storage need
    const phi = p.int_on ? clamp(p.fi_base + p.fi_slope * (vreSysPrev ** 2 - vre0 ** 2), 0.02, 0.8) : p.fi_base;
    const stoR = p.int_on ? Math.max(0, p.sto_ratio + p.sto_slope * (vreSysPrev ** 2 - vre0 ** 2)) : p.sto_ratio;
    // incremental supply mix
    const sh: Record<Tech, number> = { solar: 0, on: 0, off: 0, gas: 0, nuc: 0 };
    const vreMixR = { solar: 0.4, on: 0.1, off: 0.35 };
    const vreMixM = { solar: 0.2, on: 0.05, off: 0.2 };
    const lcoe = (cx: number, cf: number, life: number, fom: number, w: number) => ((cx * 1000 * (crf(w, life) + fom)) / (cf * 8760)); // KRW/kWh
    const gasFuelKwh = (3.6 / p.gas_eff) * p.gas_price * gasMult(p, y) * fxIdx * 1e-3 * worldP; // KRW/kWh
    const kau0 = p.kau2026 * Math.pow(1 + p.kau_g, Math.max(0, y - 2026)) * P;
    const lcoeGas = lcoe(p.cx_gas, p.cf_gas, 30, FOM.gas, p.w0 + p.mo_beta * (i - p.i0)) + gasFuelKwh + (p.gas_ef * kau0) / 1000;
    const lcoeRE = 0.4 / 0.85 * lcoe(p.cx_solar, p.cf_solar, 20, FOM.solar, wRE) + 0.1 / 0.85 * lcoe(p.cx_on, p.cf_on, 20, FOM.on, wRE) + 0.35 / 0.85 * lcoe(p.cx_off, p.cf_off, 25, FOM.off, wRE);
    let cleanShare = 1;
    if (settings.supply === "G") { sh.gas = 1; cleanShare = 0; }
    else if (settings.supply === "M") { const tot = 0.45; sh.solar = vreMixM.solar / tot * (1 - Math.max(phi, 0.55)); sh.on = vreMixM.on / tot * (1 - Math.max(phi, 0.55)); sh.off = vreMixM.off / tot * (1 - Math.max(phi, 0.55)); sh.gas = Math.max(phi, 0.55); cleanShare = 1 - sh.gas; }
    else if (settings.supply === "N") {
      const nucS = clamp((y - 2032) / 4, 0, 1) * 0.9;
      sh.nuc = nucS; sh.gas = 1 - nucS; cleanShare = nucS;
    } else {
      let vreS = 1 - phi;
      if (p.endo_mix) {
        // DEFINE eq 109 analogue: clean share responds to relative cost and market-design risk
        const z = p.b0_mix + p.b1_mix * ((lcoeGas - lcoeRE) / lcoeGas) * 100 - 100 * p.b1_mix * rpDesign * 10;
        vreS = (1 - phi) * logistic(z);
      }
      sh.solar = vreMixR.solar / 0.85 * vreS; sh.on = vreMixR.on / 0.85 * vreS; sh.off = vreMixR.off / 0.85 * vreS; sh.gas = 1 - vreS;
      cleanShare = vreS;
    }
    const cf: Record<Tech, number> = { solar: p.cf_solar, on: p.cf_on, off: p.cf_off, gas: p.cf_gas, nuc: p.cf_nuc };
    const cx: Record<Tech | "sto" | "grid", number> = { solar: p.cx_solar, on: p.cx_on, off: p.cx_off, gas: p.cx_gas, nuc: p.cx_nuc, sto: p.cx_sto, grid: p.cx_grid };
    const mimp: Record<Tech | "sto" | "grid", number> = { solar: p.mimp_solar, on: p.mimp_wind, off: p.mimp_wind, gas: p.mimp_gas, nuc: p.mimp_nuc, sto: p.mimp_sto, grid: 0.1 };
    const incGenK: Record<Tech, number> = { solar: 0, on: 0, off: 0, gas: 0, nuc: 0 };
    let incCapex = 0, incCapImp = 0, incAnnAdd = 0, vreCapInc = 0;
    const builtNew = { ...prev.built };
    for (const k of TECHS) {
      incGenK[k] = incGen * sh[k];
      const cap = incGenK[k] / (cf[k] * 8.76);
      if (k !== "gas" && k !== "nuc") vreCapInc += cap;
      builtNew[k] = Math.max(prev.built[k], cap);
    }
    builtNew.sto = Math.max(prev.built.sto, vreCapInc * stoR);
    builtNew.grid = Math.max(prev.built.grid, gwInc);
    const wTech = (k: Tech | "sto" | "grid") => (k === "gas" || k === "nuc" ? p.w0 + p.mo_beta * (i - p.i0) : wRE);
    for (const k of [...TECHS, "sto", "grid"] as const) {
      const add = builtNew[k] - prev.built[k];
      const capex = (add * cx[k]) / 1000 * P;
      incCapex += capex;
      incCapImp += capex * mimp[k];
      incAnnAdd += capex * (crf(wTech(k), LIFE[k]) + (k === "grid" ? 0.01 : FOM[k as Tech | "sto"]));
    }
    ns.built = builtNew;
    const incAnn = prev.incAnn * (1 + piC) + incAnnAdd; // fixed-annuity stock, indexed
    ns.incAnn = incAnn;
    const incFuel = (incGenK.gas * (3.6 / p.gas_eff) * p.gas_price * gasMult(p, y) * fxIdx * worldP) / 1e6;
    const dE = incGenK.gas * p.gas_ef; // Mt, megaproject direct
    const gasTotal = gasBase + incGenK.gas;
    const vreSys = (reGen + incGenK.solar + incGenK.on + incGenK.off) / (baseNeed + incGen);
    ns.vre = vreSys;
    const emOther = calib ? Math.max(0, p.em_power2024 - (coalGen * p.coal_ef + gasBase * p.gas_ef)) : (cal.emOther0 ?? 0) * Math.pow(0.95, y - START);
    if (calib) cal.emOther0 = emOther;
    const emPower = coalGen * p.coal_ef + gasTotal * p.gas_ef + emOther;
    const fuel = (gasTotal * (3.6 / p.gas_eff) * p.gas_price * gasMult(p, y) * fxIdx * worldP) / 1e6 + coalGen * p.coal_cost * fxIdx * worldP * (gasMult(p, y) > 1 ? 1 + 0.5 * (gasMult(p, y) - 1) : 1) + nucGen * 0.007 * P;

    // ================= 6. K-ETS and gap closure (L1 D10, D18–D20)
    const auction = interp(y, [[2026, p.auction0], [2030, p.auction2030]]);
    const kauCeil = p.kau_ceiling * P;
    let kau = Math.min(kau0, kauCeil);
    let Ew = 0, gap = dE, abateCostW = 0;
    if (p.ets_mode === 1 && dE > 0) {
      const kauNew = Math.min(kauCeil, kau + (dE / p.kau_slope) * 1000);
      Ew = Math.min(dE, ((kauNew - kau) / 1000) * p.kau_slope);
      abateCostW = (Ew * (kau + kauNew)) / 2 / 1e6;
      kau = kauNew;
      gap = dE - Ew; // leaks through K-MSR ceiling
    }
    const fxRate = p.fx0 * fxIdx;
    const itmoPrice = p.itmo_usd * fxRate * worldP; // KRW/t
    const macDom = p.mac_dom_usd * fxRate * worldP;
    let itmoVol = 0, domVol = 0;
    if (gap > 0) {
      if (p.gap_route === 0) { itmoVol = Math.min(gap, p.itmo_cap); domVol = gap - itmoVol; } else domVol = gap;
    }
    const itmoCost = (itmoVol * itmoPrice) / 1e6;
    const domCost = (domVol * macDom) / 1e6;
    const gamma = clamp(1 - kau / macDom, 0, 1);
    const domSub = gamma * domCost;
    const etsPS = (emPower * kau * auction) / 1e6;
    const wbTransfer = (Ew * kau) / 1e6; // PS buys allowances from other covered firms (NFC)

    // ================= 7. K-GX budget & policy finance flows
    const grantNFC = (bud * p.al_grant) / alSum;
    const rnd = (bud * p.al_rnd) / alSum;
    const isubPool = (bud * p.al_isub) / alSum;
    const inj = (bud * p.al_inj) / alSum;
    const pubinv = (bud * p.al_pubinv) / alSum;
    const ptcTotal = (p.kgx_on ? (p.kgx_budget * p.al_ptc) / alSum : 0);
    let ptc = ptcTotal * ptcWeight(y) * (1 - cutGreen);
    let hybridGrant = 0;
    if (p.hybrid && p.kgx_on) {
      ptc *= 0.5;
      if (y >= 2027 && y <= 2029) hybridGrant = (ptcTotal * 0.5) / 3;
    }
    const priv = p.kgx_on && y >= 2026 && y <= 2035 ? p.kgx_priv / 10 : 0;
    const pfLoans = pfThis * p.pf_loan;
    const pfGuar = pfThis * p.pf_guar;
    const pfEq = pfThis * Math.max(0, 1 - p.pf_loan - p.pf_guar);
    const PBLnfc0 = -(B.PBL.NFC ?? 0);
    const PBLps0 = -(B.PBL.PS ?? 0);
    const PBEnfc0 = -(B.PBE.NFC ?? 0);
    const PBEps0 = -(B.PBE.PS ?? 0);
    const PBLtot0 = PBLnfc0 + PBLps0;
    const subRate = PBLtot0 > 0 ? Math.min(rPBL, isubPool / PBLtot0) : 0;
    const isub = subRate * PBLtot0;
    const woPBLnfc = p.pf_el * PBLnfc0, woPBLps = p.pf_el * PBLps0, woPBEnfc = p.pf_el * PBEnfc0, woPBEps = p.pf_el * PBEps0;
    const guarFee = p.guar_fee * prev.CL;
    const guarCall = p.guar_el * prev.CL;
    const CL = prev.CL * (1 - 1 / p.guar_tenor) + pfGuar;
    ns.CL = CL;
    const addInv = p.add_pf * (pfLoans + pfEq) * (1 - p.pf_ps) + p.add_guar * pfGuar * (1 - p.pf_ps) + p.add_grant * (grantNFC + hybridGrant) + p.add_ptc * ptc + p.add_priv * priv;

    // ================= 8. expenditure
    const gNe = piE + p.g_pot;
    const sharedG = p.sh_G + p.g_drift * (y - START);
    let C: number, G: number, Igov: number, X: number, TR: number, Inc: number, Ig: number;
    const I_psBase = (reAdd * reCapexPerGW + (Math.max(0, interp(y, [[2025, p.nuc0], [2038, p.nuc2038]]) - interp(y - 1, [[2025, p.nuc0], [2038, p.nuc2038]])) / (p.cf_nuc * 8.76)) * p.cx_nuc / 1000) * P + p.Ips0 * P * Math.pow(1.01, y - START);
    const Ips = I_psBase + incCapex;
    const psCapImp = reAdd * (0.65 * p.cx_solar * p.mimp_solar + 0.35 * (0.105 / 0.35 * p.cx_on + 0.245 / 0.35 * p.cx_off) * p.mimp_wind) / 1000 * P + incCapImp;
    // energy (non-power) imports, MFMod-electricity style price nest proxy
    let Men: number;
    const abateI = abateCostW + domCost; // abatement capex by covered firms / K-GX supported
    if (calib) {
      const Y0 = p.Y0;
      C = p.sh_C * Y0; G = p.sh_G * Y0; Igov = p.sh_Igov * Y0; X = p.sh_X * Y0; TR = p.tr_share * Y0;
      Inc = p.sh_I * Y0 - Ips - Igov;
      Men = p.sh_Men * Y0;
      cal.gK0 = Inc / p.K_nfc0 - p.delta_k;
      Ig = p.theta0 * Inc;
    } else {
      C = cal.alpha1 * prev.YD * (1 + gNe) + p.alpha2 * nfw(B, "HH");
      G = sharedG * prev.Y * (1 + gNe) * (1 - cut) + rnd;
      Igov = p.sh_Igov * prev.Y * (1 + gNe) * (1 - cut) + pubinv;
      TR = p.tr_share * prev.Y * (1 + gNe);
      X = prev.X * (1 + p.g_world) * (1 + p.eps_x * dfx);
      Men = prev.Men * (1 + 0.5 * p.g_pot - p.em_decay) * (1 + p.pi_star) * (fuelIdx / prev.fuelIdx);
      // NFC investment: DEFINE eq 183–184 / SFF eq 62 + credit rationing (DEFINE 224–225, SFF)
      const rrNow = (prev.theta * rLg + (1 - prev.theta) * rLc) - piE;
      const gK = cal.gK0 + p.a_u * (prev.u - p.u0) + p.a_p * (prev.rp - cal.rp0) - p.a_r * (rrNow - cal.rr0);
      let CR = cal.CR0;
      if (p.cr_on) CR = p.cr_max / (1 + Math.exp(cal.c0 - p.cr_dsr * prev.DSR + p.cr_car * (prev.CAR - cal.CAR0)));
      ns.CR = CR;
      // SFF damages: extra depreciation of capital
      const Icore = Math.max(0, P * (gK + p.delta_k) * prev.Knfc * (1 - CR) / (1 - cal.CR0));
      // green share (SFF eq 70 / DEFINE eq 185 logit form)
      const z = cal.z0 + p.b_tau * ((kau / P) / 10000 - p.kau2026 / 10000) + p.b_r * (rLc - rLg) * 100 + p.b_trend * (y - START);
      const beta = logistic(z);
      v.beta = beta;
      Inc = Icore + addInv + abateI;
      Ig = beta * Icore + addInv + abateI;
    }
    ns.X = X; // core exports (DC service revenue added below, not carried in the state)
    ns.Men = Men;
    const fuelImp = fuel - nucGen * 0.007 * P; // imported fuels
    const Mpow = fuelImp + psCapImp;
    let Mnf: number;
    // electricity bills require the tariff (below); HH electricity is part of C
    // ---- tariff & PS revenue (design-specific)
    const salesGen = sales; // general consumers (excl. megaproject)
    const W_ps = (cal.wps0 ?? 0) * P * ((baseNeed + incGen) / (cal.gen0 ?? baseNeed));
    const intPS = rLps * -g(B, "Ln_ps", "PS") + (rPBL - subRate) * PBLps0;
    const depPS = p.delta_ps * prev.Kps * P;
    const incCostEcon = incAnn + incFuel + (dE * kau * auction) / 1e6 + wbTransfer;
    const opex = (cal.opex0 ?? 0) * P * ((baseNeed + incGen) / (cal.gen0 ?? baseNeed));
    const fullCost = fuel + etsPS + wbTransfer + opex + W_ps + intPS + depPS;
    let Rdc = 0, Tnow = prev.T, Tstar: number;
    const relief = p.reg_tariff_on && y >= 2027 ? p.reg_relief * P : 0;
    if (settings.design === "pool") {
      // DEFINE-UK eq 89–91: price between avg cost of non-fossil and gas marginal cost
      const betaNFF = (reGen + nucGen + incGenK.solar + incGenK.on + incGenK.off + incGenK.nuc) / (baseNeed + incGen);
      const pMax = gasFuelKwh + (p.gas_ef * kau) / 1000;
      const pMin = 0.5 * lcoeRE + 0.5 * 60 * P;
      const pElec = pMin + (pMax - pMin) * Math.pow(1 - betaNFF, p.mu_mprice);
      Tnow = calib ? p.tariff0 * 1.02 : pElec + p.net_charge * P;
      Tstar = Tnow;
      Rdc = (Tnow * incLoad) / 1000;
    } else {
      Rdc = (1 - p.sigma) * incCostEcon;
      Tstar = ((fullCost - Rdc) / salesGen) * 1000; // KRW/kWh
      if (calib) Tnow = p.tariff0 * 1.02;
      else if (settings.design === "cfd") Tnow = prev.Tstar.length ? prev.Tstar[prev.Tstar.length - 1] : Tstar;
      else {
        const L = Math.round(p.lag_t);
        const hist = [...prev.Tstar, Tstar];
        const target = hist[Math.max(0, hist.length - 1 - L)];
        const step = Math.max(1, Math.round(p.step_t));
        if ((y - 2026) % step === 0) Tnow = prev.T + p.rho_t * (target - prev.T);
        if (p.ratchet) Tnow = Math.max(Tnow, prev.T);
      }
    }
    ns.T = Tnow;
    ns.Tstar = [...prev.Tstar, Tstar].slice(-4);
    const surcharge = p.reg_fund === 2 ? relief : 0;
    const billGen = (Tnow * salesGen) / 1000 + surcharge;
    const billHH = billGen * p.hh_el_share;
    const billNFC = billGen * (1 - p.hh_el_share) - relief + Rdc; // NFC includes DC load
    const regComp = p.reg_fund === 1 ? relief : 0;
    const psRevenue = billHH + billNFC + regComp;
    const surKwh = salesGen > 0 ? (surcharge / salesGen) * 1000 : 0;
    const prevSur = (prev as State & { surKwh?: number }).surKwh ?? 0;
    const piElec = calib ? 0.02 : (Tnow + surKwh) / (prev.T + prevSur) - 1;
    (ns as State & { surKwh?: number }).surKwh = surKwh;

    if (calib) {
      cal.gen0 = baseNeed + incGen;
      cal.wps0 = p.ps_wage * (psRevenue - fuel);
      const W0 = cal.wps0;
      cal.opex0 = psRevenue - (fuel + etsPS + W0 + intPS + depPS);
    }
    if (calib && settings.design !== "pool") { Tstar = Tnow; ns.Tstar = [Tstar]; }
    const W_psNow = calib ? cal.wps0 : W_ps;
    const opexNow = calib ? cal.opex0 : opex;

    // megaproject economics outside scope: DC electricity bills financed by DC service revenue (exports) — neutralises the drain on other firms
    const dcX = calib ? 0 : p.dc_rev * Rdc;
    X += dcX;
    const Cne = C - billHH;
    if (calib) {
      const Mtot = C + G + Inc + Ips + Igov + X - p.Y0;
      const Mx = 0.22 * X;
      cal.mD = (Mtot - Men - Mpow - Mx) / (Cne + G + Inc + Igov);
      Mnf = Mtot - Men - Mpow;
    } else {
      Mnf = cal.mD * (Cne + G + Inc + Igov) + 0.22 * X;
    }
    const M = Mnf + Men + Mpow;
    const Y = C + G + Inc + Ips + Igov + X - M;
    ns.Y = Y;
    ns.C = C;

    // ================= 9. headline inflation
    const piH = calib ? p.pi_star : (1 - p.w_el - p.w_fu) * piC + p.w_el * piElec + p.w_fu * piFuel;
    ns.piH = piH; ns.piC = piC; ns.piElec = piElec; ns.piFuel = piFuel;
    ns.CPI = prev.CPI * (1 + piH);
    ns.piHist = [...prev.piHist, piH].slice(-6);

    // ================= 10. distribution & ledger
    const VA_ps = psRevenue - fuelImp - opexNow - nucGen * 0.007 * P; // nuclear fuel bought domestically (NFC)
    const nfcSales = Cne + G + Inc + Ips + Igov + X + opexNow + nucGen * 0.007 * P;
    const VA_nfc = nfcSales - Mnf - Men - billNFC - psCapImp; // PS capex imports pass through NFC? no: PS imports directly
    // note: PS capex = Ips includes imported content (psCapImp) bought by PS from ROW; NFC sells only domestic part
    const Ips_dom = Ips - psCapImp;
    const nfcSalesAdj = nfcSales - psCapImp;
    const VA_nfcAdj = VA_nfc; // already excludes psCapImp
    void nfcSalesAdj;
    const W_nfc = p.omega * VA_nfcAdj;
    const taxInd = p.tau_ind * VA_nfcAdj;
    const Lnfc0 = -g(B, "Ln_nfc", "NFC");
    const Kshare = prev.Knfc > 0 ? prev.Kg / prev.Knfc : p.gK_share0;
    const intNFCbank = rLg * Lnfc0 * Kshare + rLc * Lnfc0 * (1 - Kshare);
    const intNFCpb = (rPBL - subRate) * PBLnfc0;
    const intDepNFC = rD * g(B, "Dep", "NFC");
    const emNPcov = 0.7 * (prev.EMnp || 400);
    const etsInd = (emNPcov * kau * p.auction_ind) / 1e6;
    const GP = VA_nfcAdj - W_nfc - taxInd - intNFCbank - intNFCpb + intDepNFC - guarFee * (1 - 0) - etsInd + wbTransfer;
    const taxF0 = p.tau_f * Math.max(0, GP);
    const ptcUsed = Math.min(ptc, taxF0);
    const taxF = taxF0 - ptcUsed;
    const NP = GP - taxF;
    const divNFC = (1 - p.s_f) * Math.max(0, NP);
    // PS
    const GP_ps = VA_ps - W_psNow - etsPS - wbTransfer - intPS + rD * g(B, "Dep", "PS");
    const taxPS = p.tau_f * Math.max(0, GP_ps - depPS);
    const divPS = 0.5 * Math.max(0, GP_ps - depPS - taxPS);
    // banks
    const Lps0 = -g(B, "Ln_ps", "PS");
    const Lhh0 = -g(B, "Ln_hh", "HH");
    const intHH = rLh * Lhh0;
    const def = calib ? p.def0 : p.def0 + p.def_dsr * Math.max(0, prev.DSR - cal.DSR0);
    const woBK = def * Lnfc0;
    const depTot0 = -g(B, "Dep", "BK");
    const advPrev = -g(B, "Adv", "BK");
    const PBB0 = g(B, "PBB", "BK");
    const intDep = rD * depTot0;
    const intAdv = i * advPrev;
    const bkProfit = intNFCbank + rLps * Lps0 + intHH + rPBB * PBB0 + iB * g(B, "Bond", "BK") - intDep - intAdv - woBK + guarCall - guarCall; // guarantee call offsets guaranteed write-off
    const divBK = (1 - p.s_b) * Math.max(0, bkProfit);
    // CB
    const cbProfit = iB * g(B, "Bond", "CB") + intAdv + p.i_world * g(B, "FXR", "CB");
    // HH income
    const W = W_nfc + W_psNow;
    const intHHrec = rD * g(B, "Dep", "HH") + iB * g(B, "Bond", "HH");
    const divHH = divNFC + divBK + divPS * (1 - p.ps_gov_div);
    const taxH = p.tau_h * (W + intHHrec + divHH);
    const ss = p.tau_ss * W;

    // ---- ledger (from = payer, to = receiver)
    T("소비: 비전력 재화", "지출", "HH", "NFC", Cne);
    T("소비: 가계 전기요금", "전력", "HH", "PS", billHH);
    T("기업 전기요금(DC 포함, 지역요금 경감 후)", "전력", "NFC", "PS", billNFC);
    T("지역요금제 재정보전", "전력", "GOV", "PS", regComp);
    T("정부소비(R&D 포함)", "지출", "GOV", "NFC", G);
    T("투자재: 전력부문(국내분)", "투자", "PS", "NFC", Ips_dom);
    T("투자재: 정부", "투자", "GOV", "NFC", Igov);
    T("수출", "대외", "ROW", "NFC", X);
    T("수입: 비에너지", "대외", "NFC", "ROW", Mnf);
    T("수입: 비전력 에너지", "대외", "NFC", "ROW", Men);
    T("수입: 발전연료(LNG·석탄)", "대외", "PS", "ROW", fuelImp);
    T("수입: 전력 설비 수입분", "대외", "PS", "ROW", psCapImp);
    T("전력부문 중간투입(국내)", "전력", "PS", "NFC", opexNow + nucGen * 0.007 * P);
    T("임금: 기업", "소득", "NFC", "HH", W_nfc);
    T("임금: 전력부문", "소득", "PS", "HH", W_psNow);
    T("생산·수입세", "세금", "NFC", "GOV", taxInd);
    T("법인세(세액공제 차감 후)", "세금", "NFC", "GOV", taxF);
    T("법인세: 전력부문", "세금", "PS", "GOV", taxPS);
    T("소득세", "세금", "HH", "GOV", taxH);
    T("사회보험료", "세금", "HH", "GOV", ss);
    T("사회수혜금", "이전", "GOV", "HH", TR);
    T("배출권 유상할당: 전력", "ETS", "PS", "GOV", etsPS);
    T("배출권 유상할당: 산업", "ETS", "NFC", "GOV", etsInd);
    T("배출권 매입(워터베드)", "ETS", "PS", "NFC", wbTransfer);
    T("ITMO 구매", "ETS", "GOV", "ROW", itmoCost);
    T("이자: 기업 은행대출", "이자", "NFC", "BK", intNFCbank);
    T("이자: 기업 정책대출(순)", "이자", "NFC", "PB", intNFCpb);
    T("이자: 전력부문 차입", "이자", "PS", "BK", rLps * Lps0);
    T("이자: 전력부문 정책대출(순)", "이자", "PS", "PB", (rPBL - subRate) * PBLps0);
    T("이자: 가계대출", "이자", "HH", "BK", intHH);
    T("이자: 예금(가계)", "이자", "BK", "HH", rD * g(B, "Dep", "HH"));
    T("이자: 예금(기업)", "이자", "BK", "NFC", intDepNFC);
    T("이자: 예금(전력)", "이자", "BK", "PS", rD * g(B, "Dep", "PS"));
    T("이자: 예금(해외)", "이자", "BK", "ROW", rD * g(B, "Dep", "ROW"));
    T("이자: 국채(가계)", "이자", "GOV", "HH", iB * g(B, "Bond", "HH"));
    T("이자: 국채(은행)", "이자", "GOV", "BK", iB * g(B, "Bond", "BK"));
    T("이자: 국채(한은)", "이자", "GOV", "CB", iB * g(B, "Bond", "CB"));
    T("이자: 국채(해외)", "이자", "GOV", "ROW", iB * g(B, "Bond", "ROW"));
    T("이자: 정책금융채", "이자", "PB", "BK", rPBB * PBB0);
    T("이자: 한은 대출", "이자", "BK", "CB", intAdv);
    T("이자: 외환보유액", "이자", "ROW", "CB", p.i_world * g(B, "FXR", "CB"));
    T("이차보전(K-GX)", "K-GX", "GOV", "PB", isub);
    T("보증료", "K-GX", "NFC", "PB", guarFee);
    T("배당: 기업", "배당", "NFC", "HH", divNFC);
    T("배당: 은행", "배당", "BK", "HH", divBK);
    T("배당: 전력부문(정부)", "배당", "PS", "GOV", divPS * p.ps_gov_div);
    T("배당: 전력부문(민간)", "배당", "PS", "HH", divPS * (1 - p.ps_gov_div));
    T("한은 잉여금 납부", "이전", "CB", "GOV", cbProfit);
    // capital account
    T("자본이전: 녹색투자 보조금(K-GX)", "K-GX", "GOV", "NFC", grantNFC + hybridGrant);
    T("자본이전: 전력 청정투자 보조(K-GX)", "K-GX", "GOV", "PS", grantPS);
    T("자본이전: 국내감축 보조", "K-GX", "GOV", "NFC", domSub);
    T("자본이전: 정책금융기관 출자", "K-GX", "GOV", "PB", inj);
    T("자본이전: 은행 부실채권 상각", "자본이전", "BK", "NFC", woBK);
    T("자본이전: 보증 대위변제", "K-GX", "PB", "BK", guarCall);
    T("자본이전: 보증부 대출 상각", "자본이전", "BK", "NFC", guarCall);
    T("자본이전: 정책대출·지분 손실(기업)", "K-GX", "PB", "NFC", woPBLnfc + woPBEnfc);
    T("자본이전: 정책대출·지분 손실(전력)", "K-GX", "PB", "PS", woPBLps + woPBEps);

    // net lending by sector from the ledger (self-investment of NFC cancels; NFC sells Inc to itself)
    const nl = Object.fromEntries(SECTORS.map((k) => [k, 0])) as Record<Sector, number>;
    for (const t of tx) { nl[t.from] -= t.amount; nl[t.to] += t.amount; }
    // HH consumption of NFC goods includes nothing else; NFC investment purchase from itself cancels by construction.

    // ================= 11. financial stocks (portfolio choices + residuals)
    const nb = emptyBS();
    // households
    const hhNFW = nfw(B, "HH") + nl.HH;
    const cash = p.cash_c * C;
    const Lhh = Lhh0 * (Y / prev.Y);
    const FA = hhNFW + Lhh;
    const lam = clamp(lambda0 + p.lambda1 * ((iB - rD) - (0.029 - Math.max(0, p.i0 - p.sD))), 0.05, 0.6);
    const Bh = lam * (FA - cash);
    const Dh = FA - cash - Bh;
    // NFC
    const Dnfc = g(B, "Dep", "NFC") * (Y / prev.Y);
    const PBLnfc = PBLnfc0 + pfLoans * (1 - p.pf_ps) - PBLnfc0 / p.pf_tenor - woPBLnfc;
    const PBEnfc = PBEnfc0 + pfEq * (1 - p.pf_ps) - woPBEnfc;
    const Lnfc = Lnfc0 + (Dnfc - g(B, "Dep", "NFC")) - (PBLnfc - PBLnfc0) - (PBEnfc - PBEnfc0) - nl.NFC;
    // PS
    const Dps = g(B, "Dep", "PS");
    const PBLps = PBLps0 + pfPSloans - PBLps0 / p.pf_tenor - woPBLps;
    const PBEps = PBEps0 + pfEq * p.pf_ps - woPBEps;
    // PS investment is a purchase from NFC (domestic) and ROW (imports): NL already includes those payments.
    const Lps = Lps0 - (PBLps - PBLps0) - (PBEps - PBEps0) - nl.PS;
    // GOV (Igov purchase is in the ledger)
    const Bgov = -g(B, "Bond", "GOV") - nl.GOV;
    const greenIssue = p.green_bond && y >= 2028 ? Math.min(Math.max(0, -nl.GOV), bud + ptc + itmoCost + domSub + hybridGrant) : 0;
    ns.Bgreen = prev.Bgreen + greenIssue;
    // ROW
    const rowNFW = nfw(B, "ROW") + nl.ROW;
    const FXR = g(B, "FXR", "CB");
    const Brow = p.b_row * Bgov;
    const Drow = rowNFW + FXR - Brow;
    // PB
    const Epb = prev.Epb + nl.PB;
    ns.Epb = Epb;
    const PBB = PBLnfc + PBLps + PBEnfc + PBEps - Epb;
    // banks
    const Ebk = prev.Ebk + nl.BK;
    ns.Ebk = Ebk;
    const Dtot = Dh + Dnfc + Dps + Drow;
    const Res = p.rr * Dtot;
    const Bbk = p.bb * Dtot;
    const Adv = Lnfc + Lps + Lhh + PBB + Bbk + Res - Dtot - Ebk;
    // central bank
    const Bcb = cash + Res - Adv - FXR;

    nb.Cash = { HH: cash, CB: -cash };
    nb.Res = { BK: Res, CB: -Res };
    nb.Dep = { HH: Dh, NFC: Dnfc, PS: Dps, ROW: Drow, BK: -Dtot };
    nb.Ln_nfc = { BK: Lnfc, NFC: -Lnfc };
    nb.Ln_ps = { BK: Lps, PS: -Lps };
    nb.Ln_hh = { BK: Lhh, HH: -Lhh };
    nb.PBL = { PB: PBLnfc + PBLps, NFC: -PBLnfc, PS: -PBLps };
    nb.PBE = { PB: PBEnfc + PBEps, NFC: -PBEnfc, PS: -PBEps };
    nb.PBB = { BK: PBB, PB: -PBB };
    nb.Bond = { HH: Bh, BK: Bbk, CB: Bcb, ROW: Brow, GOV: -Bgov };
    nb.Adv = { CB: Adv, BK: -Adv };
    nb.FXR = { CB: FXR, ROW: -FXR };
    ns.bs = nb;

    // ================= 12. checks
    const nlSum = SECTORS.reduce((a, k) => a + nl[k], 0);
    const bondRedundant = Bh + Bbk + Bcb + Brow - Bgov;
    let instrSum = 0;
    for (const k of Object.keys(nb) as Instrument[]) {
      const sum = Object.values(nb[k]).reduce((a, b) => a + (b ?? 0), 0);
      instrSum = Math.max(instrSum, Math.abs(sum));
    }
    let sectorNW = 0;
    for (const k of SECTORS) sectorNW = Math.max(sectorNW, Math.abs(nfw(nb, k) - nfw(B, k) - nl[k]));
    const gdpIncome = Y - (VA_nfcAdj + VA_ps - regComp); // income side (VA) = expenditure side; regComp is a product subsidy
    const checks = { nlSum, bondRedundant, instrSum, gdpIncome, sectorNW };

    // ================= 13. real stocks, utilisation, ecology
    // SFF damages (relative to 2025)
    let dK = 0, prodLoss = 0;
    if (p.dmg_on) {
      const Tt = interp(y, [[2025, p.T2025], [2050, p.T2050]]);
      const D = (TT: number) => 1 - 1 / (1 + p.eta2 * TT * TT + p.eta3 * Math.pow(TT, 6.754));
      const DT = D(Tt) - D(p.T2025);
      const DTP = p.p_prod * DT;
      const DTF = 1 - (1 - DT) / (1 - DTP);
      dK = (1 - p.adK) * DTF;
      prodLoss = (1 - p.adP) * DTP;
    }
    const YR = Y / P;
    ns.YR = YR;
    ns.Knfc = (1 - p.delta_k - dK) * prev.Knfc + Inc / P;
    ns.Kg = (1 - p.delta_k - dK) * prev.Kg + Ig / P;
    ns.Kps = (1 - p.delta_ps - dK) * prev.Kps + Ips / P;
    ns.Kgov = (1 - 0.03 - dK) * prev.Kgov + Igov / P;
    if (calib) cal.vcap = (prev.Knfc + prev.Kgov) / (YR / p.u0);
    const u = YR / (((prev.Knfc + prev.Kgov) / cal.vcap) * Math.pow(1 + p.g_prod, y - START) * (1 - prodLoss)); // MFE: power capital excluded from GDP capacity
    ns.u = u;
    ns.theta = ns.Kg / ns.Knfc;
    // non-power emissions: DEFINE eq 26 (linearised) — intensity falls with green capital share
    if (calib) cal.omega0 = (p.em2024 - p.em_power2024) / YR;
    const omega = calib ? cal.omega0 : prev.omegaNP * (1 - p.em_decay - p.em_green * Math.max(0, ns.theta - prev.theta));
    ns.omegaNP = omega;
    const EMnpGross = omega * YR;
    const EMnp = EMnpGross - Ew - domVol;
    ns.EMnp = EMnp;
    const EMtot = emPower + EMnp; // ITMO counted against NDC separately
    const ndcPath = interp(y, [[2024, p.em2024], [2030, 436.6 * 742.3 / 727.6], [2035, 742.3 * (1 - 0.53)], [2040, 742.3 * (1 - 0.69)], [2045, 742.3 * (1 - 0.84)], [2050, 0]]);

    // ratios & bank indicators
    const YDnow = W + intHHrec + divHH + TR - taxH - ss - intHH;
    ns.YD = YDnow;
    const rwc = p.rw_c + p.gdcr, rwg = p.rw_g - p.gdcr;
    const KshareNew = ns.Kg / ns.Knfc;
    const RWA = rwc * Lnfc * (1 - KshareNew) + rwg * Lnfc * KshareNew + p.rw_ps * Lps + p.rw_h * Lhh;
    ns.CAR = Ebk / RWA;
    ns.DSR = (intNFCbank + intNFCpb) / Math.max(1, NP + intNFCbank + intNFCpb);
    ns.rp = (NP - divNFC) / (P * prev.Knfc);
    if (calib) {
      cal.rp0 = ns.rp; cal.DSR0 = ns.DSR; cal.CAR0 = ns.CAR; cal.CR0 = 0.05;
      cal.rr0 = (p.theta0 * rLg + (1 - p.theta0) * rLc) - p.pi_star;
      cal.c0 = Math.log(p.cr_max / cal.CR0 - 1) + p.cr_dsr * cal.DSR0;
      cal.z0 = Math.log(p.theta0 / (1 - p.theta0));
      cal.alpha1 = (C * (1 + p.pi_star + p.g_pot) - p.alpha2 * hhNFW) / (YDnow * (1 + p.pi_star + p.g_pot));
      ns.CR = cal.CR0;
    }
    // power-sector total debt (incl. policy loans)
    const psDebt = Lps + PBLps;

    // ---- indicators
    Object.assign(v, {
      Y, YR, C, G, Inc, Ips, Igov, X, M, Mnf, Men, Mpow, u, P, CPI: ns.CPI,
      piH, piC, piElec, piFuel, i, iB, rLc, rLg, rLps, rD, prem,
      debtRatio: Bgov / Y, B: Bgov, deficit: -nl.GOV / Y, nlGOV: nl.GOV, Bgreen: ns.Bgreen,
      D2: (Bgov + PBLnfc + PBLps + PBEnfc + PBEps + p.guar_el * CL) / Y,
      D3: (Bgov + PBLnfc + PBLps + PBEnfc + PBEps + p.guar_el * CL + Lps) / Y,
      intBill: iB * -g(B, "Bond", "GOV"),
      theta: ns.theta, Kg: ns.Kg, Knfc: ns.Knfc, Kps: ns.Kps, Kgov: ns.Kgov, CR: ns.CR, CAR: ns.CAR, DSR: ns.DSR, def,
      Lnfc, Lps, psDebt, psDebtY: psDebt / Y, Adv, Bcb, Dh, Bh,
      sales, gwInc, incLoad, incGen, dE, emPower, EMnp, EMtot, ndcPath, ndcGap: EMtot - itmoVol - ndcPath,
      reCap, rePlan: rePlan(p, y), reShort: rePlan(p, y) - reCap, reFactor, wRE, dLCOEg, phi, stoR, vreSys,
      gasGen: gasTotal, gasBase, coalGen, nucGen, reGen, cleanShare, lcoeGas, lcoeRE,
      tariff: Tnow, tariffStar: Tstar, fullCost, psRevenue, psProfit: GP_ps - depPS - taxPS, fuel, fuelImp, etsPS, kau, auction,
      incCapex, incAnn, incFuel, incCostEcon, Rdc, relief, regComp, billHH, billNFCgen: billNFC - Rdc,
      itmoVol, itmoCost, domVol, domCost, domSub, Ew, abateCostW, wbTransfer, gamma,
      kgxBudget: bud, grantNFC: grantNFC + hybridGrant, grantPS, rnd, ptc: ptcUsed, isub, inj, pubinv, pfFlow: pfThis, pfLoans, pfGuar, pfEq, CL, priv, addInv,
      PBL: PBLnfc + PBLps, PBE: PBEnfc + PBEps, PBB, Epb, guarCall,
      budgetCash: bud + (ptcUsed - ((bud * p.al_ptc) / alSum)) + hybridGrant, // memo
      fiscalCut: cut,
      // social cost (Q1): incremental system cost and incidence
      // resource cost of the megaproject load (transfers such as auction payments and allowance trades excluded)
      sc_resource: incAnn + incFuel + abateCostW + domCost + itmoCost,
      fxIdx, fuelIdx, dfx, kauCeil, dcX,
    });
    for (const k of SECTORS) v[`nl_${k}`] = nl[k];
    v.gR = calib ? p.g_pot : YR / prev.YR - 1;
    void Mnf;
    years.push({ year: y, v, tx, nl, bs: nb, checks });
    s = ns;
  }
  let maxCheck = 0;
  for (const yo of years) {
    const c = yo.checks;
    maxCheck = Math.max(maxCheck, Math.abs(c.nlSum), Math.abs(c.bondRedundant), c.instrSum, c.sectorNW, Math.abs(c.gdpIncome));
  }
  return { settings, p, years, maxCheck };
}

export function series(r: RunOut, key: string): number[] {
  return r.years.map((y) => y.v[key] ?? NaN);
}
export function at(r: RunOut, year: number, key: string): number {
  return r.years.find((y) => y.year === year)?.v[key] ?? NaN;
}

// ---------------- comparison helpers (scenario vs reference run)
export function cum(r: RunOut, key: string, y0: number, y1: number): number {
  return r.years.filter((y) => y.year >= y0 && y.year <= y1).reduce((a, y) => a + (y.v[key] ?? 0), 0);
}

export interface Incidence { label: string; value: number; note: string }

// Who bears the megaproject's incremental cost, cumulative y0..y1 (nominal 조원), scenario minus reference.
export function incidence(s: RunOut, b: RunOut, y0 = 2026, y1 = 2035): Incidence[] {
  const d = (k: string) => cum(s, k, y0, y1) - cum(b, k, y0, y1);
  const stock = (k: string) => at(s, y1, k) - at(b, y1, k);
  return [
    { label: "데이터센터 전용요금", value: d("Rdc"), note: "증분 시스템비용 중 (1−σ)" },
    { label: "일반 소비자 요금(가계+기업)", value: d("billHH") + d("billNFCgen"), note: "사회화분 σ 중 요금으로 회수된 몫 + 일반균형 효과" },
    { label: "전력부문 부채 증가(이연, 잔액)", value: stock("psDebt"), note: "행정요금 하 미회수분 → 한전채 등" },
    { label: "재정 직접지출(ITMO·국내감축 보조·요금보전)", value: d("itmoCost") + d("domSub") + d("regComp"), note: "K-GX 증액 소요의 직접분" },
    { label: "정부 순차입 증가(전체)", value: -d("nlGOV"), note: "세수·이자 등 거시 되먹임 포함" },
    { label: "ETS 참여기업 순부담(워터베드)", value: d("abateCostW") - d("wbTransfer"), note: "경직 상한일 때 감축비용 − 배출권 매각수입" },
    { label: "국내 감축 기업 자부담", value: d("domCost") - d("domSub"), note: "(1−γ)·국내 MAC" },
  ];
}

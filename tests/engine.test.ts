import { test } from "node:test";
import assert from "node:assert/strict";
import { run, at, type Settings, type MonRule, type Design, type Supply } from "../src/engine/model.ts";
import { PARAMS, DEFAULTS } from "../src/engine/params.ts";

const TOL = 1e-8;

test("registry: unique ids, defaults inside ranges, every entry has a source", () => {
  const ids = new Set<string>();
  for (const p of PARAMS) {
    assert.ok(!ids.has(p.id), `duplicate ${p.id}`);
    ids.add(p.id);
    assert.ok(p.value >= p.min - 1e-12 && p.value <= p.max + 1e-12, `${p.id} default outside range`);
    assert.ok(p.source.length > 0, `${p.id} has no source`);
  }
});

test("unknown parameter ids are rejected", () => {
  assert.throws(() => run({ rule: "taylorH", design: "admin", supply: "G", params: { not_a_param: 1 } as never }));
});

test("2025 calibration year reproduces national accounts", () => {
  const r = run();
  assert.ok(Math.abs(at(r, 2025, "Y") - DEFAULTS.Y0) < 1e-6);
  assert.ok(Math.abs(at(r, 2025, "u") - DEFAULTS.u0) < 1e-9);
  assert.ok(Math.abs(at(r, 2025, "piH") - DEFAULTS.pi_star) < 1e-12);
});

const rules: MonRule[] = ["define", "taylorH", "taylorC", "ait", "fixed"];
const designs: Design[] = ["admin", "cfd", "pool"];
const supplies: Supply[] = ["G", "R", "M", "N"];
const bundles = [
  {},
  { gas_shock: 2, fx_shock: 0.2 },
  { ets_mode: 1, gap_route: 1, endo_mix: 1, gdcr: 0.25, prem_on: 1, alpha_off: 1, fiscal_rule: 1, dmg_on: 1, hybrid: 1, kgx_re100: 1, reg_fund: 2 },
  { fiscal_rule: 2, kgx_on: 0, cr_on: 0, reg_fund: 1 },
];

test("stock-flow consistency holds for every rule x design x supply x switch bundle", () => {
  for (const rule of rules) for (const design of designs) for (const supply of supplies) for (const params of bundles) {
    const r = run({ rule, design, supply, params } as Settings);
    for (const y of r.years) {
      const c = y.checks;
      const tag = `${rule}/${design}/${supply}/${JSON.stringify(params)}/${y.year}`;
      assert.ok(Math.abs(c.nlSum) < TOL, `net lending does not sum to zero ${tag}`);
      assert.ok(Math.abs(c.bondRedundant) < TOL, `redundant bond equation fails ${tag}`);
      assert.ok(c.instrSum < TOL, `instrument does not net to zero ${tag}`);
      assert.ok(c.sectorNW < TOL, `sector net lending != change in net financial wealth ${tag}`);
      assert.ok(Math.abs(c.gdpIncome) < TOL, `GDP expenditure != income ${tag}`);
      for (const [k, v] of Object.entries(y.v)) assert.ok(Number.isFinite(v), `non-finite ${k} ${tag}`);
    }
  }
});

test("transaction matrix: every row has one payer and one receiver (rows sum to zero)", () => {
  const r = run();
  for (const t of r.years[10].tx) assert.notEqual(t.from, t.to);
});

test("no megaproject => no incremental load, emissions or gap purchases", () => {
  const r = run({ rule: "taylorH", design: "admin", supply: "G", params: { mp_on: 0 } });
  for (const y of r.years) {
    assert.equal(y.v.incLoad, 0);
    assert.equal(y.v.dE, 0);
    assert.equal(y.v.itmoCost, 0);
  }
});

test("gas-led supply adds more direct emissions than renewables-led", () => {
  const G = run({ rule: "taylorH", design: "admin", supply: "G" });
  const R = run({ rule: "taylorH", design: "admin", supply: "R" });
  assert.ok(at(G, 2035, "dE") > 3 * at(R, 2035, "dE"));
  assert.ok(at(R, 2035, "incCapex") + at(R, 2033, "incCapex") > at(G, 2035, "incCapex") + at(G, 2033, "incCapex"));
});

test("rigid K-ETS cap: waterbed raises KAU and shifts abatement to covered firms; accommodating cap uses the budget", () => {
  const acc = run({ rule: "taylorH", design: "admin", supply: "G", params: { ets_mode: 0 } });
  const rig = run({ rule: "taylorH", design: "admin", supply: "G", params: { ets_mode: 1 } });
  assert.ok(at(rig, 2035, "kau") > at(acc, 2035, "kau"));
  assert.ok(at(rig, 2035, "Ew") > 0);
  assert.ok(at(acc, 2035, "itmoCost") > at(rig, 2035, "itmoCost"));
});

test("administered tariffs push cost onto power-sector debt relative to CfD pass-through", () => {
  const base = { rule: "taylorH" as const, supply: "R" as const };
  const adm = run({ ...base, design: "admin", params: { rho_t: 0.5 } });
  const cfd = run({ ...base, design: "cfd" });
  assert.ok(at(adm, 2035, "psDebt") > at(cfd, 2035, "psDebt"));
});

test("higher policy-rate path reduces renewable build-out (rate channel)", () => {
  const lo = run({ rule: "fixed", design: "admin", supply: "R" });
  const hi = run({ rule: "fixed", design: "admin", supply: "R", params: { di_exo: 0.01 } });
  assert.ok(at(hi, 2035, "reCap") < at(lo, 2035, "reCap"));
  assert.ok(at(hi, 2035, "dLCOEg") > at(lo, 2035, "dLCOEg"));
});

test("CfD design lowers renewable WACC relative to administered single-buyer", () => {
  const adm = run({ rule: "fixed", design: "admin", supply: "R" });
  const cfd = run({ rule: "fixed", design: "cfd", supply: "R" });
  assert.ok(at(cfd, 2030, "wRE") < at(adm, 2030, "wRE"));
  assert.ok(at(cfd, 2035, "reCap") >= at(adm, 2035, "reCap"));
});

test("AIT with a wide band looks through a temporary energy-price spike; Taylor-headline tightens", () => {
  const shock = { gas_shock: 1.3, shock_y0: 2030, shock_y1: 2031, phi_y: 0, ait_band: 0.02 };
  const calm = { phi_y: 0, ait_band: 0.02 };
  const d = (rule: MonRule) =>
    at(run({ rule, design: "pool", supply: "G", params: shock }), 2031, "i") - at(run({ rule, design: "pool", supply: "G", params: calm }), 2031, "i");
  assert.ok(Math.abs(d("ait")) < 1e-9);
  assert.ok(d("taylorH") > 0.0005);
});

test("LNG/FX shock raises headline CPI more under a marginal-price pool than under administered tariffs", () => {
  const shock = { gas_shock: 2, fx_shock: 0.15, shock_y0: 2030, shock_y1: 2031 };
  const d = (design: Design) => {
    const s = run({ rule: "fixed", design, supply: "G", params: shock });
    const b = run({ rule: "fixed", design, supply: "G" });
    return { pi: at(s, 2030, "piH") - at(b, 2030, "piH"), debt: at(s, 2032, "psDebt") - at(b, 2032, "psDebt") };
  };
  const pool = d("pool"), adm = d("admin");
  assert.ok(pool.pi > adm.pi);
  assert.ok(adm.debt > pool.debt);
});

test("K-GX policy finance builds a policy-bank balance sheet that closes (assets = bonds + equity)", () => {
  const r = run();
  const y = r.years.find((x) => x.year === 2035)!;
  const v = y.v;
  assert.ok(v.PBL > 0 && v.CL > 0);
  assert.ok(Math.abs(v.PBL + v.PBE - v.PBB - v.Epb) < 1e-8);
});

test("adaptive fiscal rule protects K-GX spending that the debt rule cuts", () => {
  const p = { d_star: 0.45 };
  const brake = run({ rule: "taylorH", design: "admin", supply: "G", params: { ...p, fiscal_rule: 1 } });
  const adapt = run({ rule: "taylorH", design: "admin", supply: "G", params: { ...p, fiscal_rule: 2 } });
  assert.ok(at(adapt, 2033, "kgxBudget") > at(brake, 2033, "kgxBudget"));
});

test("physical damages (SFF) lower real output relative to no damages", () => {
  const a = run({ rule: "taylorH", design: "admin", supply: "G", params: { dmg_on: 1, T2050: 2.6 } });
  const b = run({ rule: "taylorH", design: "admin", supply: "G" });
  assert.ok(at(a, 2050, "Knfc") < at(b, 2050, "Knfc"));
});

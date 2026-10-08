import { run, at, type Settings } from "../src/engine/model.ts";
const rules = ["define","taylorH","taylorC","ait","fixed"] as const, designs=["admin","cfd","pool"] as const, sup=["G","R","M","N"] as const;
let worst = 0; let bad: string[] = [];
for (const rule of rules) for (const design of designs) for (const supply of sup) for (const extra of [{}, {gas_shock:2, fx_shock:0.2}, {ets_mode:1, gap_route:1, endo_mix:1, gdcr:0.25, prem_on:1, alpha_off:1, fiscal_rule:1, dmg_on:1, hybrid:1, kgx_re100:1, reg_fund:2}, {fiscal_rule:2, kgx_on:0, cr_on:0}]) {
  const r = run({ rule, design, supply, params: extra } as Settings);
  worst = Math.max(worst, r.maxCheck);
  const fin = r.years.every(y => Object.values(y.v).every(Number.isFinite));
  const y50 = r.years.at(-1)!.v;
  if (!fin || y50.u < 0.5 || y50.u > 1.2 || y50.piH < -0.05 || y50.piH > 0.1 || y50.debtRatio > 3) bad.push(`${rule}/${design}/${supply}/${JSON.stringify(extra)} u=${y50.u.toFixed(2)} pi=${y50.piH.toFixed(3)} debt=${y50.debtRatio.toFixed(2)} fin=${fin}`);
}
console.log("worst check", worst, "bad", bad.length); console.log(bad.slice(0,12).join("\n"));
const base = run({rule:"taylorH",design:"admin",supply:"G",params:{mp_on:0}});
for (const supply of sup) { const r = run({rule:"taylorH",design:"admin",supply});
  console.log(supply, [2030,2035,2050].map(y=>`${y}: dE=${at(r,y,"dE").toFixed(1)} ΔEM=${(at(r,y,"EMtot")-at(base,y,"EMtot")).toFixed(1)} Δtariff=${(at(r,y,"tariff")-at(base,y,"tariff")).toFixed(1)} ΔpsDebt=${(at(r,y,"psDebt")-at(base,y,"psDebt")).toFixed(1)} ΔpiH=${(100*(at(r,y,"piH")-at(base,y,"piH"))).toFixed(3)}pp Δi=${(10000*(at(r,y,"i")-at(base,y,"i"))).toFixed(1)}bp ΔdebtY=${(100*(at(r,y,"debtRatio")-at(base,y,"debtRatio"))).toFixed(2)}pp sc=${at(r,y,"sc_resource").toFixed(1)} capex=${at(r,y,"incCapex").toFixed(1)}`).join(" | ")); }

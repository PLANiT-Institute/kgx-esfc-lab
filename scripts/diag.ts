import { run, SECTORS } from "../src/engine/model.ts";
const over = JSON.parse(process.argv[2] || "{}");
const r = run({ rule: "taylorH", design: "admin", supply: "G", params: over });
for (const yo of r.years.filter(y=>[2025,2026,2030,2040,2050].includes(y.year))) {
  const Y = yo.v.Y;
  console.log(yo.year, "Y", Y.toFixed(0), SECTORS.map(s=>`${s}=${(100*yo.nl[s]/Y).toFixed(2)}`).join(" "), "C/Y", (yo.v.C/Y).toFixed(3), "I/Y", ((yo.v.Inc+yo.v.Ips+yo.v.Igov)/Y).toFixed(3), "X-M", ((yo.v.X-yo.v.M)/Y).toFixed(3), "pi", yo.v.piH.toFixed(4), "u", yo.v.u.toFixed(3), "i", yo.v.i.toFixed(4), "debt", yo.v.debtRatio.toFixed(3), "theta", yo.v.theta.toFixed(3));
}
const g = (y:number)=>r.years.find(a=>a.year===y)!;
const t = g(2026).tx; const agg: Record<string, number> = {};
for (const x of t) if (x.from==="GOV"||x.to==="GOV") agg[x.row]=(agg[x.row]||0)+(x.to==="GOV"?x.amount:-x.amount);
console.log(Object.entries(agg).map(([k,v])=>`${k}:${v.toFixed(1)}`).join(" | "));

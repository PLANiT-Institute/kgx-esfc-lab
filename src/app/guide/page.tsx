"use client";
import Link from "next/link";
import { useMemo } from "react";
import { run, at, cum, type Settings } from "@/engine/model.ts";
import { PageHeader, Section } from "@/components/UI";
import { useI18n } from "@/lib/i18n";

// All numbers on this page come from the engine with default settings, so they stay in sync with the model.
function useNumbers() {
  return useMemo(() => {
    const base: Settings = { rule: "taylorH", design: "admin", supply: "G" };
    const G = run(base);
    const R = run({ ...base, supply: "R" });
    const G0 = run({ ...base, params: { mp_on: 0 } });
    const R0 = run({ ...base, supply: "R", params: { mp_on: 0 } });
    const lo = run({ rule: "fixed", design: "admin", supply: "R" });
    const hi = run({ rule: "fixed", design: "admin", supply: "R", params: { di_exo: 0.01 } });
    const y = 2035;
    return {
      load: at(G, y, "incLoad"),
      homes: at(G, y, "sales") * 0.15,
      dEG: at(G, y, "dE"),
      dER: at(R, y, "dE"),
      share: at(G, y, "dE") / 651.4,
      costG: cum(G, "sc_resource", 2026, 2035),
      costR: cum(R, "sc_resource", 2026, 2035),
      tariffUp: at(G, y, "tariff") - at(G0, y, "tariff"),
      tariffBase: at(G0, y, "tariff"),
      debtG: at(G, y, "psDebt") - at(G0, y, "psDebt"),
      debtR: at(R, y, "psDebt") - at(R0, y, "psDebt"),
      reLost: at(lo, y, "reCap") - at(hi, y, "reCap"),
      budgetG: cum(G, "itmoCost", 2026, 2035) + cum(G, "domSub", 2026, 2035),
      maxCheck: Math.max(G.maxCheck, R.maxCheck),
    };
  }, []);
}

function Big({ n, unit, label }: { n: string; unit: string; label: string }) {
  return (
    <div className="kpi">
      <div className="v"><b>{n}</b><span>{unit}</span></div>
      <div className="t">{label}</div>
    </div>
  );
}

export default function Guide() {
  const i = useI18n();
  const t = i.t;
  const n = useNumbers();
  const f0 = (v: number) => i.num(v, 0), f1 = (v: number) => i.num(v, 1);

  const actors: [string, string, string][] = [
    ["HH", t("가계", "Households"), t("일하고 월급을 받고, 물건을 사고, 전기요금을 내고, 남는 돈은 저축한다.", "Work, earn wages, buy things, pay electricity bills and save what is left.")],
    ["NFC", t("기업", "Firms"), t("물건을 만들어 팔고, 공장을 짓기 위해 은행에서 돈을 빌린다. 데이터센터도 여기에 속한다.", "Make and sell goods and borrow from banks to build factories. Data centres belong here.")],
    ["PS", t("전력회사", "Power companies"), t("발전소를 짓고 전기를 판다. 한국은 정부가 전기요금을 정하기 때문에, 비용이 올라도 요금을 바로 못 올리면 빚이 쌓인다.", "Build power plants and sell electricity. In Korea the government sets the tariff, so when costs rise faster than tariffs, debt piles up.")],
    ["BK", t("은행", "Banks"), t("예금을 받아 대출을 해 준다. 빌려준 돈이 떼일 위험이 커지면 대출을 줄인다.", "Take deposits and make loans. When the risk of not being repaid rises, they lend less.")],
    ["PB", t("정책금융기관", "Policy banks"), t("산업은행·기업은행 같은 공공 금융기관. K-GX의 790조 원은 대부분 이들의 대출·보증이다.", "Public lenders such as KDB and IBK. Most of K-GX's KRW 790 tn is their loans and guarantees.")],
    ["GOV", t("정부", "Government"), t("세금을 걷고 예산을 쓴다. 모자라면 국채를 발행해 빌린다.", "Collects taxes and spends the budget. When short, it borrows by issuing bonds.")],
    ["CB", t("한국은행", "Bank of Korea"), t("물가가 오르면 기준금리를 올려 경기를 식힌다. 금리가 오르면 모두의 대출 이자가 오른다.", "Raises the policy rate when prices rise, to cool the economy. Higher rates make everyone's loans more expensive.")],
    ["ROW", t("해외", "Rest of the world"), t("우리가 수출하면 돈이 들어오고, 가스(LNG)를 수입하면 돈이 나간다.", "Money comes in when we export, and goes out when we import gas (LNG).")],
  ];

  const glossary: [string, string][] = [
    ["E-SFC", t("Ecological Stock-Flow Consistent. 돈의 흐름(flow)과 쌓인 돈(stock)이 한 푼도 틀리지 않게 맞춰지는 경제모형에 환경(배출)을 붙인 것.", "Ecological Stock-Flow Consistent. An economic model in which money flows and accumulated stocks always add up exactly, with the environment (emissions) attached.")],
    ["NDC", t("나라가 유엔에 약속한 온실가스 감축 목표. 한국은 2035년까지 2018년보다 53–61% 줄이기로 했다.", "The emissions target a country pledges to the UN. Korea pledged to cut 53–61% below 2018 by 2035.")],
    ["K-ETS", t("배출권거래제. 기업이 배출할 수 있는 총량(상한)을 정하고, 그 권리(배출권)를 사고팔게 하는 제도.", "Korea's emissions trading system. It caps total emissions and lets firms buy and sell the right to emit (allowances).")],
    ["KAU", t("한국 배출권 1톤의 가격.", "The price of one tonne of Korean emission allowance.")],
    ["ITMO", t("다른 나라에서 줄인 감축 실적을 돈 주고 사 오는 것. 파리협정 6조.", "Emission reductions bought from another country (Paris Agreement Article 6).")],
    ["K-GX", t("2026–2035년 한국형 녹색대전환 전략. 정부 예산 200조 원 + 정책금융 790조 원 + 민간 220조 원.", "Korea's 2026–2035 green transformation strategy: KRW 200 tn budget + 790 tn policy finance + 220 tn private.")],
    ["GW · TWh", t("GW는 '순간에 쓰는 전력의 크기', TWh는 '1년 동안 쓴 전기의 양'. 1GW를 1년 내내 쓰면 약 8.8TWh.", "GW is how much power is used at a moment; TWh is how much electricity is used over a year. Running 1 GW all year ≈ 8.8 TWh.")],
    ["WACC", t("사업에 필요한 돈을 빌리고 모으는 데 드는 평균 이자율. 높을수록 사업이 비싸진다.", "The average interest rate a project pays to raise its money. The higher it is, the more expensive the project.")],
    ["LCOE", t("발전소를 짓고 운영하는 데 드는 모든 비용을 '전기 1kWh당 얼마'로 나눈 값.", "All the costs of building and running a plant, expressed per kWh of electricity.")],
    [t("CPI · 물가", "CPI · inflation"), t("소비자가 사는 물건 가격의 평균. 전기요금이 오르면 직접, 그리고 전기를 쓰는 물건값을 통해 간접적으로 오른다.", "The average price of what consumers buy. Higher electricity tariffs raise it directly, and indirectly through goods made with electricity.")],
    [t("워터베드", "Waterbed"), t("물침대 한쪽을 누르면 다른 쪽이 올라오듯, 배출 상한이 고정되면 한 곳의 배출 증가가 다른 곳의 감축으로 밀려나는 현상.", "Like pressing one side of a waterbed: with a fixed cap, extra emissions in one place force cuts somewhere else.")],
    [t("이연", "Deferral"), t("비용이 올랐는데 요금을 바로 안 올리고 나중으로 미루는 것. 그동안 전력회사가 빚을 낸다.", "Postponing a tariff rise after costs have gone up. Meanwhile the power company borrows.")],
    [t("추가성", "Additionality"), t("정부 지원이 없었으면 생기지 않았을 투자만 '진짜 효과'로 세는 것.", "Counting only the investment that would not have happened without public support.")],
  ];

  return (
    <>
      <PageHeader n="00" eyebrow={t("한눈에 이해하기", "In plain words")} title={t("이 도구가 묻는 것, 쉽게 풀어 보기", "What this tool asks, in plain words")}>
        {t("어려운 식 없이, 이 도구가 무엇을 계산하고 왜 중요한지 순서대로 설명한다. 아래 숫자는 모두 이 모형을 기본 설정으로 돌린 결과이며, 실제 예측이 아니라 '이런 방향과 크기일 수 있다'는 실험값이다.",
          "No equations — just what this tool calculates and why it matters, step by step. Every number below comes from running this model with default settings. They are experimental results showing plausible direction and size, not forecasts.")}
      </PageHeader>

      <Section title={t("1. 질문은 하나다", "1. One question")}>
        <div className="card guide">
          <p className="g-lead">{t("AI 데이터센터와 반도체 공장이 전기를 엄청나게 쓰게 된다. 그 전기를 어떻게 만드느냐에 따라 온실가스가 늘어난다. 나라가 약속한 감축 목표를 지키려면 누군가 돈을 더 써야 한다.",
            "AI data centres and chip factories are going to use enormous amounts of electricity. Depending on how that electricity is made, greenhouse gas emissions go up. To keep the country's climate promise, someone has to spend more money.")}</p>
          <p className="g-q">{t("그 돈은 누가, 얼마나, 언제 내게 될까?", "Who pays, how much, and when?")}</p>
        </div>
      </Section>

      <Section title={t("2. 이 연구는 무엇을 하나", "2. What this research does")}>
        <div className="card guide">
          <p>{t("이 연구는 위 질문에 숫자로 답하려 한다. 정부는 한편으로 AI·반도체 메가프로젝트를 키우고, 다른 한편으로 K-GX로 녹색전환에 큰돈을 넣는다. 두 계획은 따로 발표됐지만 같은 전력망, 같은 예산, 같은 금리 위에서 움직인다. 이 연구는 이 둘을 한 장부에 같이 올려놓고 서로 어떻게 부딪히는지 본다.",
            "This research tries to answer that question with numbers. The government is growing AI and chip megaprojects on one hand, and putting large sums into the green transition through K-GX on the other. The two plans were announced separately, but they run on the same grid, the same budget and the same interest rates. The research puts both in one ledger and looks at how they collide.")}</p>
          <div className="g-tb-qs">
            <div><span className="e">{t("질문 1", "Question 1")}</span><b>{t("배출과 재정", "Emissions and the budget")}</b><span>{t("메가프로젝트 때문에 온실가스가 얼마나 늘고, 감축 목표를 지키려면 K-GX가 돈을 얼마나 더 써야 하나?", "How much do the megaprojects add to emissions, and how much more must K-GX spend to keep the target?")}</span></div>
            <div><span className="e">{t("질문 2", "Question 2")}</span><b>{t("금리와 전환", "Interest rates and the transition")}</b><span>{t("전기요금이 올라 물가가 오르고 한국은행이 금리를 올리면, 녹색투자는 얼마나 줄어드나?", "If higher tariffs push up prices and the Bank of Korea raises rates, how much green investment is lost?")}</span></div>
          </div>
          <p className="strong" style={{ color: "var(--navy-900)" }}>{t("연구는 네 단계로 진행된다", "The research runs in four steps")}</p>
          <ol className="g-steps">
            <li><b>{t("전기를 어떻게 댈지 정한다", "Decide how the power is supplied")}</b><span>{t("메가프로젝트에 필요한 전기를 재생에너지 위주, 가스 위주, 섞어서 등 몇 가지 경우로 나눈다. 전기 수요와 K-GX 목표는 똑같이 두고 '만드는 방식'만 바꾼다.", "Split the megaprojects' power needs into a few cases: mostly renewables, mostly gas, or a mix. Demand and the K-GX targets stay the same; only the way power is made changes.")}</span></li>
            <li><b>{t("돈이 금리를 거쳐 도는 길을 따라간다", "Follow the money through interest rates")}</b><span>{t("비용이 오르면 요금과 물가가 오르고, 한국은행이 금리를 올리면 녹색산업이 빌리는 돈이 비싸진다. 금리 규칙을 바꿔 가며 이 연쇄가 얼마나 큰지 잰다.", "Higher costs raise tariffs and prices; if the Bank of Korea raises rates, green industries pay more to borrow. Measure how big this chain is under different rate rules.")}</span></li>
            <li><b>{t("나라 예산에 얼마가 떨어지는지 센다", "Count what lands on the budget")}</b><span>{t("늘어난 배출을 감축 목표 안에서 메우려면 정부가 얼마를, 언제 써야 하는지 계산한다. K-GX 예산·정책금융과 같은 단위, 같은 연도로 맞춘다.", "Calculate how much the government must spend, and when, to absorb the extra emissions within the target — in the same units and years as the K-GX budget and policy finance.")}</span></li>
            <li><b>{t("정책 묶음을 제안한다", "Propose a policy package")}</b><span>{t("계산 결과를 바탕으로 요금·재정·금융 정책을 어떻게 짜면 좋을지 제안한다. 이 단계는 모형이 정답을 내는 게 아니라, 재정당국과 논의하며 사람이 설계한다.", "Use the results to propose how tariff, fiscal and financial policy could be combined. The model does not give the answer here; people design it together with the fiscal authorities.")}</span></li>
          </ol>
          <p>{t("최종적으로 알고 싶은 것은 두 숫자다: '온실가스가 얼마나 늘어나는가'와 '그걸 메우는 데 재정이 얼마나 더 드는가'. 어떤 모형을 쓰는지는 그 숫자를 믿을 수 있게 만드는 수단일 뿐이다.",
            "In the end we want two numbers: how much emissions rise, and how much extra fiscal effort it takes to offset them. Which model is used is only a means of making those numbers trustworthy.")}</p>
          <p className="small muted" style={{ margin: 0 }}>{t("이 웹 도구는 연구를 진행하면서 방법을 익히고 설계를 미리 시험해 보는 실험판이다. 최종 연구에 쓸 모형은 아직 정해지지 않았고, 여기 숫자는 연구 결과가 아니다.",
            "This web tool is an experimental version for learning the methods and testing design choices during the research. The model for the final study has not been chosen, and the numbers here are not research results.")}</p>
        </div>
      </Section>

      <Section title={t("3. 얼마나 큰 이야기인가", "3. How big is this?")} sub={t("모형 기본 설정, 2035년", "model default settings, 2035")}>
        <div className="kpis guide-kpis">
          <Big n={f0(n.load)} unit="TWh" label={t(`2035년 데이터센터가 추가로 쓰는 전기. 한국 모든 가정이 1년 동안 쓰는 전기(약 ${f0(n.homes)}TWh)와 비슷하다.`, `Extra electricity used by data centres in 2035 — about as much as all Korean households use in a year (~${f0(n.homes)} TWh).`)} />
          <Big n={f1(n.dEG)} unit="Mt" label={t(`그 전기를 가스로 만들면 늘어나는 온실가스. 한국 전체 배출의 약 ${f0(n.share * 100)}%.`, `Extra emissions if that electricity comes from gas — about ${f0(n.share * 100)}% of Korea's total emissions.`)} />
          <Big n={f1(n.dER)} unit="Mt" label={t("재생에너지 위주로 만들면 늘어나는 온실가스. 바람·햇빛이 없을 때를 대비한 가스 발전 몫만 남는다.", "Extra emissions if it comes mostly from renewables. Only the gas backup for windless, sunless hours remains.")} />
          <Big n={f0(n.costG)} unit={t("조원", "KRW tn")} label={t("2026–2035년 10년간 이 전기를 대는 데 드는 추가 비용(가스 주도 기준). 발전소·전력망·연료·다른 곳의 감축 비용을 더한 것.", "Extra cost of supplying this power over 2026–2035 (gas-led): plants, grid, fuel and cutting emissions elsewhere.")} />
        </div>
      </Section>

      <Section title={t("4. 경제를 '하나의 장부'로 본다", "4. The economy as one ledger")}>
        <div className="card guide">
          <p>{t("이 모형의 규칙은 단 하나다: 누군가 쓴 돈은 반드시 다른 누군가가 받은 돈이다. 보드게임에서 은행 칸까지 합치면 돈의 총합이 늘 맞는 것처럼, 모형 안의 8개 주체가 주고받는 돈은 매년 한 원도 남거나 모자라지 않아야 한다. 그래서 '전기요금을 안 올리면 그 비용은 어디로 가는가?' 같은 질문에 답할 수 있다. 사라지는 돈은 없고, 반드시 누군가의 빚이나 부담으로 남는다.",
            "The model has one rule: money spent by someone is always money received by someone else. Like a board game where the total money always adds up once you include the bank, the money passed among the model's eight players must balance to the last won every year. That lets us answer questions like 'if tariffs don't go up, where does the cost go?' Money never disappears — it always ends up as someone's debt or burden.")}</p>
          <div className="g-actors">
            {actors.map(([e, a, b]) => (
              <div key={a} className="g-actor"><span className="e">{e}</span><b>{a}</b><span>{b}</span></div>
            ))}
          </div>
          <p className="small muted" style={{ margin: 0 }}>{t(`지금 설정에서 장부가 맞는지 확인한 결과: 오차 ${n.maxCheck.toExponential(0)}조 원 (사실상 0).`, `Ledger check at current settings: error ${n.maxCheck.toExponential(0)} KRW tn (effectively zero).`)}</p>
        </div>
      </Section>

      <Section title={t("5. 갈림길 네 개", "5. Four forks in the road")} sub={t("도구에서 바꿔 볼 수 있는 것", "what you can change in the tool")}>
        <div className="g-forks">
          <div className="card">
            <div className="g-num">A</div>
            <h3>{t("전기를 무엇으로 만들까", "What makes the electricity?")}</h3>
            <p>{t(`가스로 만들면 발전소는 싸게 빨리 짓지만 연료를 계속 수입해야 하고 배출이 많다(${f1(n.dEG)}Mt). 재생에너지는 처음에 돈이 많이 들지만 연료비가 없고 배출이 적다(${f1(n.dER)}Mt). 10년 총비용은 비슷해도(${f0(n.costG)} 대 ${f0(n.costR)}조 원) 누가 언제 내는지가 다르다.`,
              `Gas plants are cheap and quick to build but need imported fuel forever and emit a lot (${f1(n.dEG)} Mt). Renewables cost more up front but have no fuel bill and emit little (${f1(n.dER)} Mt). The 10-year total cost can be similar (${f0(n.costG)} vs ${f0(n.costR)} KRW tn), but who pays, and when, is different.`)}</p>
          </div>
          <div className="card">
            <div className="g-num">B</div>
            <h3>{t("늘어난 배출은 누가 메울까", "Who makes up for the extra emissions?")}</h3>
            <p>{t(`배출 상한을 그대로 두면, 다른 기업들이 배출권을 팔고 대신 줄인다(워터베드). 나라 예산은 거의 안 든다. 상한을 늘려 주면, 목표를 지키기 위해 정부가 해외 감축 실적(ITMO)을 사거나 국내 감축에 보조금을 준다. 기본 설정에서는 10년간 약 ${f1(n.budgetG)}조 원.`,
              `If the emissions cap stays fixed, other firms sell allowances and cut instead (the waterbed); the budget barely pays. If the cap is raised, the government must buy reductions abroad (ITMOs) or subsidise cuts at home to keep the target — about ${f1(n.budgetG)} KRW tn over 10 years at default settings.`)}</p>
          </div>
          <div className="card">
            <div className="g-num">C</div>
            <h3>{t("요금을 바로 올릴까, 빚으로 버틸까", "Raise tariffs now, or borrow?")}</h3>
            <p>{t(`가스 주도면 2035년 평균 전기요금이 kWh당 약 ${f0(n.tariffUp)}원(약 ${f0((n.tariffUp / n.tariffBase) * 100)}%) 오른다. 정부가 요금을 늦게, 덜 올리면 그만큼 전력회사 빚으로 쌓인다. 재생 위주는 초기 투자가 커서 2035년 전력회사 빚이 약 ${f0(n.debtR)}조 원 늘어난다(가스 주도는 ${f0(n.debtG)}조 원). 물가는 덜 오르지만 부담이 사라지는 게 아니라 미뤄진다.`,
              `With gas-led supply, the average tariff in 2035 rises by about KRW ${f0(n.tariffUp)}/kWh (~${f0((n.tariffUp / n.tariffBase) * 100)}%). If the government raises tariffs late or by less, the gap piles up as power-company debt. Renewables-led supply needs big upfront investment, so power-company debt is about KRW ${f0(n.debtR)} tn higher in 2035 (gas-led: ${f0(n.debtG)} tn). Prices rise less, but the burden is postponed, not removed.`)}</p>
          </div>
          <div className="card">
            <div className="g-num">D</div>
            <h3>{t("한국은행은 금리를 올릴까", "Will the Bank of Korea raise rates?")}</h3>
            <p>{t(`재생에너지는 '빌린 돈으로 먼저 짓고 오래 갚는' 사업이라 금리에 민감하다. 금리가 1%p 높으면 2035년까지 재생에너지가 약 ${f1(n.reLost)}GW 덜 지어지고, 그 빈자리를 가스가 채워 배출이 다시 늘어난다. 그래서 금리를 어떤 규칙으로 정하는지(물가 전체를 보는지, 에너지 가격은 잠시 넘기는지)가 기후 목표에도 영향을 준다.`,
              `Renewables are 'build now with borrowed money, repay slowly' projects, so they are sensitive to interest rates. A rate 1 percentage point higher leaves about ${f1(n.reLost)} GW of renewables unbuilt by 2035, and gas fills the gap, so emissions rise again. That is why the rule the central bank follows (react to all prices, or look through temporary energy prices) also matters for the climate target.`)}</p>
          </div>
        </div>
      </Section>

      <Section title={t("6. K-GX 1,000조 원은 어떤 돈인가", "6. What is K-GX's KRW 1,000 tn?")}>
        <div className="card guide">
          <div className="g-bars">
            <div className="g-bar" style={{ flex: 200 }}><b>200</b><span>{t("정부 예산", "Government budget")}</span><small>{t("보조금·세금 감면 등, 돌려받지 않는 돈", "grants, tax credits — money not paid back")}</small></div>
            <div className="g-bar alt" style={{ flex: 790 }}><b>790</b><span>{t("정책금융 (5대 공공 금융기관)", "Policy finance (five public lenders)")}</span><small>{t("대출·보증 — 대부분 나중에 돌려받는 돈", "loans and guarantees — mostly repaid later")}</small></div>
            <div className="g-bar priv" style={{ flex: 220 }}><b>220</b><span>{t("민간 기업", "Private firms")}</span><small>{t("기업이 발표한 투자 계획", "investment plans announced by firms")}</small></div>
          </div>
          <p>{t("'1,000조를 쓴다'는 말과 달리, 대부분은 빌려주고 돌려받는 돈이다. 그래서 이 도구는 세 가지를 따로 센다: (1) 실제로 나라 예산에서 나가는 돈, (2) 빌려준 돈 중 떼일 수 있는 몫, (3) 지원이 없었어도 했을 투자를 뺀 '진짜 추가 투자'. 메가프로젝트가 이 계획에 얼마를 더 얹는지가 핵심 질문이다.",
            "Unlike 'spending KRW 1,000 tn', most of it is money lent and repaid. So the tool counts three things separately: (1) money that actually leaves the government budget, (2) the share of loans that may not be repaid, and (3) 'truly extra' investment — excluding what would have happened anyway. The key question is how much the megaprojects add on top of this plan.")}</p>
        </div>
      </Section>

      <Section title={t("7. 결과를 읽을 때 주의할 점", "7. Reading the results carefully")}>
        <div className="card guide">
          <ul className="g-list">
            <li>{t("숫자 그 자체보다 '비교'를 본다. 메가프로젝트가 있을 때와 없을 때, 가스와 재생, 금리 규칙 A와 B의 차이가 핵심이다.", "Look at comparisons, not single numbers: with vs without megaprojects, gas vs renewables, rate rule A vs B.")}</li>
            <li>{t("많은 값이 아직 '그럴듯한 가정'이다. 등록부에서 C 등급(점선 배지)이 그런 값이고, 앞으로 실제 자료로 바꿔 나간다.", "Many inputs are still plausible assumptions — the grade-C values (dashed badges) in the registry — and will be replaced with real data over time.")}</li>
            <li>{t("이 도구는 정답을 내는 기계가 아니라, '이 가정이면 이렇게 된다'를 빠르게 실험해 보는 실험실이다.", "This is not a machine that gives the answer. It is a lab for quickly testing 'if we assume this, then that happens'.")}</li>
          </ul>
          <div className="g-next">
            <Link href="/alignment" className="btn primary">{t("직접 실험해 보기 →", "Try it yourself →")}</Link>
            <Link href="/study" className="btn">{t("수식과 참고문헌 보기", "Equations and references")}</Link>
          </div>
        </div>
      </Section>

      <Section title={t("8. 용어 풀이", "8. Glossary")}>
        <div className="card">
          <dl className="g-gloss">
            {glossary.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
        </div>
      </Section>
    </>
  );
}

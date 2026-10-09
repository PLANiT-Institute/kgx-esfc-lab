"use client";
import Link from "next/link";
import { PageHeader, Section, SourceBadge, Callout } from "@/components/UI";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const i = useI18n();
  const t = i.t;
  const entries = [
    { href: "/study", n: "1", t: t("방법론 스터디", "Methodology"), d: t("연구 설계(Step 1–4)와 다섯 개 참조모형의 핵심 식, 이 도구가 가져온 것과 뺀 것.", "Research design (Steps 1–4), core equations of the five reference models, and what this tool adopts and leaves out.") },
    { href: "/lab", n: "2", t: t("DEFINE-UK E-SFC 실험실", "DEFINE-UK E-SFC lab"), d: t("반응함수·신용할당·녹색비중·GDCR·재정준칙·피해함수를 바꾸며 거래흐름행렬과 대차대조표가 닫히는지 확인.", "Change rate rules, credit rationing, green share, GDCR, fiscal rules and damages, and check that the transaction-flow matrix and balance sheet close.") },
    { href: "/alignment", n: "3", t: t("전력 × K-GX 정합", "Power × K-GX alignment"), d: t("방법론 쟁점 Q1–Q5 순서로 배출→재정 경로, K-GX 수단, 시장설계, LNG·환율 물가, K-ETS를 실험.", "Experiments in Q1–Q5 order: emissions → fiscal route, K-GX instruments, market design, LNG · FX inflation, K-ETS.") },
  ];
  return (
    <>
      <PageHeader n="01" eyebrow={t("개요", "Overview")} title="K-GX E-SFC Policy Lab">
        {t("메가프로젝트와 K-GX의 재정 문제를 다루는 PLANiT 연구의 정책 질문 두 가지를 하나의 스톡-플로우 정합 회계 안에서 실험하는 도구다. (1) 27GW급 메가프로젝트 부하가 얼마나 추가 배출을 만들고, K-GX가 그것을 상쇄하려면 재정 노력이 얼마나 더 필요한가. (2) 전환투자가 금리에 얼마나 민감한가. 모형 선택은 미확정이며, 이 도구는 방법론 학습과 설계 실험을 위한 샌드박스다.",
          "A tool for testing the two policy questions of PLANiT's research on the fiscal side of the megaprojects and K-GX inside one stock-flow consistent set of accounts. (1) How much extra emissions does the ~27 GW megaproject load create, and how much more fiscal effort does K-GX need to offset them? (2) How sensitive is transition investment to interest rates? Model choice is not settled; this tool is a sandbox for learning the methodology and testing design choices.")}
      </PageHeader>

      <div className="grid g3">
        {entries.map((e) => (
          <Link key={e.href} href={e.href} className="entry">
            <span className="t"><span className="n">{e.n}</span>{e.t}<span className="arr">→</span></span>
            <span className="d">{e.d}</span>
          </Link>
        ))}
      </div>

      <Section title={t("구조", "Structure")} sub={t("전력 원장 → E-SFC → K-GX → K-ETS", "Power ledger → E-SFC → K-GX → K-ETS")}>
        <div className="card">
          <div className="flow">
            <div className="node"><span className="k">Layer 1</span><b>{t("전력 원장", "Power ledger")}</b><span>{t("부하·믹스·비용·배출 · MFMod 전력 soft-link · GMMET 간헐성", "Load · mix · costs · emissions · MFMod power soft-link · GMMET intermittency")}</span></div>
            <div className="edge">→<small>{t("capex(수입분 분리)·연료·요금·배출", "capex (import share split) · fuel · tariffs · emissions")}</small></div>
            <div className="node main"><span className="k">Layer 2</span><b>{t("E-SFC 거시·금융", "E-SFC macro · finance")}</b><span>{t("DEFINE-UK 부문·행태식 · SFF 녹색분할·피해 · MFMod 재정·물가", "DEFINE-UK sectors · behaviour · SFF green split · damages · MFMod fiscal · prices")}</span></div>
            <div className="edge">↔</div>
            <div className="node"><span className="k">{t("정책", "Policy")}</span><b>{t("K-GX 재정·정책금융", "K-GX budget · policy finance")}</b><span>{t("200조 · 790조 · 220조 · 녹색국채 · 세액공제", "KRW 200 tn · 790 tn · 220 tn · green bonds · tax credit")}</span></div>
            <div className="edge">↔</div>
            <div className="node"><span className="k">{t("제약", "Constraint")}</span><b>K-ETS · NDC</b><span>{t("상한 경직/수용 · ITMO · 국내감축", "Rigid / accommodating cap · ITMOs · domestic abatement")}</span></div>
          </div>
          <p className="note" style={{ borderTop: "1px solid var(--line-row)", paddingTop: 10, marginTop: 14 }}>
            {t("8부문(가계·비금융기업·전력부문·은행·K-GX 정책금융·정부·한국은행·해외) × 12개 금융상품. 매년 순대출 합 = 0, 잉여식(국채 보유 합 = 발행), 부문별 순대출 = 순금융자산 증감, GDP 지출 = 소득을 검사한다. 테스트 16개(규칙 5 × 설계 3 × 시나리오 4 × 스위치 묶음 4 = 240개 조합 정합성 포함).",
              "8 sectors (households, non-financial firms, power sector, banks, K-GX policy finance, government, Bank of Korea, rest of world) × 12 financial instruments. Every year the tool checks: net lending sums to 0, the redundant equation (bond holdings = issuance), sectoral net lending = change in net financial wealth, and GDP expenditure = income. 16 tests (incl. consistency across 5 rules × 3 designs × 4 scenarios × 4 switch bundles = 240 combinations).")}
          </p>
        </div>
      </Section>

      <Section title={t("연구 설계 → 도구", "Research design → tool")}>
        <div className="table-wrap"><table>
          <thead><tr><th>{t("단계", "Step")}</th><th>{t("연구 설계", "Research design")}</th><th>{t("이 도구", "This tool")}</th></tr></thead>
          <tbody>{i.steps.map((s) => <tr key={s.step}><td className="strong" style={{ whiteSpace: "nowrap" }}>{s.step}</td><td>{s.proposal}</td><td>{s.tool}</td></tr>)}</tbody>
        </table></div>
      </Section>

      <Section title={t("참조 모형", "Reference models")} sub={t("5개 · 상세는 방법론 스터디", "5 · details in Methodology")}>
        <div className="table-wrap"><table>
          <thead><tr><th>{t("문헌", "Source")}</th><th>{t("이 도구에서의 역할", "Role in this tool")}</th></tr></thead>
          <tbody>{i.models.map((m) => (
            <tr key={m.key}>
              <td style={{ width: "38%" }}><a href={m.url} target="_blank" rel="noreferrer" className="strong">{m.title}</a><div className="small muted">{m.cite}</div></td>
              <td>{m.role}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </Section>

      <Section title={t("방법론 쟁점", "Methodology issues")} sub={t("Q1–Q5 · 실험은 전력 × K-GX 정합 화면", "Q1–Q5 · experiments on the Power × K-GX page")}>
        <div className="table-wrap"><table>
          <thead><tr><th>{t("쟁점", "Issue")}</th><th>{t("질문", "Question")}</th><th>{t("도구 위치", "Where in the tool")}</th><th>{t("상태", "Status")}</th></tr></thead>
          <tbody>{i.issues.map((q) => (
            <tr key={q.id}><td><span className="chip-q">{q.id}</span></td><td>{q.q}</td><td className="small">{q.module}</td><td className="small">{q.status}</td></tr>
          ))}</tbody>
        </table></div>
      </Section>

      <Section title={t("K-GX 사실관계", "K-GX facts")} sub={t("2026-10-07 국민보고회 기준", "As of the 2026-10-07 national briefing")}>
        <div className="table-wrap"><table>
          <thead><tr><th>{t("항목", "Item")}</th><th>{t("내용", "Detail")}</th><th>{t("출처", "Source")}</th></tr></thead>
          <tbody>{i.facts.map((f) => (
            <tr key={f.k}><td className="strong" style={{ whiteSpace: "nowrap" }}>{f.k}</td><td>{f.v}</td>
              <td className="small"><SourceBadge kind={f.grade} />{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.src}</a> : f.src}</td></tr>
          ))}</tbody>
        </table></div>
      </Section>

      <Callout title={t("읽는 법·한계", "How to read · limitations")}>
        <ul>{i.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
      </Callout>
    </>
  );
}

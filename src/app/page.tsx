import Link from "next/link";
import { MODELS, ISSUES, KGX_FACTS, CAVEATS, PROPOSAL_STEPS } from "@/lib/content";
import { PageHeader, Section, SourceBadge, Callout } from "@/components/UI";

const ENTRIES = [
  { href: "/study", n: "1", t: "방법론 스터디", d: "연구 설계(Step 1–4)와 다섯 개 참조모형의 핵심 식, 이 도구가 가져온 것과 뺀 것." },
  { href: "/lab", n: "2", t: "DEFINE-UK E-SFC 실험실", d: "반응함수·신용할당·녹색비중·GDCR·재정준칙·피해함수를 바꾸며 거래흐름행렬과 대차대조표가 닫히는지 확인." },
  { href: "/alignment", n: "3", t: "전력 × K-GX 정합", d: "방법론 쟁점 Q1–Q5 순서로 배출→재정 경로, K-GX 수단, 시장설계, LNG·환율 물가, K-ETS를 실험." },
];

export default function Home() {
  return (
    <>
      <PageHeader n="01" eyebrow="개요" title="K-GX E-SFC Policy Lab">
        Track B(&quot;메가프로젝트와 K-GX를 위한 기후정합 재정정책&quot;) 연구의 정책 질문 두 가지를 하나의 스톡-플로우 정합 회계 안에서 실험하는 도구다.
        (1) 27GW급 메가프로젝트 부하가 얼마나 추가 배출을 만들고, K-GX가 그것을 상쇄하려면 재정 노력이 얼마나 더 필요한가.
        (2) 전환투자가 금리에 얼마나 민감한가. 모형 선택은 미확정이며, 이 도구는 방법론 학습과 설계 실험을 위한 샌드박스다.
      </PageHeader>

      <div className="grid g3">
        {ENTRIES.map((e) => (
          <Link key={e.href} href={e.href} className="entry">
            <span className="t"><span className="n">{e.n}</span>{e.t}<span className="arr">→</span></span>
            <span className="d">{e.d}</span>
          </Link>
        ))}
      </div>

      <Section title="구조" sub="전력 원장 → E-SFC → K-GX → K-ETS">
        <div className="card">
          <div className="flow">
            <div className="node"><span className="k">Layer 1</span><b>전력 원장</b><span>부하·믹스·비용·배출 · MFMod 전력 soft-link · GMMET 간헐성</span></div>
            <div className="edge">→<small>capex(수입분 분리)·연료·요금·배출</small></div>
            <div className="node main"><span className="k">Layer 2</span><b>E-SFC 거시·금융</b><span>DEFINE-UK 부문·행태식 · SFF 녹색분할·피해 · MFMod 재정·물가</span></div>
            <div className="edge">↔</div>
            <div className="node"><span className="k">정책</span><b>K-GX 재정·정책금융</b><span>200조 · 790조 · 220조 · 녹색국채 · 세액공제</span></div>
            <div className="edge">↔</div>
            <div className="node"><span className="k">제약</span><b>K-ETS·NDC</b><span>상한 경직/수용 · ITMO · 국내감축</span></div>
          </div>
          <p className="note" style={{ borderTop: "1px solid var(--line-row)", paddingTop: 10, marginTop: 14 }}>
            8부문(가계·비금융기업·전력부문·은행·K-GX 정책금융·정부·한국은행·해외) × 12개 금융상품. 매년 순대출 합 = 0, 잉여식(국채 보유 합 = 발행),
            부문별 순대출 = 순금융자산 증감, GDP 지출 = 소득을 검사한다. 테스트 16개(규칙 5 × 설계 3 × 시나리오 4 × 스위치 묶음 4 = 240개 조합 정합성 포함).
          </p>
        </div>
      </Section>

      <Section title="연구 설계 → 도구">
        <div className="table-wrap"><table>
          <thead><tr><th>단계</th><th>연구 설계</th><th>이 도구</th></tr></thead>
          <tbody>{PROPOSAL_STEPS.map((s) => <tr key={s.step}><td className="strong" style={{ whiteSpace: "nowrap" }}>{s.step}</td><td>{s.proposal}</td><td>{s.tool}</td></tr>)}</tbody>
        </table></div>
      </Section>

      <Section title="참조 모형" sub="5개 · 상세는 방법론 스터디">
        <div className="table-wrap"><table>
          <thead><tr><th>문헌</th><th>이 도구에서의 역할</th></tr></thead>
          <tbody>{MODELS.map((m) => (
            <tr key={m.key}>
              <td style={{ width: "38%" }}><a href={m.url} target="_blank" rel="noreferrer" className="strong">{m.title}</a><div className="small muted">{m.cite}</div></td>
              <td>{m.role}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </Section>

      <Section title="방법론 쟁점" sub="Q1–Q5 · 실험은 전력 × K-GX 정합 화면">
        <div className="table-wrap"><table>
          <thead><tr><th>쟁점</th><th>질문</th><th>도구 위치</th><th>상태</th></tr></thead>
          <tbody>{ISSUES.map((q) => (
            <tr key={q.id}><td><span className="chip-q">{q.id}</span></td><td>{q.q}</td><td className="small">{q.module}</td><td className="small">{q.status}</td></tr>
          ))}</tbody>
        </table></div>
      </Section>

      <Section title="K-GX 사실관계" sub="2026-10-07 국민보고회 기준">
        <div className="table-wrap"><table>
          <thead><tr><th>항목</th><th>내용</th><th>출처</th></tr></thead>
          <tbody>{KGX_FACTS.map((f) => (
            <tr key={f.k}><td className="strong" style={{ whiteSpace: "nowrap" }}>{f.k}</td><td>{f.v}</td>
              <td className="small"><SourceBadge kind={f.grade} />{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.src}</a> : f.src}</td></tr>
          ))}</tbody>
        </table></div>
      </Section>

      <Callout title="읽는 법·한계">
        <ul>{CAVEATS.map((c) => <li key={c}>{c}</li>)}</ul>
      </Callout>
    </>
  );
}

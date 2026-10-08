import Link from "next/link";
import { MODELS, ISSUES, KGX_FACTS, CAVEATS, PROPOSAL_STEPS } from "@/lib/content";

export default function Home() {
  return (
    <>
      <h1>K-GX E-SFC Policy Lab</h1>
      <p className="lead">
        Track B("메가프로젝트와 K-GX를 위한 기후정합 재정정책") 연구의 정책 질문 두 가지를 하나의 스톡-플로우 정합 회계 안에서 실험하는 도구다.
        (1) 27GW급 메가프로젝트 부하가 얼마나 추가 배출을 만들고, K-GX가 그것을 상쇄하려면 재정 노력이 얼마나 더 필요한가.
        (2) 전환투자가 금리에 얼마나 민감한가. 모형 선택은 미확정이며, 이 도구는 방법론 학습과 설계 실험을 위한 샌드박스다.
      </p>
      <div className="grid g3">
        <Link href="/study" className="card"><h3>1. 방법론 스터디</h3><div className="muted small">제안 방법론(Step 1–4)과 다섯 개 참조모형의 핵심 식, 이 도구가 가져온 것과 뺀 것.</div></Link>
        <Link href="/lab" className="card"><h3>2. DEFINE-UK E-SFC 실험실</h3><div className="muted small">반응함수·신용할당·녹색비중·GDCR·재정준칙·피해함수를 바꾸며 거래흐름행렬과 대차대조표가 닫히는지 확인.</div></Link>
        <Link href="/alignment" className="card"><h3>3. 전력 × K-GX 정합</h3><div className="muted small">방법론 쟁점 Q1–Q5 순서로 배출→재정 경로, K-GX 수단, 시장설계, LNG·환율 물가, K-ETS를 실험.</div></Link>
      </div>

      <h2>구조</h2>
      <div className="card">
        <div className="flow">
          <span className="box">전력 원장 (Layer 1)<br /><span className="small muted">부하·믹스·비용·배출 · MFMod 전력 soft-link · GMMET 간헐성</span></span>
          <span className="arr">→ capex(수입분 분리)·연료·요금·배출 →</span>
          <span className="box">E-SFC 거시·금융 (Layer 2)<br /><span className="small muted">DEFINE-UK 부문·행태식 · SFF 녹색분할·피해 · MFMod 재정·물가</span></span>
          <span className="arr">↔</span>
          <span className="box">K-GX 재정·정책금융<br /><span className="small muted">200조 · 790조 · 220조 · 녹색국채 · 세액공제</span></span>
          <span className="arr">↔</span>
          <span className="box">K-ETS·NDC<br /><span className="small muted">상한 경직/수용 · ITMO · 국내감축</span></span>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          8부문(가계·비금융기업·전력부문·은행·K-GX 정책금융·정부·한국은행·해외) × 12개 금융상품. 매년 순대출 합 = 0, 잉여식(국채 보유 합 = 발행), 부문별 순대출 = 순금융자산 증감,
          GDP 지출 = 소득을 검사한다. 테스트 16개(규칙 5 × 설계 3 × 시나리오 4 × 스위치 묶음 4 = 240개 조합 정합성 포함).
        </p>
      </div>

      <h2>연구 설계 → 도구</h2>
      <div className="card">
        <table>
          <thead><tr><th>단계</th><th>연구 설계</th><th>이 도구</th></tr></thead>
          <tbody>{PROPOSAL_STEPS.map((s) => <tr key={s.step}><td><b>{s.step}</b></td><td>{s.proposal}</td><td>{s.tool}</td></tr>)}</tbody>
        </table>
      </div>

      <h2>참조 모형</h2>
      <div className="card">
        <table>
          <thead><tr><th>문헌</th><th>이 도구에서의 역할</th></tr></thead>
          <tbody>{MODELS.map((m) => <tr key={m.key}><td><a href={m.url} target="_blank" rel="noreferrer"><b>{m.title}</b></a><div className="small muted">{m.cite}</div></td><td>{m.role}</td></tr>)}</tbody>
        </table>
      </div>

      <h2>Track B 방법론 쟁점 → 모듈</h2>
      <div className="card">
        <table>
          <thead><tr><th>#</th><th>질문</th><th>도구 위치</th><th>상태</th></tr></thead>
          <tbody>{ISSUES.map((q) => <tr key={q.id}><td><b>{q.id}</b></td><td>{q.q}</td><td className="small">{q.module}</td><td className="small">{q.status}</td></tr>)}</tbody>
        </table>
      </div>

      <h2>K-GX 전략(2026-10-07) 반영 사실</h2>
      <div className="card">
        <table>
          <thead><tr><th>항목</th><th>내용</th><th>출처</th></tr></thead>
          <tbody>{KGX_FACTS.map((f) => <tr key={f.k}><td><b>{f.k}</b></td><td>{f.v}</td><td className="small"><span className={`pill ${f.grade}`}>{f.grade === "official" ? "공식" : f.grade === "news" ? "보도" : "미확인"}</span>{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.src}</a> : f.src}</td></tr>)}</tbody>
        </table>
      </div>

      <h2>읽는 법·한계</h2>
      <div className="note"><ul style={{ margin: 0, paddingLeft: 18 }}>{CAVEATS.map((c) => <li key={c}>{c}</li>)}</ul></div>
    </>
  );
}

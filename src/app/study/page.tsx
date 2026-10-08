import { MODELS, PROPOSAL_STEPS } from "@/lib/content";
import { Tex } from "@/components/Tex";
import { PageHeader, Section } from "@/components/UI";
import { SECTORS, SECTOR_LABEL, INSTR_LABEL, type Instrument, type Sector } from "@/engine/model.ts";

const HOLD: Record<Instrument, [Sector[], Sector[]]> = {
  Cash: [["HH"], ["CB"]], Res: [["BK"], ["CB"]], Dep: [["HH", "NFC", "PS", "ROW"], ["BK"]], Ln_nfc: [["BK"], ["NFC"]], Ln_ps: [["BK"], ["PS"]],
  Ln_hh: [["BK"], ["HH"]], PBL: [["PB"], ["NFC", "PS"]], PBE: [["PB"], ["NFC", "PS"]], PBB: [["BK"], ["PB"]], Bond: [["HH", "BK", "CB", "ROW"], ["GOV"]],
  Adv: [["CB"], ["BK"]], FXR: [["CB"], ["ROW"]],
};
const RESID: Partial<Record<Instrument, string>> = { Dep: "가계 예금 = 잔차", Ln_nfc: "기업 자금부족의 잔차", Ln_ps: "전력부문 자금부족의 잔차(요금 이연 포함)", PBB: "정책금융 자산 − 자본", Bond: "정부 순차입의 잔차 / 한은 보유 = 잔차", Adv: "은행 대차의 잔차" };

export default function Study() {
  return (
    <>
      <PageHeader n="02" eyebrow="방법론 스터디" title="방법론 스터디">
        연구 설계의 2층 구조(전력·배출·재정 원장 + E-SFC)를 다섯 개 참조모형의 어떤 식으로 구현했는지 정리했다. 식 번호는 원문 기준이고, &apos;구현&apos;은 이 도구의 연간 축약형이다.
        어떤 모형도 최종 선택으로 승인된 것은 아니다.
      </PageHeader>

      <Section title="연구 설계 Step 1–4와 도구의 대응">
        <div className="table-wrap"><table>
          <thead><tr><th>단계</th><th>연구 설계</th><th>도구</th></tr></thead>
          <tbody>{PROPOSAL_STEPS.map((s) => <tr key={s.step}><td className="strong" style={{ whiteSpace: "nowrap" }}>{s.step}</td><td>{s.proposal}</td><td>{s.tool}</td></tr>)}</tbody>
        </table></div>
      </Section>

      <Section title="대차대조표 구조와 폐쇄(closure)" sub="+ 자산 보유 / − 발행(부채)">
        <div className="table-wrap"><table>
          <thead><tr><th>상품</th>{SECTORS.map((s) => <th key={s} style={{ textAlign: "center" }}>{SECTOR_LABEL[s]}</th>)}<th>결정 방식</th></tr></thead>
          <tbody>{(Object.keys(HOLD) as Instrument[]).map((k) => (
            <tr key={k}><td className="strong" style={{ whiteSpace: "nowrap" }}>{INSTR_LABEL[k]}</td>
              {SECTORS.map((s) => <td key={s} style={{ textAlign: "center" }}>{HOLD[k][0].includes(s) ? <span className="sign asset">+</span> : HOLD[k][1].includes(s) ? <span className="sign liab">−</span> : ""}</td>)}
              <td className="small">{RESID[k] ?? "행태식/고정비율"}</td></tr>
          ))}</tbody>
        </table></div>
        <p className="note">시점: 금리·물가는 전기 값(DEFINE 관례)으로 결정되고, 소비는 전기 가처분소득·순자산, 투자는 전기 가동률·이윤율·당기 실질금리에 반응한다. 그래서 기간 내 동시성 없이 명시적으로 풀린다. 잉여식(국채 보유 합 = 발행)은 계산에 쓰지 않고 검사에만 쓴다.</p>
      </Section>

      {MODELS.map((m, i) => (
        <Section key={m.key} title={`${i + 1}. ${m.title}`} sub={m.key}>
          <div className="card study-card">
            <div className="small muted">{m.cite} · <a href={m.url} target="_blank" rel="noreferrer">원문 PDF</a></div>
            <p className="role"><b className="strong">역할</b> {m.role}</p>
            <div className="grid g2">
              <div><h4>가져온 것</h4><ul>{m.adopt.map((a) => <li key={a}>{a}</li>)}</ul></div>
              <div><h4>뺀 것·바꾼 것</h4><ul>{m.omit.map((a) => <li key={a}>{a}</li>)}</ul></div>
            </div>
            <div className="table-wrap"><table>
              <thead><tr><th style={{ width: 90 }}>식</th><th>원문</th><th style={{ width: 70 }}>쪽</th><th>이 도구의 구현</th></tr></thead>
              <tbody>{m.eqs.map((e) => <tr key={e.id}><td className="strong">{e.id}</td><td style={{ fontSize: 15 }}><Tex tex={e.tex} /></td><td className="small">{e.ref}</td><td className="small">{e.impl}</td></tr>)}</tbody>
            </table></div>
          </div>
        </Section>
      ))}

      <Section title="한국형으로 추가한 것" sub="참조모형에 없음">
        <div className="card"><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.75 }}>
          <li><b className="strong">행정요금 전력부문</b>: 요금 = 원가(T*)에 전가율 ρ·시차·묶음조정·래칫을 건 경로. 미회수분은 전력부문 차입으로 쌓인다(MFMod 전력 논문에 공기업 재정 블록이 없어 직접 설계).</li>
          <li><b className="strong">K-GX 정책금융 부문</b>: 대출·출자·보증(장부 밖), 기대손실, 보증료, 이차보전, 정부 출자. 정책금융채는 은행이 보유. 추가성 계수로 &apos;공급 ≠ 동원 ≠ 추가성&apos;을 분리.</li>
          <li><b className="strong">K-ETS 경계</b>: 상한 경직(워터베드: KAU 상승, 타 업체 감축, K-MSR 상한 누출)과 수용(ITMO 구매·국내감축 보조 γ = 1 − KAU/MAC).</li>
          <li><b className="strong">적응적 물가목표(AIT)</b>: Barmes 외(2024)에 산식이 없어 밴드·기간평균 형태는 자체 설계(밴드 ≤2pp, 기간 2→3년+만 문헌).</li>
          <li><b className="strong">재정준칙 두 형태</b>: 채무준칙(녹색 포함 삭감) vs 적응형(녹색 보호) — Pereira da Silva(2025)의 문제의식을 실험 형태로.</li>
        </ul></div>
      </Section>
    </>
  );
}

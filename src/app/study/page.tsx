"use client";
import { Tex } from "@/components/Tex";
import { PageHeader, Section } from "@/components/UI";
import { SECTORS, type Instrument, type Sector } from "@/engine/model.ts";
import { useI18n } from "@/lib/i18n";

const HOLD: Record<Instrument, [Sector[], Sector[]]> = {
  Cash: [["HH"], ["CB"]], Res: [["BK"], ["CB"]], Dep: [["HH", "NFC", "PS", "ROW"], ["BK"]], Ln_nfc: [["BK"], ["NFC"]], Ln_ps: [["BK"], ["PS"]],
  Ln_hh: [["BK"], ["HH"]], PBL: [["PB"], ["NFC", "PS"]], PBE: [["PB"], ["NFC", "PS"]], PBB: [["BK"], ["PB"]], Bond: [["HH", "BK", "CB", "ROW"], ["GOV"]],
  Adv: [["CB"], ["BK"]], FXR: [["CB"], ["ROW"]],
};
const RESID: Partial<Record<Instrument, [string, string]>> = { Dep: ["가계 예금 = 잔차", "Household deposits = residual"], Ln_nfc: ["기업 자금부족의 잔차", "Residual of firms' financing gap"], Ln_ps: ["전력부문 자금부족의 잔차(요금 이연 포함)", "Residual of power-sector financing gap (incl. tariff deferral)"], PBB: ["정책금융 자산 − 자본", "Policy-bank assets − equity"], Bond: ["정부 순차입의 잔차 / 한은 보유 = 잔차", "Residual of government net borrowing / BOK holdings = residual"], Adv: ["은행 대차의 잔차", "Residual of the bank balance sheet"] };

export default function Study() {
  const i = useI18n();
  const t = i.t;
  return (
    <>
      <PageHeader n="02" eyebrow={t("방법론 스터디", "Methodology")} title={t("방법론 스터디", "Methodology study")}>
        {t("연구 설계의 2층 구조(전력·배출·재정 원장 + E-SFC)를 다섯 개 참조모형의 어떤 식으로 구현했는지 정리했다. 식 번호는 원문 기준이고, '구현'은 이 도구의 연간 축약형이다. 어떤 모형도 최종 선택으로 승인된 것은 아니다.",
          "How the two-layer research design (power · emissions · fiscal ledger + E-SFC) is implemented with equations from the five reference models. Equation numbers follow the originals; 'implementation' is this tool's annual reduced form. No model has been approved as the final choice.")}
      </PageHeader>

      <Section title={t("연구 설계 Step 1–4와 도구의 대응", "Research design Steps 1–4 and the tool")}>
        <div className="table-wrap"><table>
          <thead><tr><th>{t("단계", "Step")}</th><th>{t("연구 설계", "Research design")}</th><th>{t("도구", "Tool")}</th></tr></thead>
          <tbody>{i.steps.map((s) => <tr key={s.step}><td className="strong" style={{ whiteSpace: "nowrap" }}>{s.step}</td><td>{s.proposal}</td><td>{s.tool}</td></tr>)}</tbody>
        </table></div>
      </Section>

      <Section title={t("대차대조표 구조와 폐쇄(closure)", "Balance-sheet structure and closure")} sub={t("+ 자산 보유 / − 발행(부채)", "+ held as asset / − issued (liability)")}>
        <div className="table-wrap"><table>
          <thead><tr><th>{t("상품", "Instrument")}</th>{SECTORS.map((s) => <th key={s} style={{ textAlign: "center" }}>{i.sector(s)}</th>)}<th>{t("결정 방식", "Determined by")}</th></tr></thead>
          <tbody>{(Object.keys(HOLD) as Instrument[]).map((k) => (
            <tr key={k}><td className="strong" style={{ whiteSpace: "nowrap" }}>{i.instr(k)}</td>
              {SECTORS.map((s) => <td key={s} style={{ textAlign: "center" }}>{HOLD[k][0].includes(s) ? <span className="sign asset">+</span> : HOLD[k][1].includes(s) ? <span className="sign liab">−</span> : ""}</td>)}
              <td className="small">{RESID[k] ? t(RESID[k]![0], RESID[k]![1]) : t("행태식/고정비율", "Behavioural / fixed ratio")}</td></tr>
          ))}</tbody>
        </table></div>
        <p className="note">{t("시점: 금리·물가는 전기 값(DEFINE 관례)으로 결정되고, 소비는 전기 가처분소득·순자산, 투자는 전기 가동률·이윤율·당기 실질금리에 반응한다. 그래서 기간 내 동시성 없이 명시적으로 풀린다. 잉여식(국채 보유 합 = 발행)은 계산에 쓰지 않고 검사에만 쓴다.", "Timing: rates and prices are set from lagged values (DEFINE convention); consumption responds to lagged disposable income and wealth, investment to lagged utilisation and profit rate and the current real rate. The model therefore solves explicitly with no within-period simultaneity. The redundant equation (bond holdings = issuance) is never used in the solution, only checked.")}</p>
      </Section>

      {i.models.map((m, n) => (
        <Section key={m.key} title={`${n + 1}. ${m.title}`} sub={m.key}>
          <div className="card study-card">
            <div className="small muted">{m.cite} · <a href={m.url} target="_blank" rel="noreferrer">{t("원문 PDF", "Original PDF")}</a></div>
            <p className="role"><b className="strong">{t("역할", "Role")}</b> {m.role}</p>
            <div className="grid g2">
              <div><h4>{t("가져온 것", "Adopted")}</h4><ul>{m.adopt.map((a) => <li key={a}>{a}</li>)}</ul></div>
              <div><h4>{t("뺀 것·바꾼 것", "Left out · changed")}</h4><ul>{m.omit.map((a) => <li key={a}>{a}</li>)}</ul></div>
            </div>
            <div className="table-wrap"><table>
              <thead><tr><th style={{ width: 90 }}>{t("식", "Eq.")}</th><th>{t("원문", "Original")}</th><th style={{ width: 70 }}>{t("쪽", "Page")}</th><th>{t("이 도구의 구현", "Implementation here")}</th></tr></thead>
              <tbody>{m.eqs.map((e) => <tr key={e.id}><td className="strong">{e.id}</td><td style={{ fontSize: 15 }}><Tex tex={e.tex} /></td><td className="small">{e.ref}</td><td className="small">{e.impl}</td></tr>)}</tbody>
            </table></div>
          </div>
        </Section>
      ))}

      <Section title={t("한국형으로 추가한 것", "Added for Korea")} sub={t("참조모형에 없음", "Not in the reference models")}>
        <div className="card"><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.75 }}>
          {[
            [t("행정요금 전력부문", "Administered-tariff power sector"), t("요금 = 원가(T*)에 전가율 ρ·시차·묶음조정·래칫을 건 경로. 미회수분은 전력부문 차입으로 쌓인다(MFMod 전력 논문에 공기업 재정 블록이 없어 직접 설계).", "Tariff follows cost (T*) with pass-through ρ, lag, bunched steps and a ratchet; unrecovered cost accumulates as power-sector borrowing (designed from scratch, since the MFMod power paper has no state-utility fiscal block).")],
            [t("K-GX 정책금융 부문", "K-GX policy finance sector"), t("대출·출자·보증(장부 밖), 기대손실, 보증료, 이차보전, 정부 출자. 정책금융채는 은행이 보유. 추가성 계수로 '공급 ≠ 동원 ≠ 추가성'을 분리.", "Loans, equity, guarantees (off balance sheet), expected losses, guarantee fees, interest subsidies, government equity injections. Policy-bank bonds are held by banks. Additionality coefficients separate supply ≠ mobilisation ≠ additionality.")],
            [t("K-ETS 경계", "K-ETS boundary"), t("상한 경직(워터베드: KAU 상승, 타 업체 감축, K-MSR 상한 누출)과 수용(ITMO 구매·국내감축 보조 γ = 1 − KAU/MAC).", "Rigid cap (waterbed: higher KAU, abatement by other firms, leakage above the K-MSR ceiling) vs accommodating cap (ITMO purchases · domestic abatement subsidy γ = 1 − KAU/MAC).")],
            [t("적응적 물가목표(AIT)", "Adaptive inflation targeting (AIT)"), t("Barmes 외(2024)에 산식이 없어 밴드·기간평균 형태는 자체 설계(밴드 ≤2pp, 기간 2→3년+만 문헌).", "Barmes et al. (2024) give no formula, so the band and averaging form is our own (only band ≤ 2pp and horizon 2 → 3+ years come from the literature).")],
            [t("재정준칙 두 형태", "Two fiscal-rule forms"), t("채무준칙(녹색 포함 삭감) vs 적응형(녹색 보호) — Pereira da Silva(2025)의 문제의식을 실험 형태로.", "Debt rule (cuts green too) vs adaptive rule (protects green) — Pereira da Silva (2025)'s concern in testable form.")],
          ].map(([h, d]) => <li key={h}><b className="strong">{h}</b>: {d}</li>)}
        </ul></div>
      </Section>
    </>
  );
}

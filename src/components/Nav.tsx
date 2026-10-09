"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function Nav() {
  const path = usePathname();
  const { t, lang, setLang } = useI18n();
  const links: [string, string][] = [
    ["/", t("개요", "Overview")], ["/guide", t("쉽게 이해하기", "In plain words")], ["/study", t("방법론 스터디", "Methodology")], ["/lab", t("DEFINE-UK E-SFC 실험실", "DEFINE-UK E-SFC Lab")],
    ["/alignment", t("전력 × K-GX 정합 (Q1–Q5)", "Power × K-GX (Q1–Q5)")], ["/registry", t("파라미터·식 등록부", "Parameter registry")],
  ];
  return (
    <header className="topbar">
      <div className="in">
        <div className="brand"><b>K-GX E-SFC Policy Lab</b><span>{t("PLANiT Institute · Track B 연구용 · v0.1 실험판", "PLANiT Institute · Track B research · v0.1 experimental")}</span></div>
        <nav className="tabs">
          {links.map(([href, label]) => <Link key={href} href={href} className={path === href ? "on" : ""}>{label}</Link>)}
        </nav>
        <div className="lang" role="radiogroup" aria-label="Language">
          {(["ko", "en"] as const).map((l) => (
            <button key={l} role="radio" aria-checked={lang === l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l === "ko" ? "한국어" : "EN"}</button>
          ))}
        </div>
      </div>
    </header>
  );
}

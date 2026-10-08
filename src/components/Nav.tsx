"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const LINKS = [
  ["/", "개요"], ["/study", "방법론 스터디"], ["/lab", "DEFINE-UK E-SFC 실험실"], ["/alignment", "전력 × K-GX 정합 (Q1–Q5)"], ["/registry", "파라미터·식 등록부"],
];
export function Nav() {
  const path = usePathname();
  return (
    <nav className="tabs">
      {LINKS.map(([href, label]) => <Link key={href} href={href} className={path === href ? "on" : ""}>{label}</Link>)}
    </nav>
  );
}

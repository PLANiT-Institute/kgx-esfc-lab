import type { ReactNode } from "react";

export function PageHeader({ n, eyebrow, title, children }: { n: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="ph">
      <div className="eyebrow">{n} · {eyebrow}</div>
      <h1>{title}</h1>
      {children ? <p className="lead">{children}</p> : null}
    </div>
  );
}

export function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="sec">
      <div className="sec-h"><h2>{title}</h2>{sub ? <span className="sub">{sub}</span> : null}</div>
      {children}
    </section>
  );
}

export function GradeBadge({ g }: { g: string }) {
  return <span className={`grade ${g}`} title={`등급 ${g}`} aria-label={`등급 ${g}`}>{g}</span>;
}

export function SourceBadge({ kind }: { kind: "official" | "news" | "unverified" }) {
  const label = kind === "official" ? "공식" : kind === "news" ? "보도" : "? 미확인";
  return <span className={`src ${kind}`}>{label}</span>;
}

export function StatusBadge({ ok, children, sub }: { ok: boolean; children?: ReactNode; sub?: ReactNode }) {
  return (
    <span className={`status ${ok ? "ok" : "bad"}`}>
      {ok ? "✓" : "✕"} {children ?? (ok ? "정합" : "불일치")}
      {sub ? <span className="sub">{sub}</span> : null}
    </span>
  );
}

export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="callout">
      <span className="ic">!</span>
      <div><b>{title}</b>{children}</div>
    </div>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange, label }: {
  options: { v: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label?: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={o.v === value} className={o.v === value ? "on" : ""} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

export function QSection({ id, question, approach, children }: { id: string; question: string; approach: string; children: ReactNode }) {
  return (
    <section className="qsec" id={id.toLowerCase()}>
      <div className="qh"><span className="chip-q">{id}</span><h3>{question}</h3></div>
      <div className="how"><b>도구에서의 처리</b>{approach}</div>
      {children}
    </section>
  );
}

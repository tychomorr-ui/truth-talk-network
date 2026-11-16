import type { ReactNode } from "react";

export function SectionHeader({ number, eyebrow, title, description, action }: { number: string; eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="sectionHeader"><div className="sectionTitle"><p className="eyebrow"><span className="sectionNumber">{number}</span>{eyebrow}</p><h1>{title}</h1><p className="sectionDescription">{description}</p></div>{action ? <div className="sectionAction">{action}</div> : null}</header>;
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "good" | "warn" | "bad" | "neutral" | "live" }) {
  return <span className={`statusPill ${tone}`}>{children}</span>;
}

export function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return <label className={`field ${className}`}><span className="fieldLabel">{label}</span>{children}{hint ? <small className="fieldHint">{hint}</small> : null}</label>;
}

export function EmptyState({ index, title, description }: { index: string; title: string; description: string }) {
  return <div className="emptyState"><span className="emptyIndex">{index}</span><div><h2>{title}</h2><p>{description}</p></div></div>;
}

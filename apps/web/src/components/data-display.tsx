import { Badge, Card, CardContent, CardHeader, cn } from "@qida/ui";
import { AlertCircle, ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import type { ReactNode } from "react";

export function PageTitle({ title, description, actions }: { title: string; description: string; actions?: ReactNode | undefined }) {
  return <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p></div>{actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}</div>;
}

export function MetricCard({ label, value, detail, trend, tone = "neutral" }: { label: string; value: string; detail?: string | undefined; trend?: number | undefined; tone?: "neutral" | "success" | "warning" }) {
  return <Card className={cn(tone === "warning" && "border-amber-200 dark:border-amber-900", tone === "success" && "border-emerald-200 dark:border-emerald-900")}><CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><div className="mt-2 flex items-end justify-between gap-3"><p className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>{trend !== undefined ? <span className={cn("flex items-center text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-rose-600")}>{trend >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(trend).toFixed(1)}%</span> : null}</div>{detail ? <p className="mt-2 text-xs text-slate-500">{detail}</p> : null}</CardContent></Card>;
}

export function Panel({ title, description, actions, children, className }: { title: string; description?: string | undefined; actions?: ReactNode | undefined; children: ReactNode; className?: string | undefined }) {
  return <Card className={className}><CardHeader><div><h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>{description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}</div>{actions}</CardHeader>{children}</Card>;
}

export function EvidenceNotice({ level, children }: { level: "descriptive" | "attribution" | "causal" | "quality"; children: ReactNode }) {
  const labels = { descriptive: "Correlación descriptiva", attribution: "Atribución", causal: "Evidencia causal", quality: "Calidad de datos" };
  const tones = { descriptive: "info", attribution: "violet", causal: "warning", quality: "neutral" } as const;
  return <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900"><Info className="mt-0.5 size-4 shrink-0 text-slate-400" /><div><Badge tone={tones[level]}>{labels[level]}</Badge><p className="mt-2 leading-6 text-slate-600 dark:text-slate-300">{children}</p></div></div>;
}

export function Caveats({ items }: { items: string[] }) {
  if (!items.length) return null;
  return <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/40"><div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200"><AlertCircle className="size-4" />Limitaciones de lectura</div><ul className="mt-2 space-y-1 pl-6 text-sm text-amber-800 dark:text-amber-300">{items.map((item) => <li className="list-disc" key={item}>{item}</li>)}</ul></div>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "published" || status === "approved" || status === "healthy" || status === "completed" || status === "active" ? "success" : status === "rejected" || status === "critical" || status === "ineligible" ? "danger" : status === "pending_review" || status === "warning" || status === "constrained" ? "warning" : "neutral";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}

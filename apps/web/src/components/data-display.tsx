import { Badge, Card, CardContent, CardHeader, cn } from "@qida/ui";
import { AlertCircle, ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import type { ReactNode } from "react";

type MetricTone = "neutral" | "success" | "warning";
export type MetricItem = { id: string; label: string; value: string; detail?: string | undefined; trend?: number | undefined; tone?: MetricTone | undefined };

export function PageTitle({ title, eyebrow, actions }: { title: string; eyebrow?: string | undefined; actions?: ReactNode | undefined }) {
  return <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end" data-component-id="page-header"><div>{eyebrow ? <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p> : null}<h1 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950 dark:text-white">{title}</h1></div>{actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}</header>;
}

export function MetricCard({ label, value, detail, trend, tone = "neutral", componentId }: { label: string; value: string; detail?: string | undefined; trend?: number | undefined; tone?: MetricTone | undefined; componentId?: string | undefined }) {
  return <div className={cn("min-w-0 bg-white px-4 py-3.5 dark:bg-slate-900", tone === "warning" && "bg-amber-50/70 dark:bg-amber-950/30", tone === "success" && "bg-emerald-50/60 dark:bg-emerald-950/20")} data-component-id={componentId ?? "metric-card"}><p className="truncate text-xs font-medium text-slate-500">{label}</p><div className="mt-1 flex items-end justify-between gap-3"><p className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>{trend !== undefined ? <span className={cn("flex items-center text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-rose-600")}>{trend >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(trend).toFixed(1)}%</span> : null}</div>{detail ? <p className="mt-1 truncate text-xs text-slate-400">{detail}</p> : null}</div>;
}

export function MetricStrip({ items, columns = 4, componentId = "metric-strip" }: { items: MetricItem[]; columns?: 3 | 4 | 5; componentId?: string }) {
  const columnClasses = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" } as const;
  return <div className={cn("grid overflow-hidden rounded-xl border border-slate-200 bg-slate-200 gap-px sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800", columnClasses[columns])} data-component-id={componentId}>{items.map((item) => <MetricCard key={item.id} componentId={item.id} {...item} />)}</div>;
}

export function Panel({ title, description, actions, children, className, componentId }: { title: string; description?: string | undefined; actions?: ReactNode | undefined; children: ReactNode; className?: string | undefined; componentId?: string | undefined }) {
  return <Card className={className} data-component-id={componentId ?? "panel"}><CardHeader><div><h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>{description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}</div>{actions}</CardHeader>{children}</Card>;
}

export function SummaryCard({ label, value, detail, metrics, distribution, actions, componentId = "summary-card" }: {
  label: string;
  value: string;
  detail?: string;
  metrics: Array<{ id: string; label: string; value: string }>;
  distribution?: Array<{ id: string; value: number; color: string; label: string }>;
  actions?: ReactNode;
  componentId?: string;
}) {
  const total = distribution?.reduce((sum, item) => sum + Math.max(0, item.value), 0) ?? 0;
  return <Card className="h-full" data-component-id={componentId}><CardContent className="flex h-full flex-col p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">{value}</p>{detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}</div>{actions}</div>{distribution?.length && total > 0 ? <div className="mt-6"><div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-label="Distribución">{distribution.map((item) => <div key={item.id} title={`${item.label}: ${item.value}`} style={{ width: `${(Math.max(0, item.value) / total) * 100}%`, backgroundColor: item.color }} />)}</div></div> : null}<div className="mt-auto grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => <div key={metric.id} data-component-id={metric.id}><p className="text-xs text-slate-400">{metric.label}</p><p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{metric.value}</p></div>)}</div></CardContent></Card>;
}

export function EvidenceNotice({ level, children }: { level: "descriptive" | "attribution" | "causal" | "quality"; children: ReactNode }) {
  const labels = { descriptive: "Lectura descriptiva", attribution: "Atribución", causal: "Evidencia causal", quality: "Calidad de datos" };
  const tones = { descriptive: "info", attribution: "violet", causal: "warning", quality: "neutral" } as const;
  return <div className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400" data-component-id="evidence-notice"><Info className="mt-0.5 size-3.5 shrink-0" /><span><Badge className="mr-2" tone={tones[level]}>{labels[level]}</Badge>{children}</span></div>;
}

export function Caveats({ items }: { items: string[] }) {
  if (!items.length) return null;
  return <details className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/30" data-component-id="reading-limitations"><summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-amber-900 dark:text-amber-200"><AlertCircle className="size-4" />Limitaciones de lectura</summary><ul className="mt-2 space-y-1 pl-6 text-amber-800 dark:text-amber-300">{items.map((item) => <li className="list-disc" key={item}>{item}</li>)}</ul></details>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "published" || status === "approved" || status === "healthy" || status === "completed" || status === "active" || status === "mature" ? "success" : status === "rejected" || status === "critical" || status === "ineligible" || status === "error" ? "danger" : status === "pending_review" || status === "warning" || status === "constrained" || status === "attention" ? "warning" : "neutral";
  const labels: Record<string, string> = { active: "activo", ambiguous: "ambigua", approved: "aprobado", attention: "requiere atención", completed: "completado", confirmed: "confirmada", constrained: "restringido", critical: "crítico", draft: "borrador", eligible: "elegible", error: "error", healthy: "correcto", immature: "inmadura", ineligible: "no elegible", info: "informativo", mature: "madura", pending_review: "pendiente de revisión", published: "publicado", rejected: "rechazado", unlinked: "sin enlazar", warning: "aviso" };
  return <Badge tone={tone}>{labels[status] ?? status.replaceAll("_", " ")}</Badge>;
}

import { Badge, Card, CardContent, CardHeader, cn } from "@qida/ui";
import { AlertCircle, ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import type { ReactNode } from "react";

export function PageTitle({ title, actions }: { title: string; description?: string | undefined; actions?: ReactNode | undefined }) {
  return <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center"><h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1>{actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}</div>;
}

export function MetricCard({ label, value, detail, trend, tone = "neutral" }: { label: string; value: string; detail?: string | undefined; trend?: number | undefined; tone?: "neutral" | "success" | "warning" }) {
  return <Card className={cn("rounded-none border-0 shadow-none", tone === "warning" && "bg-amber-50/70 dark:bg-amber-950/30", tone === "success" && "bg-emerald-50/70 dark:bg-emerald-950/30")}><CardContent className="p-4"><p className="text-xs text-slate-500">{label}</p><div className="mt-1 flex items-end justify-between gap-3"><p className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>{trend !== undefined ? <span className={cn("flex items-center text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-rose-600")}>{trend >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(trend).toFixed(1)}%</span> : null}</div>{detail ? <p className="mt-1 text-xs text-slate-400">{detail}</p> : null}</CardContent></Card>;
}

export function Panel({ title, description, actions, children, className }: { title: string; description?: string | undefined; actions?: ReactNode | undefined; children: ReactNode; className?: string | undefined }) {
  return <Card className={className}><CardHeader><div><h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>{description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}</div>{actions}</CardHeader>{children}</Card>;
}

export function EvidenceNotice({ level, children }: { level: "descriptive" | "attribution" | "causal" | "quality"; children: ReactNode }) {
  const labels = { descriptive: "Correlación descriptiva", attribution: "Atribución", causal: "Evidencia causal", quality: "Calidad de datos" };
  const tones = { descriptive: "info", attribution: "violet", causal: "warning", quality: "neutral" } as const;
  return <div className="flex items-center gap-2 border-l-2 border-slate-300 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"><Info className="size-3.5 shrink-0" /><Badge tone={tones[level]}>{labels[level]}</Badge><span>{children}</span></div>;
}

export function Caveats({ items }: { items: string[] }) {
  if (!items.length) return null;
  return <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/40"><div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200"><AlertCircle className="size-4" />Limitaciones de lectura</div><ul className="mt-2 space-y-1 pl-6 text-sm text-amber-800 dark:text-amber-300">{items.map((item) => <li className="list-disc" key={item}>{item}</li>)}</ul></div>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "published" || status === "approved" || status === "healthy" || status === "completed" || status === "active" || status === "mature" ? "success" : status === "rejected" || status === "critical" || status === "ineligible" ? "danger" : status === "pending_review" || status === "warning" || status === "constrained" ? "warning" : "neutral";
  const labels: Record<string, string> = { active: "activo", ambiguous: "ambigua", approved: "aprobado", completed: "completado", confirmed: "confirmada", constrained: "restringido", critical: "crítico", draft: "borrador", eligible: "elegible", healthy: "correcto", immature: "inmadura", ineligible: "no elegible", mature: "madura", pending_review: "pendiente de revisión", published: "publicado", rejected: "rechazado", unlinked: "sin enlazar", warning: "aviso" };
  return <Badge tone={tone}>{labels[status] ?? status.replaceAll("_", " ")}</Badge>;
}

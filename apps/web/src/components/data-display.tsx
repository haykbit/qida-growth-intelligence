import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@qida/ui";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CircleHelp,
  Code2,
  RotateCcw,
} from "lucide-react";
import { useState, type ReactNode } from "react";

type MetricTone = "neutral" | "success" | "warning";
export type MetricItem = {
  id: string;
  label: string;
  value: string;
  detail?: string | undefined;
  definition?: string | undefined;
  trend?: number | undefined;
  tone?: MetricTone | undefined;
};

function MetricHelp({
  label,
  definition,
}: {
  label: string;
  definition: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={`Definición de ${label}`}
          className="grid size-6 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          type="button"
        >
          <CircleHelp className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function PageTitle({
  title,
  eyebrow,
  actions,
}: {
  title: string;
  eyebrow?: string | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <header
      className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"
      data-component-id="page-header"
    >
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950">
          {title}
        </h1>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  definition,
  trend,
  tone = "neutral",
  componentId,
}: {
  label: string;
  value: string;
  detail?: string | undefined;
  definition?: string | undefined;
  trend?: number | undefined;
  tone?: MetricTone | undefined;
  componentId?: string | undefined;
}) {
  const help =
    definition ??
    (detail
      ? `${detail}. Valor calculado con los datos y filtros seleccionados.`
      : "Valor calculado con los datos y filtros seleccionados.");
  return (
    <div
      className={cn(
        "min-w-0 bg-white px-4 py-3.5",
        tone === "warning" && "bg-amber-50/70",
        tone === "success" && "bg-emerald-50/60",
      )}
      data-component-id={componentId ?? "metric-card"}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <MetricHelp definition={help} label={label} />
      </div>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="tabular truncate text-2xl font-semibold tracking-[-0.035em] text-slate-950">
          {value}
        </p>
        {trend !== undefined ? (
          <span
            className={cn(
              "flex items-center text-xs font-medium",
              trend >= 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </span>
        ) : null}
      </div>
      {detail ? (
        <p className="mt-1 truncate text-xs text-slate-400">{detail}</p>
      ) : null}
    </div>
  );
}

export function MetricStrip({
  items,
  columns = 4,
  componentId = "metric-strip",
}: {
  items: MetricItem[];
  columns?: 3 | 4 | 5;
  componentId?: string;
}) {
  const columnClasses = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
  } as const;
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-xl border border-slate-200 bg-slate-200 gap-px sm:grid-cols-2",
        columnClasses[columns],
      )}
      data-component-id={componentId}
    >
      {items.map((item) => (
        <MetricCard key={item.id} componentId={item.id} {...item} />
      ))}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  componentId,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  componentId?: string | undefined;
}) {
  return (
    <Card className={className} data-component-id={componentId ?? "panel"}>
      <CardHeader>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
        {actions}
      </CardHeader>
      {children}
    </Card>
  );
}

export function ExplainablePanel({
  title,
  description,
  explanation,
  query,
  queryExplanation,
  actions,
  children,
  className,
  componentId,
}: {
  title: string;
  description: string;
  explanation: string;
  query: string;
  queryExplanation: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  componentId?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const technicalButton = (
    <button
      className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      type="button"
      onClick={() => setFlipped(true)}
    >
      <Code2 className="size-3.5" />
      Ver SQL
    </button>
  );
  return (
    <div
      className={cn("flip-surface", className)}
      data-flipped={flipped}
      data-component-id={componentId}
    >
      <div className="flip-surface__inner">
        <div className="flip-surface__face" aria-hidden={flipped}>
          <Panel
            title={title}
            description={description}
            actions={
              <div className="flex items-center gap-2">
                {actions}
                {technicalButton}
              </div>
            }
            className="h-full overflow-hidden"
          >
            {children}
            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs leading-5 text-slate-600">
              <strong className="font-semibold text-slate-800">
                Qué estás viendo:
              </strong>{" "}
              {explanation}
            </div>
          </Panel>
        </div>
        <Card
          className="flip-surface__face flip-surface__back flex h-full flex-col overflow-hidden border-rose-200 bg-slate-950 text-white"
          aria-hidden={!flipped}
        >
          <CardHeader className="border-b border-white/10">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-rose-300">
                Vista técnica
              </p>
              <h2 className="mt-1 text-base font-semibold">{title}</h2>
            </div>
            <button
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-xs font-medium text-white hover:bg-white/10"
              type="button"
              onClick={() => setFlipped(false)}
            >
              <RotateCcw className="size-3.5" />
              Volver
            </button>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-rose-300">
                Qué responde
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {explanation}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-300">
                Cómo se interpreta
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {queryExplanation}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-rose-300">
                SQL de referencia
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/25 p-4 font-mono text-[11px] leading-5 text-slate-200">
                <code>{query}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SummaryCard({
  label,
  value,
  detail,
  metrics,
  distribution,
  actions,
  componentId = "summary-card",
}: {
  label: string;
  value: string;
  detail?: string;
  metrics: Array<{
    id: string;
    label: string;
    value: string;
    detail?: string;
    definition?: string;
  }>;
  distribution?: Array<{
    id: string;
    value: number;
    color: string;
    label: string;
  }>;
  actions?: ReactNode;
  componentId?: string;
}) {
  const total =
    distribution?.reduce((sum, item) => sum + Math.max(0, item.value), 0) ?? 0;
  return (
    <Card className="h-full" data-component-id={componentId}>
      <CardContent className="summary-card-content grid h-full items-stretch gap-5 p-5 sm:p-6 lg:grid-cols-[1.2fr_3fr] lg:gap-6">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <MetricHelp
                definition={detail ?? `${label} para los filtros activos.`}
                label={label}
              />
            </div>
            <p className="tabular mt-1 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
              {value}
            </p>
            {detail ? (
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                {detail}
              </p>
            ) : null}
          </div>
          {actions}
        </div>
        <div className="summary-card-metrics grid overflow-hidden rounded-lg border border-slate-200 bg-slate-200 gap-px sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} componentId={metric.id} {...metric} />
          ))}
        </div>
        {distribution?.length && total > 0 ? (
          <div className="lg:col-span-2">
            <div
              className="flex h-1.5 overflow-hidden rounded-full bg-slate-100"
              aria-label="Distribución"
            >
              {distribution.map((item) => (
                <div
                  key={item.id}
                  title={`${item.label}: ${item.value}`}
                  style={{
                    width: `${(Math.max(0, item.value) / total) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function Caveats({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <details
      className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm"
      data-component-id="reading-limitations"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-amber-900">
        <AlertCircle className="size-4" />
        Limitaciones de lectura
      </summary>
      <ul className="mt-2 space-y-1 pl-6 text-amber-800">
        {items.map((item) => (
          <li className="list-disc" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "published" ||
    status === "approved" ||
    status === "healthy" ||
    status === "completed" ||
    status === "active" ||
    status === "mature"
      ? "success"
      : status === "rejected" ||
          status === "critical" ||
          status === "ineligible" ||
          status === "error"
        ? "danger"
        : status === "pending_review" ||
            status === "warning" ||
            status === "constrained" ||
            status === "attention"
          ? "warning"
          : "neutral";
  const labels: Record<string, string> = {
    active: "activo",
    ambiguous: "ambigua",
    approved: "aprobado",
    attention: "requiere atención",
    cancelled: "cancelado",
    completed: "completado",
    confirmed: "confirmada",
    constrained: "restringido",
    critical: "crítico",
    discarded: "descartado",
    draft: "borrador",
    eligible: "elegible",
    error: "error",
    healthy: "correcto",
    immature: "seguimiento pendiente",
    ineligible: "no elegible",
    info: "informativo",
    mature: "seguimiento completo",
    open: "abierto",
    pending_review: "pendiente de revisión",
    published: "publicado",
    rejected: "rechazado",
    running: "en curso",
    sql: "SQL",
    unlinked: "sin enlazar",
    warning: "aviso",
  };
  return (
    <Badge tone={tone}>{labels[status] ?? status.replaceAll("_", " ")}</Badge>
  );
}

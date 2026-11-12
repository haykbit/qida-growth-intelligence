import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Badge, Button, CardContent } from "@qida/ui";
import { ArrowLeft, CheckCircle2, Gauge, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TablePagination, TanStackDataTable } from "../components/data-table";
import { EvidenceNotice, MetricStrip, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type OpportunityRowData } from "../lib/api";
import { integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

const column = createColumnHelper<OpportunityRowData>();
const columns = [
  column.accessor("municipality", { header: "Municipio", cell: (info) => <div><Link className="font-medium text-slate-950 hover:underline dark:text-white" to={`/opportunities/${info.row.original.municipalityId}/${encodeURIComponent(info.row.original.service)}`}>{info.getValue()}</Link><p className="text-xs text-slate-400">{info.row.original.province}</p></div> }),
  column.accessor("service", { header: "Servicio" }),
  column.accessor("monthlySearches", { header: "Búsquedas/mes", cell: (info) => integer.format(info.getValue()) }),
  column.accessor("sql", { header: "SQL" }),
  column.accessor("altas", { header: "Altas" }),
  column.accessor("sqlToAlta", { header: "SQL → alta", cell: (info) => percent.format(info.getValue()) }),
  column.accessor("caregiversAvailable", { header: "Cuidadoras" }),
  column.accessor("eligibility", { header: "Estado", cell: (info) => <StatusBadge status={info.getValue()} /> }),
  column.accessor("score", { header: "Score de regla", cell: (info) => <span className="font-semibold">{integer.format(info.getValue())}</span> }),
];

function signedContribution(value: number): string {
  if (value > 0) return `+${value.toFixed(1)}`;
  if (value < 0) return value.toFixed(1);
  return "0,0";
}

export function OpportunitiesPage() {
  const { filters } = useFilters();
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["opportunities", filters, page], queryFn: () => api.opportunities(filters, page) });
  const table = useReactTable({ data: query.data?.items ?? [], columns, getCoreRowModel: getCoreRowModel() });
  if (query.isLoading) return <LoadingState cards={0} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const data = query.data;

  return <div className="page-grid"><PageTitle title="Oportunidades" /><EvidenceNotice level="descriptive">El score ordena reglas de negocio; no es una predicción.</EvidenceNotice><Panel title={data ? `${integer.format(data.total)} combinaciones municipio-servicio` : "Ranking"} componentId="opportunities-ranking"><TanStackDataTable table={table} /><TablePagination page={page} pageSize={data?.pageSize ?? 25} total={data?.total ?? 0} onPageChange={setPage} /></Panel></div>;
}

export function OpportunityDetailPage() {
  const { municipalityId = "", service = "" } = useParams();
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["opportunity", municipalityId, service, filters], queryFn: () => api.opportunity(municipalityId, decodeURIComponent(service), filters), enabled: Boolean(municipalityId && service) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;

  return <div className="page-grid"><PageTitle title={`${data.municipality} · ${data.service}`} actions={<Button asChild variant="secondary" size="sm"><Link to="/opportunities"><ArrowLeft className="size-4" />Volver</Link></Button>} /><MetricStrip columns={3} items={[
    { id: "opportunity-rule-score", label: "Score de regla", value: integer.format(data.score) },
    { id: "opportunity-searches", label: "Búsquedas mensuales", value: integer.format(data.monthlySearches) },
    { id: "opportunity-conversion", label: "SQL → alta observada", value: percent.format(data.sqlToAlta), detail: `${data.sql} SQL · ${data.altas} altas` },
  ]} /><div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]"><Panel title="Evidencia de las reglas" componentId="opportunity-rule-evidence"><CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">{data.factors.map((factor) => <div key={factor.key} className="flex items-start justify-between gap-5 px-5 py-4"><div><p className="text-sm font-medium">{factor.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{factor.evidence}</p></div><Badge tone={factor.contribution < 0 ? "warning" : "neutral"}>regla {signedContribution(factor.contribution)}</Badge></div>)}</CardContent></Panel><div className="space-y-4"><Panel title="Elegibilidad"><CardContent><StatusBadge status={data.eligibility} /><div className="mt-4 space-y-2">{data.constraints.length ? data.constraints.map((constraint) => <div key={constraint} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />{constraint}</div>) : <div className="flex gap-2 text-sm text-slate-600"><CheckCircle2 className="size-4 text-emerald-500" />Sin restricciones operativas detectadas.</div>}</div></CardContent></Panel><Panel title="Siguiente validación"><CardContent><div className="flex gap-3"><Sparkles className="size-5 shrink-0 text-brand-600" /><div><p className="text-sm font-medium">{data.proposedAction}</p><p className="mt-2 text-xs text-slate-500"><Gauge className="mr-1 inline size-3.5" />{data.validationMetric}</p></div></div></CardContent></Panel></div></div><EvidenceNotice level="descriptive">{data.disclaimer}</EvidenceNotice></div>;
}

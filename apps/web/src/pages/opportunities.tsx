import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Badge, Button, CardContent } from "@qida/ui";
import { ArrowLeft, ArrowRight, CheckCircle2, Gauge, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EvidenceNotice, MetricCard, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type OpportunityRowData } from "../lib/api";
import { integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

const column = createColumnHelper<OpportunityRowData>();
const columns = [
  column.accessor("municipality", { header: "Municipio", cell: (info) => <div><Link className="font-medium text-brand-700 hover:underline dark:text-brand-500" to={`/opportunities/${info.row.original.municipalityId}/${encodeURIComponent(info.row.original.service)}`}>{info.getValue()}</Link><p className="text-xs text-slate-400">{info.row.original.province}</p></div> }),
  column.accessor("service", { header: "Servicio" }),
  column.accessor("monthlySearches", { header: "Búsquedas/mes", cell: (info) => integer.format(info.getValue()) }),
  column.accessor("sql", { header: "SQL" }),
  column.accessor("altas", { header: "Altas" }),
  column.accessor("sqlToAlta", { header: "SQL → alta", cell: (info) => percent.format(info.getValue()) }),
  column.accessor("caregiversAvailable", { header: "Cuidadoras" }),
  column.accessor("eligibility", { header: "Estado", cell: (info) => <StatusBadge status={info.getValue()} /> }),
  column.accessor("score", { header: "Score de regla", cell: (info) => <span className="font-semibold">{integer.format(info.getValue())}</span> }),
];

export function OpportunitiesPage() {
  const { filters } = useFilters();
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["opportunities", filters, page], queryFn: () => api.opportunities(filters, page) });
  const table = useReactTable({ data: query.data?.items ?? [], columns, getCoreRowModel: getCoreRowModel() });
  if (query.isLoading) return <LoadingState cards={0} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const data = query.data;
  return <div className="page-grid"><PageTitle title="Oportunidades" /><EvidenceNotice level="descriptive">El score ordena reglas de negocio; no es una predicción.</EvidenceNotice><Panel title={data ? `${integer.format(data.total)} combinaciones municipio-servicio` : "Ranking"}><CardContent className="overflow-x-auto p-0">{table.getRowModel().rows.length ? <table className="data-table"><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table> : <EmptyState />}</CardContent>{data && data.total > data.pageSize ? <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm dark:border-slate-800"><span className="text-slate-500">{data.page} / {Math.ceil(data.total / data.pageSize)}</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ArrowLeft className="size-4" />Anterior</Button><Button variant="secondary" size="sm" disabled={page * data.pageSize >= data.total} onClick={() => setPage((value) => value + 1)}>Siguiente<ArrowRight className="size-4" /></Button></div></div> : null}</Panel></div>;
}

export function OpportunityDetailPage() {
  const { municipalityId = "", service = "" } = useParams();
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["opportunity", municipalityId, service, filters], queryFn: () => api.opportunity(municipalityId, decodeURIComponent(service), filters), enabled: Boolean(municipalityId && service) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;
  return <div className="page-grid"><PageTitle title={`${data.municipality} · ${data.service}`} actions={<Button asChild variant="secondary" size="sm"><Link to="/opportunities"><ArrowLeft className="size-4" />Volver</Link></Button>} /><div className="metric-grid"><MetricCard label="Score de regla" value={integer.format(data.score)} /><MetricCard label="Búsquedas mensuales" value={integer.format(data.monthlySearches)} /><MetricCard label="SQL → alta observada" value={percent.format(data.sqlToAlta)} detail={`${data.sql} SQL · ${data.altas} altas`} /></div><div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]"><Panel title="Evidencia de las reglas"><CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">{data.factors.map((factor) => <div key={factor.key} className="flex items-start justify-between gap-5 px-5 py-4"><div><p className="text-sm font-medium">{factor.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{factor.evidence}</p></div><Badge>regla +{factor.contribution.toFixed(1)}</Badge></div>)}</CardContent></Panel><div className="space-y-4"><Panel title="Elegibilidad"><CardContent><StatusBadge status={data.eligibility} /><div className="mt-4 space-y-2">{data.constraints.length ? data.constraints.map((constraint) => <div key={constraint} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />{constraint}</div>) : <div className="flex gap-2 text-sm text-slate-600"><CheckCircle2 className="size-4 text-emerald-500" />Sin restricciones operativas detectadas.</div>}</div></CardContent></Panel><Panel title="Siguiente validación"><CardContent><div className="flex gap-3"><Sparkles className="size-5 shrink-0 text-brand-600" /><div><p className="text-sm font-medium">{data.proposedAction}</p><p className="mt-2 text-xs text-slate-500"><Gauge className="mr-1 inline size-3.5" />{data.validationMetric}</p></div></div></CardContent></Panel></div></div><EvidenceNotice level="descriptive">{data.disclaimer}</EvidenceNotice></div>;
}

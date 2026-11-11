import { useQuery } from "@tanstack/react-query";
import { Badge, CardContent } from "@qida/ui";
import { Database, ShieldCheck, Table2 } from "lucide-react";
import { EvidenceNotice, PageTitle, Panel } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type WorkbenchData } from "../lib/api";
import { formatDateTime } from "../lib/format";

function QueryCard({ query, generatedAt }: { query: WorkbenchData["queries"][number]; generatedAt: string }) {
  const columns = [...new Set(query.resultRows.flatMap((row) => Object.keys(row)))];
  return <Panel title={query.title} description={query.objective} actions={<Badge tone="success"><ShieldCheck className="size-3" />Executed read-only</Badge>}><div className="grid gap-0 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"><div className="border-b border-slate-100 p-5 dark:border-slate-800 xl:border-b-0 xl:border-r"><div className="flex flex-wrap gap-1">{query.dataUsed.map((source) => <Badge key={source}><Database className="size-3" />{source}</Badge>)}</div><pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-200"><code>{query.sql}</code></pre><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[11px] font-medium uppercase text-slate-400">Interpretación</p><p className="mt-1 text-sm leading-5">{query.interpretation}</p></div><div className="rounded-lg bg-brand-50 p-3 dark:bg-brand-900/30"><p className="text-[11px] font-medium uppercase text-brand-700 dark:text-brand-300">Decisión recomendada</p><p className="mt-1 text-sm leading-5">{query.recommendedDecision}</p></div></div>{query.proposedExtensionsUsed.length ? <p className="mt-3 text-xs text-slate-500">Extensiones propuestas usadas: {query.proposedExtensionsUsed.join(", ")}</p> : null}</div><div className="min-w-0 p-5"><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-medium"><Table2 className="size-4 text-brand-600" />Resultado persistido</div><span className="text-xs text-slate-400">{query.resultRows.length} filas · {formatDateTime(generatedAt)}</span></div>{query.resultRows.length ? <div className="max-h-[430px] overflow-auto rounded-lg border border-slate-200 dark:border-slate-700"><table className="data-table min-w-max"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{query.resultRows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{String(row[column] ?? "—")}</td>)}</tr>)}</tbody></table></div> : <EmptyState title="Consulta sin filas" description="La consulta se ejecutó, pero no encontró datos para esta carga." />}</div></div></Panel>;
}

export function WorkbenchPage() {
  const query = useQuery({ queryKey: ["workbench"], queryFn: api.workbench });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  return <div className="page-grid"><PageTitle title="Analytics workbench" description="Tres consultas SQL auditables que convierten datos persistidos en decisiones de priorización, cohortes y calidad." /><EvidenceNotice level="quality">{query.data.warning} Modo de ejecución: {query.data.executionMode}.</EvidenceNotice>{query.data.queries.map((item) => <QueryCard key={item.id} query={item} generatedAt={query.data.generatedAt} />)}</div>;
}

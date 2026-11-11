import { useQuery } from "@tanstack/react-query";
import { Badge, CardContent } from "@qida/ui";
import { Clock3, Database } from "lucide-react";
import { Caveats, MetricCard, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api } from "../lib/api";
import { formatDateTime, integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

export function DataQualityPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["data-quality", filters], queryFn: () => api.dataQuality(filters) });
  if (query.isLoading) return <LoadingState cards={4} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;
  return <div className="page-grid"><PageTitle title="Calidad de datos" /><div className="metric-grid"><MetricCard label="Trazabilidad" value={percent.format(data.identity.traceabilityCoverage)} /><MetricCard label="Eventos sin identidad" value={integer.format(data.identity.unlinkedEvents)} tone={data.identity.unlinkedEvents ? "warning" : "success"} /><MetricCard label="Identidades ambiguas" value={integer.format(data.identity.ambiguousIdentities)} tone={data.identity.ambiguousIdentities ? "warning" : "success"} /><MetricCard label="Enlaces confirmados" value={integer.format(data.duplicates.confirmedLinks)} /></div><div className="grid gap-4 xl:grid-cols-2"><Panel title="Frescura"><CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">{data.freshness.map((source) => <div key={source.source} className="flex items-center justify-between gap-4 px-5 py-3"><div className="flex items-center gap-2"><Database className="size-4 text-slate-400" /><div><p className="text-sm font-medium">{source.source}</p><p className="mt-0.5 text-xs text-slate-500"><Clock3 className="mr-1 inline size-3" />{source.latestAt ? formatDateTime(source.latestAt) : "Sin carga"}</p></div></div><StatusBadge status={source.status} /></div>)}</CardContent></Panel><Panel title="Controles de integridad"><CardContent className="overflow-x-auto p-0"><table className="data-table"><thead><tr><th>Control</th><th>Fallos</th><th>Severidad</th></tr></thead><tbody>{data.integrity.map((issue) => <tr key={issue.check}><td className="font-medium">{issue.check}</td><td>{integer.format(issue.failures)}</td><td><Badge tone={issue.severity === "error" ? "danger" : issue.severity === "warning" ? "warning" : "info"}>{issue.severity}</Badge></td></tr>)}</tbody></table></CardContent></Panel></div><Panel title="Campos incompletos"><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.missingness.map((item) => <div key={item.field}><div className="flex items-center justify-between text-sm"><span>{item.field}</span><span>{percent.format(item.rate)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, item.rate * 100)}%` }} /></div></div>)}</CardContent></Panel><Caveats items={data.limitations} /></div>;
}

import { useQuery } from "@tanstack/react-query";
import { CardContent } from "@qida/ui";
import { Clock3, Database } from "lucide-react";
import { DataTable, type DataColumn } from "../components/data-table";
import { Caveats, MetricStrip, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type DataQualityData } from "../lib/api";
import { formatDateTime, integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

type IntegrityRow = DataQualityData["integrity"][number];
const columns: Array<DataColumn<IntegrityRow>> = [
  { id: "check", header: "Control", cell: (row) => <span className="font-medium">{row.check}</span> },
  { id: "failures", header: "Fallos", cell: (row) => integer.format(row.failures), align: "right" },
  { id: "severity", header: "Severidad", cell: (row) => <StatusBadge status={row.severity} /> },
];

export function DataQualityPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["data-quality", filters], queryFn: () => api.dataQuality(filters) });
  if (query.isLoading) return <LoadingState cards={4} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;

  return <div className="page-grid">
    <PageTitle title="Calidad de datos" />
    <MetricStrip items={[
      { id: "quality-traceability", label: "Cobertura de trazabilidad de eventos", value: percent.format(data.identity.traceabilityCoverage) },
      { id: "quality-unlinked", label: "Eventos sin identidad enlazada", value: integer.format(data.identity.unlinkedEvents), tone: data.identity.unlinkedEvents ? "warning" : "success" },
      { id: "quality-ambiguous", label: "Identidades ambiguas", value: integer.format(data.identity.ambiguousIdentities), tone: data.identity.ambiguousIdentities ? "warning" : "success" },
      { id: "quality-confirmed", label: "Enlaces confirmados", value: integer.format(data.duplicates.confirmedLinks) },
    ]} />
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Frescura" componentId="quality-freshness"><CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">{data.freshness.map((source) => <div key={source.source} className="flex items-center justify-between gap-4 px-5 py-3"><div className="flex items-center gap-2"><Database className="size-4 text-slate-400" /><div><p className="text-sm font-medium">{source.source}</p><p className="mt-0.5 text-xs text-slate-500"><Clock3 className="mr-1 inline size-3" />{source.latestAt ? formatDateTime(source.latestAt) : "Sin carga"}</p></div></div><StatusBadge status={source.status} /></div>)}</CardContent></Panel>
      <Panel title="Controles de integridad" componentId="quality-integrity-table"><DataTable rows={data.integrity} columns={columns} rowKey={(row) => row.check} minWidth="min-w-[420px]" /></Panel>
    </div>
    <Panel title="Campos incompletos" componentId="quality-missingness"><CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.missingness.map((item) => <div key={item.field}><div className="flex items-center justify-between text-sm"><span>{item.field}</span><span>{percent.format(item.rate)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, item.rate * 100)}%` }} /></div></div>)}</CardContent></Panel>
    <Caveats items={data.limitations} />
  </div>;
}

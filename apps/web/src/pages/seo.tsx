import { useQuery } from "@tanstack/react-query";
import { DataTable, type DataColumn } from "../components/data-table";
import { Caveats, EvidenceNotice, MetricStrip, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type SeoData } from "../lib/api";
import { decimal, integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

type SeoRow = SeoData["rows"][number];
const columns: Array<DataColumn<SeoRow>> = [
  { id: "origin", header: "Origen", cell: (row) => <span className="font-medium">{row.origin}</span> },
  { id: "status", header: "Estado", cell: (row) => <StatusBadge status={row.status} /> },
  { id: "landings", header: "Landings", cell: (row) => integer.format(row.landings), align: "right" },
  { id: "indexed", header: "Indexadas", cell: (row) => integer.format(row.indexed), align: "right" },
  { id: "impressions", header: "Impresiones", cell: (row) => integer.format(row.impressions), align: "right", hideBelow: "sm" },
  { id: "clicks", header: "Clics", cell: (row) => integer.format(row.clicks), align: "right", hideBelow: "md" },
  { id: "ctr", header: "CTR", cell: (row) => percent.format(row.ctr), align: "right" },
  { id: "position", header: "Posición", cell: (row) => row.averagePosition === null ? "—" : decimal.format(row.averagePosition), align: "right", hideBelow: "lg" },
];

export function SeoPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["seo", filters], queryFn: () => api.seo(filters) });
  if (query.isLoading) return <LoadingState cards={4} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const { rows, caveat } = query.data;
  const summary = rows.reduce((total, row) => ({ published: total.published + row.published, indexed: total.indexed + row.indexed, impressions: total.impressions + row.impressions, clicks: total.clicks + row.clicks }), { published: 0, indexed: 0, impressions: 0, clicks: 0 });

  return <div className="page-grid"><PageTitle title="SEO" /><MetricStrip items={[
    { id: "seo-published", label: "Publicadas", value: integer.format(summary.published) },
    { id: "seo-indexed", label: "Indexadas", value: integer.format(summary.indexed) },
    { id: "seo-impressions", label: "Impresiones", value: integer.format(summary.impressions) },
    { id: "seo-ctr", label: "CTR", value: summary.impressions ? percent.format(summary.clicks / summary.impressions) : "—", detail: `${integer.format(summary.clicks)} clics` },
  ]} /><Panel title="Rendimiento por origen y estado" componentId="seo-performance-table"><DataTable rows={rows} columns={columns} rowKey={(row) => `${row.origin}-${row.status}`} minWidth="min-w-[720px]" /></Panel><EvidenceNotice level="descriptive">La comparación por origen es descriptiva; no identifica el efecto de generar una landing.</EvidenceNotice><Caveats items={[caveat]} /></div>;
}

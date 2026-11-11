import { useQuery } from "@tanstack/react-query";
import { CardContent } from "@qida/ui";
import { Caveats, EvidenceNotice, MetricCard, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api } from "../lib/api";
import { decimal, integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

export function SeoPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["seo", filters], queryFn: () => api.seo(filters) });
  if (query.isLoading) return <LoadingState cards={4} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const { rows, caveat } = query.data;
  const summary = rows.reduce((total, row) => ({ published: total.published + row.published, indexed: total.indexed + row.indexed, impressions: total.impressions + row.impressions, clicks: total.clicks + row.clicks }), { published: 0, indexed: 0, impressions: 0, clicks: 0 });
  return <div className="page-grid"><PageTitle title="SEO" /><div className="metric-grid"><MetricCard label="Publicadas" value={integer.format(summary.published)} /><MetricCard label="Indexadas" value={integer.format(summary.indexed)} /><MetricCard label="Impresiones" value={integer.format(summary.impressions)} /><MetricCard label="CTR" value={summary.impressions ? percent.format(summary.clicks / summary.impressions) : "—"} detail={`${integer.format(summary.clicks)} clics`} /></div><Panel title="Rendimiento por origen y estado"><CardContent className="overflow-x-auto p-0"><table className="data-table"><thead><tr><th>Origen</th><th>Estado</th><th>Landings</th><th>Indexadas</th><th>Impresiones</th><th>Clics</th><th>CTR</th><th>Posición</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.origin}-${row.status}`}><td className="font-medium">{row.origin}</td><td><StatusBadge status={row.status} /></td><td>{row.landings}</td><td>{row.indexed}</td><td>{integer.format(row.impressions)}</td><td>{integer.format(row.clicks)}</td><td>{percent.format(row.ctr)}</td><td>{row.averagePosition === null ? "—" : decimal.format(row.averagePosition)}</td></tr>)}</tbody></table></CardContent></Panel><EvidenceNotice level="descriptive">La comparación por origen es descriptiva; no identifica el efecto de generar una landing.</EvidenceNotice><Caveats items={[caveat]} /></div>;
}

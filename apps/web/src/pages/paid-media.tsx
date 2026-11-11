import { useQuery } from "@tanstack/react-query";
import { CardContent } from "@qida/ui";
import { Caveats, MetricCard, PageTitle, Panel } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api } from "../lib/api";
import { currency, integer } from "../lib/format";
import { useFilters } from "../state/filters";

export function PaidMediaPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["ads", filters], queryFn: () => api.ads(filters) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const { rows, caveats } = query.data;
  const summary = rows.reduce((total, row) => ({ spend: total.spend + row.spend, impressions: total.impressions + row.impressions, clicks: total.clicks + row.clicks }), { spend: 0, impressions: 0, clicks: 0 });
  return <div className="page-grid"><PageTitle title="Medios de pago" /><div className="metric-grid"><MetricCard label="Inversión" value={currency.format(summary.spend)} /><MetricCard label="Impresiones" value={integer.format(summary.impressions)} /><MetricCard label="Clics" value={integer.format(summary.clicks)} detail={summary.clicks ? `CPC ${currency.format(summary.spend / summary.clicks)}` : undefined} /></div><Panel title="Campañas"><CardContent className="overflow-x-auto p-0"><table className="data-table"><thead><tr><th>Campaña</th><th>Plataforma</th><th>Municipio</th><th>Inversión</th><th>Impresiones</th><th>Clics</th><th>CPC</th><th>Conversiones plataforma</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.platform}-${row.campaign}-${row.municipalityId ?? "all"}`}><td className="font-medium">{row.campaign}{row.allocationWarning ? <p className="mt-1 max-w-56 text-xs text-amber-600">{row.allocationWarning}</p> : null}</td><td>{row.platform}</td><td>{row.municipalityId ?? "No segmentada"}</td><td>{currency.format(row.spend)}</td><td>{integer.format(row.impressions)}</td><td>{integer.format(row.clicks)}</td><td>{currency.format(row.cpc)}</td><td>{row.platformConversions}</td></tr>)}</tbody></table></CardContent></Panel><Caveats items={caveats} /></div>;
}

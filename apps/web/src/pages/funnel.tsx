import { useQuery } from "@tanstack/react-query";
import { CardContent } from "@qida/ui";
import { FunnelTrendChart } from "../components/charts";
import { Caveats, EvidenceNotice, MetricCard, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api } from "../lib/api";
import { decimal, integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

export function FunnelPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["funnels", filters], queryFn: () => api.funnels(filters) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;
  const summary = data.byChannel.reduce((total, row) => ({ leads: total.leads + row.leads, sql: total.sql + row.sql, altas: total.altas + row.altas }), { leads: 0, sql: 0, altas: 0 });
  const rowsWithAlta = data.byChannel.filter((row) => row.averageDaysToAlta !== null && row.altas > 0);
  const totalAltas = rowsWithAlta.reduce((sum, row) => sum + row.altas, 0);
  const daysToAlta = totalAltas ? rowsWithAlta.reduce((sum, row) => sum + (row.averageDaysToAlta ?? 0) * row.altas, 0) / totalAltas : null;
  const timeline = data.byCohort.map((row) => ({ period: row.name, leads: row.leads, sql: row.sql, altas: row.altas }));

  return <div className="page-grid"><PageTitle title="Embudo" /><div className="metric-grid"><MetricCard label="Lead → SQL observado" value={summary.leads ? percent.format(summary.sql / summary.leads) : "—"} detail={`${integer.format(summary.leads)} leads`} /><MetricCard label="SQL → alta observado" value={summary.sql ? percent.format(summary.altas / summary.sql) : "—"} detail={`${integer.format(summary.sql)} SQL`} /><MetricCard label="Días medios a alta" value={daysToAlta === null ? "—" : decimal.format(daysToAlta)} /></div><Panel title="Evolución por cohorte"><FunnelTrendChart data={timeline} /></Panel><Panel title="Cohortes"><CardContent className="overflow-x-auto p-0"><table className="data-table"><thead><tr><th>Cohorte</th><th>Leads</th><th>SQL</th><th>Altas</th><th>Lead → SQL</th><th>SQL → alta</th><th>Madurez</th></tr></thead><tbody>{data.byCohort.map((row) => <tr key={row.name}><td className="font-medium">{row.name}</td><td>{integer.format(row.leads)}</td><td>{integer.format(row.sql)}</td><td>{integer.format(row.altas)}</td><td>{percent.format(row.leadToSql)}</td><td>{percent.format(row.sqlToAlta)}</td><td><StatusBadge status={row.mature ? "mature" : "immature"} /></td></tr>)}</tbody></table></CardContent></Panel><EvidenceNotice level="descriptive">La tabla identifica qué cohortes están maduras; los contactos laborales están excluidos.</EvidenceNotice><Caveats items={data.caveats} /></div>;
}

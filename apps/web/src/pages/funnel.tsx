import { useQuery } from "@tanstack/react-query";
import { CardContent } from "@qida/ui";
import { BreakdownBarChart, ComparisonChart, DonutChart, FunnelTrendChart } from "../components/charts";
import { Caveats, EvidenceNotice, MetricCard, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api } from "../lib/api";
import { decimal, integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

export function FunnelPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["funnels", filters], queryFn: () => api.funnels(filters) });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;
  const summary = data.byChannel.reduce((total, row) => ({ leads: total.leads + row.leads, sql: total.sql + row.sql, altas: total.altas + row.altas }), { leads: 0, sql: 0, altas: 0 });
  const weightedDays = (field: "averageDaysToSql" | "averageDaysToAlta", weight: "sql" | "altas") => {
    const rows = data.byChannel.filter((row) => row[field] !== null && row[weight] > 0);
    const denominator = rows.reduce((sum, row) => sum + row[weight], 0);
    return denominator ? rows.reduce((sum, row) => sum + (row[field] ?? 0) * row[weight], 0) / denominator : null;
  };
  const daysToSql = weightedDays("averageDaysToSql", "sql");
  const daysToAlta = weightedDays("averageDaysToAlta", "altas");
  const timeline = data.byCohort.map((row) => ({ period: row.name, leads: row.leads, sql: row.sql, altas: row.altas }));
  return <div className="page-grid"><PageTitle title="Funnel analytics" description={`Conversión por cohorte elegible, canal, servicio y municipio. Ventana de madurez: ${data.maturityWindowDays} días.`} /><div className="metric-grid"><MetricCard label="Lead → SQL" value={summary.leads ? percent.format(summary.sql / summary.leads) : "—"} detail={`${integer.format(summary.leads)} leads elegibles`} /><MetricCard label="SQL → alta" value={summary.sql ? percent.format(summary.altas / summary.sql) : "—"} detail={`${integer.format(summary.sql)} SQL`} /><MetricCard label="Tiempo medio a SQL" value={daysToSql === null ? "—" : `${decimal.format(daysToSql)} d`} detail="Ponderado por SQL del canal" /><MetricCard label="Tiempo medio a alta" value={daysToAlta === null ? "—" : `${decimal.format(daysToAlta)} d`} detail="Ponderado por altas del canal" /></div><div className="chart-grid"><Panel title="Evolución temporal" description="Volúmenes por periodo de cohorte."><FunnelTrendChart data={timeline} /></Panel><Panel title="Funnel por canal"><ComparisonChart data={data.byChannel.map((row) => ({ name: row.name, leads: row.leads, sql: row.sql, altas: row.altas }))} keys={[{ key: "leads", label: "Leads", color: "#94a3b8" }, { key: "sql", label: "SQL", color: "#14b8a6" }, { key: "altas", label: "Altas", color: "#6366f1" }]} /></Panel><Panel title="SQL → alta por servicio"><BreakdownBarChart data={data.byService.map((row) => ({ name: row.name, value: row.sqlToAlta }))} valueName="Conversión" /></Panel><Panel title="Motivos de descarte"><DonutChart data={data.discardReasons} /></Panel></div><Panel title="Cohortes" description="Las cohortes inmaduras no deben compararse con cohortes completas."><CardContent className="overflow-x-auto p-0"><table className="data-table"><thead><tr><th>Cohorte</th><th>Leads</th><th>SQL</th><th>Altas</th><th>Lead → SQL</th><th>SQL → alta</th><th>Días a alta</th><th>Madurez</th></tr></thead><tbody>{data.byCohort.map((row) => <tr key={row.name}><td className="font-medium">{row.name}</td><td>{integer.format(row.leads)}</td><td>{integer.format(row.sql)}</td><td>{integer.format(row.altas)}</td><td>{percent.format(row.leadToSql)}</td><td>{percent.format(row.sqlToAlta)}</td><td>{row.averageDaysToAlta === null ? "—" : decimal.format(row.averageDaysToAlta)}</td><td><StatusBadge status={row.mature ? "completed" : "immature"} /></td></tr>)}</tbody></table></CardContent></Panel><EvidenceNotice level="descriptive">Los denominadores incluyen oportunidades de familia elegibles. Los contactos de cuidadoras buscando trabajo quedan excluidos.</EvidenceNotice><Caveats items={data.caveats} /></div>;
}

import { useQuery } from "@tanstack/react-query";
import { chartPalette, TrendChart } from "../components/charts";
import { DataTable, type DataColumn } from "../components/data-table";
import { Caveats, EvidenceNotice, MetricStrip, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type FunnelsData } from "../lib/api";
import { decimal, integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

type FunnelCohort = FunnelsData["byCohort"][number];
const columns: Array<DataColumn<FunnelCohort>> = [
  { id: "cohort", header: "Cohorte", cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: "leads", header: "Leads", cell: (row) => integer.format(row.leads), align: "right" },
  { id: "sql", header: "SQL", cell: (row) => integer.format(row.sql), align: "right" },
  { id: "altas", header: "Altas", cell: (row) => integer.format(row.altas), align: "right" },
  { id: "lead-sql", header: "Lead → SQL", cell: (row) => percent.format(row.leadToSql), align: "right", hideBelow: "sm" },
  { id: "sql-alta", header: "SQL → alta", cell: (row) => percent.format(row.sqlToAlta), align: "right", hideBelow: "md" },
  { id: "maturity", header: "Madurez", cell: (row) => <StatusBadge status={row.mature ? "mature" : "immature"} /> },
];

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

  return <div className="page-grid"><PageTitle title="Embudo" /><MetricStrip columns={3} items={[
    { id: "funnel-lead-sql", label: "Lead → SQL observado", value: summary.leads ? percent.format(summary.sql / summary.leads) : "—", detail: `${integer.format(summary.leads)} leads` },
    { id: "funnel-sql-alta", label: "SQL → alta observado", value: summary.sql ? percent.format(summary.altas / summary.sql) : "—", detail: `${integer.format(summary.sql)} SQL` },
    { id: "funnel-days-alta", label: "Días medios a alta", value: daysToAlta === null ? "—" : decimal.format(daysToAlta) },
  ]} /><Panel title="Evolución por cohorte" componentId="funnel-cohort-chart"><TrendChart data={timeline} xKey="period" series={[
    { key: "leads", label: "Leads", color: chartPalette.neutral },
    { key: "sql", label: "SQL", color: chartPalette.primary },
    { key: "altas", label: "Altas", color: chartPalette.tertiary },
  ]} /></Panel><Panel title="Cohortes" componentId="funnel-cohorts-table"><DataTable rows={data.byCohort} columns={columns} rowKey={(row) => row.name} minWidth="min-w-[680px]" /></Panel><EvidenceNotice level="descriptive">La tabla identifica qué cohortes están maduras; los contactos laborales están excluidos.</EvidenceNotice><Caveats items={data.caveats} /></div>;
}

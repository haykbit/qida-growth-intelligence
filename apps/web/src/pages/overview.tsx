import { useQuery } from "@tanstack/react-query";
import { Button } from "@qida/ui";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { chartPalette, TrendChart } from "../components/charts";
import { DataTable, type DataColumn } from "../components/data-table";
import { EvidenceNotice, PageTitle, Panel, StatusBadge, SummaryCard } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type OpportunityRowData } from "../lib/api";
import { integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

const opportunityColumns: Array<DataColumn<OpportunityRowData>> = [
  { id: "municipality", header: "Municipio", cell: (row) => <div><Link className="font-medium text-slate-950 hover:underline dark:text-white" to={`/opportunities/${row.municipalityId}/${encodeURIComponent(row.service)}`}>{row.municipality}</Link><p className="text-xs text-slate-400">{row.province}</p></div> },
  { id: "service", header: "Servicio", cell: (row) => row.service },
  { id: "eligibility", header: "Estado", cell: (row) => <StatusBadge status={row.eligibility} /> },
  { id: "sql", header: "SQL", cell: (row) => integer.format(row.sql), align: "right", hideBelow: "sm" },
  { id: "altas", header: "Altas", cell: (row) => integer.format(row.altas), align: "right", hideBelow: "md" },
  { id: "score", header: "Score de regla", cell: (row) => <span className="font-semibold">{integer.format(row.score)}</span>, align: "right" },
];

export function OverviewPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["overview", filters], queryFn: () => api.overview(filters) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;

  return <div className="page-grid"><PageTitle title="Resumen" /><div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]"><SummaryCard label="Leads observados" value={integer.format(data.kpis.leads)} detail="Oportunidades de familias en la selección activa" metrics={[
    { id: "summary-sql", label: "SQL", value: `${integer.format(data.kpis.sql)} · ${percent.format(data.kpis.leadToSql)}` },
    { id: "summary-altas", label: "Altas", value: `${integer.format(data.kpis.altas)} · ${percent.format(data.kpis.sqlToAlta)}` },
    { id: "summary-traceability", label: "Cobertura de trazabilidad", value: percent.format(data.kpis.traceabilityCoverage) },
    { id: "summary-opportunities", label: "Municipios oportunidad", value: integer.format(data.kpis.opportunityMunicipalities) },
  ]} /><Panel title="Evolución del embudo" componentId="overview-funnel-chart"><TrendChart data={data.monthlyFunnel} xKey="period" height="h-60" series={[
    { key: "leads", label: "Leads", color: chartPalette.neutral },
    { key: "sql", label: "SQL", color: chartPalette.primary },
    { key: "altas", label: "Altas", color: chartPalette.tertiary },
  ]} /></Panel></div><Panel title="Principales oportunidades" componentId="overview-opportunities-table" actions={<Button asChild variant="ghost" size="sm"><Link to="/opportunities">Ver todas<ArrowRight className="size-4" /></Link></Button>}><DataTable rows={data.opportunityRanking.slice(0, 6)} columns={opportunityColumns} rowKey={(row) => `${row.municipalityId}-${row.service}`} minWidth="min-w-[620px]" /></Panel><EvidenceNotice level="descriptive">El ranking aplica reglas versionadas; orienta qué validar y no predice resultados.</EvidenceNotice></div>;
}

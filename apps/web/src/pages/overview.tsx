import { useQuery } from "@tanstack/react-query";
import { Button, CardContent } from "@qida/ui";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BreakdownBarChart, FunnelTrendChart } from "../components/charts";
import { EvidenceNotice, MetricCard, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api } from "../lib/api";
import { integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

export function OverviewPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["overview", filters], queryFn: () => api.overview(filters) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;
  return <div className="page-grid"><PageTitle title="Resumen" /><div className="metric-grid"><MetricCard label="Leads" value={integer.format(data.kpis.leads)} /><MetricCard label="SQL" value={integer.format(data.kpis.sql)} detail={`${percent.format(data.kpis.leadToSql)} de leads`} /><MetricCard label="Altas" value={integer.format(data.kpis.altas)} detail={`${percent.format(data.kpis.sqlToAlta)} de SQL observados`} /><MetricCard label="Trazabilidad" value={percent.format(data.kpis.traceabilityCoverage)} /><MetricCard label="Oportunidades" value={integer.format(data.kpis.opportunityMunicipalities)} detail={`${data.kpis.capacityConstrainedMunicipalities} limitadas por capacidad`} /></div><div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]"><Panel title="Embudo mensual"><FunnelTrendChart data={data.monthlyFunnel} /></Panel><Panel title="Altas por municipio"><BreakdownBarChart data={data.altasByMunicipality.slice(0, 6)} valueName="Altas" /></Panel></div><Panel title="Principales oportunidades" actions={<Button asChild variant="ghost" size="sm"><Link to="/opportunities">Ver todas<ArrowRight className="size-4" /></Link></Button>}><CardContent className="overflow-x-auto p-0"><table className="data-table"><thead><tr><th>Municipio</th><th>Servicio</th><th>Estado</th><th>Score de regla</th></tr></thead><tbody>{data.opportunityRanking.slice(0, 5).map((row) => <tr key={`${row.municipalityId}-${row.service}`}><td><Link className="font-medium text-brand-700 hover:underline dark:text-brand-500" to={`/opportunities/${row.municipalityId}/${encodeURIComponent(row.service)}`}>{row.municipality}</Link><p className="text-xs text-slate-400">{row.province}</p></td><td>{row.service}</td><td><StatusBadge status={row.eligibility} /></td><td className="font-semibold">{integer.format(row.score)}</td></tr>)}</tbody></table></CardContent></Panel><EvidenceNotice level="descriptive">El ranking aplica reglas versionadas; orienta qué validar y no predice resultados.</EvidenceNotice></div>;
}

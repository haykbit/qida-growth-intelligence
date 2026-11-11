import { useQuery } from "@tanstack/react-query";
import { CardContent } from "@qida/ui";
import { Link } from "react-router-dom";
import { BreakdownBarChart, DonutChart, FunnelTrendChart } from "../components/charts";
import { Caveats, EvidenceNotice, MetricCard, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api } from "../lib/api";
import { currency, integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

export function OverviewPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["overview", filters], queryFn: () => api.overview(filters) });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const data = query.data;
  if (!data) return <EmptyState />;
  const metrics = [
    ["Leads", integer.format(data.kpis.leads), "Contactos de familia elegibles"], ["SQL", integer.format(data.kpis.sql), `${percent.format(data.kpis.leadToSql)} de los leads`], ["Altas", integer.format(data.kpis.altas), `${percent.format(data.kpis.sqlToAlta)} de SQL maduros`], ["Coste / SQL", currency.format(data.kpis.costPerSql), "Inversión atribuible"],
    ["Coste / alta atribuida", currency.format(data.kpis.costPerAttributedAlta), "Solo altas reconciliadas"], ["Trazabilidad", percent.format(data.kpis.traceabilityCoverage), "Eventos conectados a oportunidad"], ["Duplicados", integer.format(data.kpis.duplicates), "Leads vinculados de forma determinista"], ["Municipios oportunidad", integer.format(data.kpis.opportunityMunicipalities), `${integer.format(data.kpis.capacityConstrainedMunicipalities)} con capacidad limitada`],
  ] as const;
  return <div className="page-grid"><PageTitle title="Executive overview" description="Salud del funnel, eficiencia de adquisición y oportunidades locales con trazabilidad hasta los datos sintéticos persistidos." /><div className="metric-grid">{metrics.map(([label, value, detail]) => <MetricCard key={label} label={label} value={value} detail={detail} />)}</div><div className="chart-grid"><Panel title="Evolución del funnel" description="Cohortes mensuales; las altas se muestran cuando la cohorte es elegible."><FunnelTrendChart data={data.monthlyFunnel} /></Panel><Panel title="Altas por municipio" description="Municipios con más resultados en el periodo seleccionado."><BreakdownBarChart data={data.altasByMunicipality.slice(0, 8)} valueName="Altas" /></Panel><Panel title="Motivos de descarte" description="Distribución sobre oportunidades de familia; excluye contactos laborales."><DonutChart data={data.discardReasons} /></Panel><Panel title="Ranking de oportunidades" description="Score determinista, no una predicción validada."><CardContent className="overflow-x-auto p-0"><table className="data-table"><thead><tr><th>Municipio</th><th>Servicio</th><th>Elegibilidad</th><th>Score</th><th>Confianza</th></tr></thead><tbody>{data.opportunityRanking.slice(0, 7).map((row) => <tr key={`${row.municipalityId}-${row.service}`}><td><Link className="font-medium text-brand-700 hover:underline dark:text-brand-500" to={`/opportunities/${row.municipalityId}/${encodeURIComponent(row.service)}`}>{row.municipality}</Link><p className="text-xs text-slate-400">{row.province}</p></td><td>{row.service}</td><td><StatusBadge status={row.eligibility} /></td><td className="font-semibold">{integer.format(row.score)}</td><td>{percent.format(row.confidence)}</td></tr>)}</tbody></table></CardContent></Panel></div><EvidenceNotice level="descriptive">Las tendencias y rankings describen asociaciones observadas. El score de oportunidad aplica reglas versionadas y no estima una probabilidad validada de éxito.</EvidenceNotice><Caveats items={data.caveats} /></div>;
}

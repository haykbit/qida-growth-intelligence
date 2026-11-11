import { useQuery } from "@tanstack/react-query";
import { Badge, Button, CardContent } from "@qida/ui";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ExperimentLineChart } from "../components/charts";
import { EvidenceNotice, MetricCard, PageTitle, Panel } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api } from "../lib/api";
import { formatDate, integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

export function ExperimentsPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["experiments", filters], queryFn: () => api.experiments(filters) });
  if (query.isLoading) return <LoadingState cards={0} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  return <div className="page-grid"><PageTitle title="Experimentos" /><Panel title={query.data ? `${query.data.total} experimentos` : "Experimentos"}><CardContent className="overflow-x-auto p-0">{query.data?.items.length ? <table className="data-table"><thead><tr><th>Experimento</th><th>Fechas</th><th>Métrica</th><th>Grupos</th><th>Diferencia observada</th><th>Evidencia</th></tr></thead><tbody>{query.data.items.map((row) => <tr key={row.id}><td><Link className="font-medium text-brand-700 hover:underline dark:text-brand-500" to={`/experiments/${row.id}`}>{row.name}</Link></td><td className="whitespace-nowrap text-xs">{formatDate(row.startDate)}<br />{row.endDate ? formatDate(row.endDate) : "En curso"}</td><td>{row.primaryMetric}</td><td>{row.treatmentMunicipalities} / {row.controlMunicipalities}</td><td>{row.observedDifference === null ? "—" : percent.format(row.observedDifference)}</td><td><Badge tone={row.evidenceLevel === "quasi_experimental" ? "success" : "warning"}>{row.evidenceLevel.replaceAll("_", " ")}</Badge></td></tr>)}</tbody></table> : <EmptyState />}</CardContent></Panel><EvidenceNotice level="causal">Una diferencia observada no demuestra causalidad.</EvidenceNotice></div>;
}

export function ExperimentDetailPage() {
  const { experimentId = "" } = useParams();
  const query = useQuery({ queryKey: ["experiment", experimentId], queryFn: () => api.experiment(experimentId), enabled: Boolean(experimentId) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;
  const periods = [...new Set(data.series.map((row) => row.period))];
  const series = periods.map((period) => ({ period, control: data.series.find((row) => row.period === period && row.variant === "control")?.value ?? 0, treatment: data.series.find((row) => row.period === period && row.variant === "treatment")?.value ?? 0 }));
  return <div className="page-grid"><PageTitle title={data.name} actions={<Button asChild variant="secondary" size="sm"><Link to="/experiments"><ArrowLeft className="size-4" />Volver</Link></Button>} /><p className="max-w-3xl text-sm text-slate-500">{data.hypothesis}</p><div className="metric-grid"><MetricCard label="Diferencia observada" value={data.observedDifference === null ? "—" : percent.format(data.observedDifference)} /><MetricCard label="Difference-in-Differences" value={data.didEstimate === null ? "No calculable" : percent.format(data.didEstimate)} /><MetricCard label="Municipios" value={integer.format(data.assignments.length)} detail={`${data.treatmentMunicipalities} tratamiento · ${data.controlMunicipalities} control`} /></div><div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]"><Panel title="Serie observada"><ExperimentLineChart data={series} /></Panel><Panel title="Diagnósticos"><CardContent className="space-y-3"><div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-800"><div className="flex items-center gap-2 text-sm">{data.diagnostics.hasObservedDataInBothGroups ? <CheckCircle2 className="size-4 text-emerald-500" /> : <ShieldAlert className="size-4 text-amber-500" />}Datos en ambos grupos</div><Badge tone={data.diagnostics.hasObservedDataInBothGroups ? "success" : "warning"}>{data.diagnostics.hasObservedDataInBothGroups ? "Sí" : "No"}</Badge></div><div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800"><span className="text-slate-400">Tendencias paralelas</span><p className="mt-1 font-medium">No evaluadas</p></div>{data.limitations.map((item) => <p key={item} className="text-xs leading-5 text-slate-500">{item}</p>)}</CardContent></Panel></div><EvidenceNotice level="causal">{data.evidenceLevel === "quasi_experimental" ? "Lectura cuasi-experimental sujeta a los supuestos del diseño." : "Interpreta solo la diferencia observada."}</EvidenceNotice></div>;
}

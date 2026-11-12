import { useQuery } from "@tanstack/react-query";
import { Badge, Button, CardContent } from "@qida/ui";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { chartPalette, TrendChart } from "../components/charts";
import { DataTable, type DataColumn } from "../components/data-table";
import { EvidenceNotice, MetricStrip, PageTitle, Panel } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type ExperimentSummaryData } from "../lib/api";
import { formatDate, integer, percent } from "../lib/format";
import { useFilters } from "../state/filters";

const columns: Array<DataColumn<ExperimentSummaryData>> = [
  { id: "name", header: "Experimento", cell: (row) => <Link className="font-medium text-slate-950 hover:underline dark:text-white" to={`/experiments/${row.id}`}>{row.name}</Link> },
  { id: "dates", header: "Fechas", cell: (row) => <span className="whitespace-nowrap text-xs">{formatDate(row.startDate)}<br />{row.endDate ? formatDate(row.endDate) : "En curso"}</span> },
  { id: "metric", header: "Métrica", cell: (row) => row.primaryMetric, hideBelow: "md" },
  { id: "groups", header: "Grupos", cell: (row) => `${row.treatmentMunicipalities} / ${row.controlMunicipalities}`, align: "right", hideBelow: "sm" },
  { id: "difference", header: "Diferencia observada", cell: (row) => row.observedDifference === null ? "—" : percent.format(row.observedDifference), align: "right" },
  { id: "evidence", header: "Evidencia", cell: (row) => <Badge tone={row.evidenceLevel === "quasi_experimental" ? "success" : "warning"}>{row.evidenceLevel === "quasi_experimental" ? "cuasi-experimental" : "descriptiva"}</Badge> },
];

export function ExperimentsPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["experiments", filters], queryFn: () => api.experiments(filters) });
  if (query.isLoading) return <LoadingState cards={0} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const rows = query.data?.items ?? [];
  return <div className="page-grid"><PageTitle title="Experimentos" /><Panel title={query.data ? `${query.data.total} experimentos` : "Experimentos"} componentId="experiments-table"><DataTable rows={rows} columns={columns} rowKey={(row) => row.id} minWidth="min-w-[700px]" /></Panel><EvidenceNotice level="causal">Una diferencia observada no demuestra causalidad.</EvidenceNotice></div>;
}

export function ExperimentDetailPage() {
  const { experimentId = "" } = useParams();
  const query = useQuery({ queryKey: ["experiment", experimentId], queryFn: () => api.experiment(experimentId), enabled: Boolean(experimentId) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;
  const periods = [...new Set(data.series.map((row) => row.period))];
  const series = periods.map((period) => {
    const control = data.series.find((row) => row.period === period && row.variant === "control");
    const treatment = data.series.find((row) => row.period === period && row.variant === "treatment");
    return { period, control: control?.value ?? null, treatment: treatment?.value ?? null };
  });
  const samples = data.series.reduce((totals, row) => ({ ...totals, [row.variant]: (totals[row.variant] ?? 0) + row.sampleSize }), {} as Record<string, number>);

  return <div className="page-grid"><PageTitle title={data.name} actions={<Button asChild variant="secondary" size="sm"><Link to="/experiments"><ArrowLeft className="size-4" />Volver</Link></Button>} /><p className="max-w-3xl text-sm text-slate-500">{data.hypothesis}</p><MetricStrip columns={3} items={[
    { id: "experiment-difference", label: "Diferencia observada", value: data.observedDifference === null ? "—" : percent.format(data.observedDifference) },
    { id: "experiment-did", label: "Difference-in-Differences", value: data.didEstimate === null ? "No calculable" : percent.format(data.didEstimate) },
    { id: "experiment-sample", label: "Tamaño muestral", value: integer.format((samples.treatment ?? 0) + (samples.control ?? 0)), detail: `${integer.format(samples.treatment ?? 0)} tratamiento · ${integer.format(samples.control ?? 0)} control` },
  ]} /><div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]"><Panel title="Serie observada" description="Los periodos sin observación permanecen vacíos." componentId="experiment-series"><TrendChart data={series} xKey="period" series={[
    { key: "treatment", label: "Tratamiento", color: chartPalette.primary },
    { key: "control", label: "Control", color: chartPalette.neutral },
  ]} /></Panel><Panel title="Diagnósticos" componentId="experiment-diagnostics"><CardContent className="space-y-3"><div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-800"><div className="flex items-center gap-2 text-sm">{data.diagnostics.hasObservedDataInBothGroups ? <CheckCircle2 className="size-4 text-emerald-500" /> : <ShieldAlert className="size-4 text-amber-500" />}Datos en ambos grupos</div><Badge tone={data.diagnostics.hasObservedDataInBothGroups ? "success" : "warning"}>{data.diagnostics.hasObservedDataInBothGroups ? "Sí" : "No"}</Badge></div><div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800"><span className="text-slate-400">Tendencias paralelas</span><p className="mt-1 font-medium">No evaluadas</p></div>{data.limitations.map((item) => <p key={item} className="text-xs leading-5 text-slate-500">{item}</p>)}</CardContent></Panel></div><EvidenceNotice level="causal">{data.evidenceLevel === "quasi_experimental" ? "Lectura cuasi-experimental sujeta a los supuestos del diseño." : "Interpreta solo la diferencia observada."}</EvidenceNotice></div>;
}

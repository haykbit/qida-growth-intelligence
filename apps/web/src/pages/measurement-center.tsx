import { Link, useSearchParams } from "react-router-dom";
import { CommercialResult } from "../components/commercial-result";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qida/ui";
import { ErrorState, LoadingState } from "../components/feedback";
import { MetricStrip, PageTitle, StatusBadge } from "../components/data-display";
import { api, type LearningData } from "../lib/api";
import { formatDate, integer, percent, titleCase } from "../lib/format";

type Experiment = LearningData["experiments"][number];

function methodologyLabel(value: string): string {
  if (value.toLocaleLowerCase("es-ES").includes("did")) return "Diferencia en diferencias";
  const labels: Record<string, string> = {
    descriptive: "Seguimiento descriptivo",
    quasi_experimental: "Comparación con grupo de control",
  };
  return labels[value] ?? titleCase(value.replaceAll("_", " "));
}

function metricLabel(value: string): string {
  const labels: Record<string, string> = {
    sql_per_municipality_week: "SQL familiares por municipio y semana",
    forms_per_session: "Formularios por sesión",
    formularios_por_sesion: "Formularios por sesión",
    session_to_lead: "Sesión → lead",
    lead_to_sql: "Lead → SQL",
    sql_to_alta: "SQL → alta",
  };
  return labels[value] ?? titleCase(value.replaceAll("_", " "));
}

function changeValue(experiment: Experiment) {
  if (experiment.didEstimate === null) return "Pendiente";
  return experiment.primaryMetric === "sql_per_municipality_week" ? experiment.didEstimate.toLocaleString("es-ES") + " SQL" : (experiment.didEstimate * 100).toLocaleString("es-ES", {maximumFractionDigits:2}) + " pp";
}

function resultLabel(experiment: Experiment): string {
  if (experiment.didEstimate === null) return "Pendiente";
  if (experiment.didEstimate > 0.005) return "Mejora observada";
  if (experiment.didEstimate < -0.005) return "Empeora";
  return "Sin cambio claro";
}

function ExperimentResult({ experiment }: { experiment: Experiment }) {
  const estimatedChange = changeValue(experiment);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{experiment.name}</CardTitle>
            <CardDescription>Resultado principal del experimento seleccionado.</CardDescription>
          </div>
          <StatusBadge status={experiment.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <MetricStrip columns={3} items={[
          { id: "selected-experiment-change", label: "Cambio estimado", value: estimatedChange, detail: resultLabel(experiment), definition: "Diferencia entre el cambio del grupo con landing y el cambio del grupo de control.", tone: experiment.didEstimate !== null && experiment.didEstimate > 0.005 ? "success" : experiment.didEstimate !== null && experiment.didEstimate < -0.005 ? "warning" : "neutral" },
          { id: "selected-experiment-treatment", label: "Municipios con landing", value: integer.format(experiment.treatmentMunicipalities), detail: "Grupo tratado", definition: "Municipios que reciben la versión de landing evaluada." },
          { id: "selected-experiment-control", label: "Municipios de control", value: integer.format(experiment.controlMunicipalities), detail: "Comparación", definition: "Municipios comparables que mantienen la experiencia anterior." },
        ]} />
        <Separator />
        <Table>
          <TableHeader><TableRow><TableHead>Métrica</TableHead><TableHead>Método</TableHead><TableHead>Periodo</TableHead><TableHead>Lectura</TableHead></TableRow></TableHeader>
          <TableBody><TableRow>
            <TableCell className="font-medium">{metricLabel(experiment.primaryMetric)}</TableCell>
            <TableCell>{methodologyLabel(experiment.methodology)}</TableCell>
            <TableCell>{formatDate(experiment.startDate)} – {experiment.endDate ? formatDate(experiment.endDate) : "en curso"}</TableCell>
            <TableCell><Badge tone={experiment.controlMunicipalities > 0 ? "violet" : "neutral"}>{experiment.controlMunicipalities > 0 ? "Comparación con control" : "Sin grupo de control"}</Badge></TableCell>
          </TableRow></TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function MeasurementCenterPage() {
  const [params] = useSearchParams();
  const learning = useQuery({ queryKey: ["measurement-learning"], queryFn: api.learning });
  const quality = useQuery({ queryKey: ["measurement-quality"], queryFn: () => api.dataQuality({}) });
  if (learning.isLoading || quality.isLoading) return <LoadingState cards={4} />;
  const error = learning.error ?? quality.error;
  if (error instanceof Error) return <ErrorState error={error} retry={() => { void learning.refetch(); void quality.refetch(); }} />;
  if (!learning.data || !quality.data) return <ErrorState error={new Error("No se recibieron las mediciones.")} retry={() => { void learning.refetch(); void quality.refetch(); }} />;

  const data = learning.data;
  const qualityData = quality.data;
  const primaryExperiment = data.experiments.find(experiment => experiment.id === params.get("experiment")) ?? data.experiments[0];
  const integrityFailures = qualityData.integrity.reduce((sum, check) => sum + check.failures, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Medición" />
      <Separator />

      <MetricStrip columns={4} items={[
        { id: "measurement-experiments", label: "Experimentos", value: integer.format(data.totals.experiments), detail: `${integer.format(data.totals.positive)} con mejora` },
        { id: "measurement-traceability", label: "Eventos enlazados", value: percent.format(qualityData.identity.traceabilityCoverage), detail: "Web y CRM" },
        { id: "measurement-maturity", label: "SQL pendientes de madurar", value: integer.format(qualityData.pendingMaturitySql), detail: "Menos de 90 días" },
        { id: "measurement-integrity", label: "Fallos de integridad", value: integer.format(integrityFailures), detail: integrityFailures === 0 ? "Sin bloqueos" : "Requieren revisión" },
      ]} />

      {primaryExperiment && <><ExperimentResult experiment={primaryExperiment} /><CommercialResult id={primaryExperiment.id} /></>}

      <Card>
        <CardHeader><CardTitle>Experimentos</CardTitle><CardDescription>Métrica, grupos, cambio estimado y estado.</CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Experimento</TableHead><TableHead>Métrica</TableHead><TableHead>Grupos</TableHead><TableHead>Cambio estimado</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
            <TableBody>{data.experiments.map((experiment) => <TableRow key={experiment.id}>
              <TableCell className="max-w-md"><Link className="font-semibold underline" to={`/measurement?experiment=${encodeURIComponent(experiment.id)}`}>{experiment.name}</Link><p className="mt-1 text-xs text-muted-foreground">{methodologyLabel(experiment.methodology)}</p></TableCell>
              <TableCell>{metricLabel(experiment.primaryMetric)}</TableCell>
              <TableCell className="tabular-nums">{integer.format(experiment.treatmentMunicipalities)} / {integer.format(experiment.controlMunicipalities)}</TableCell>
              <TableCell><p className="font-semibold tabular-nums">{changeValue(experiment)}</p><p className="mt-1 text-xs text-muted-foreground">{resultLabel(experiment)}</p></TableCell>
              <TableCell><StatusBadge status={experiment.status} /></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle>Calidad del dato</CardTitle><CardDescription>Controles aplicados antes de interpretar resultados.</CardDescription></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Control</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell><p className="font-medium">Eventos enlazados</p><p className="text-xs text-muted-foreground">Web y CRM</p></TableCell><TableCell className="text-right tabular-nums">{percent.format(qualityData.identity.traceabilityCoverage)}</TableCell><TableCell><Badge tone="success">Correcto</Badge></TableCell></TableRow>
                <TableRow><TableCell><p className="font-medium">Identidades ambiguas</p><p className="text-xs text-muted-foreground">Excluidas de atribución</p></TableCell><TableCell className="text-right tabular-nums">{integer.format(qualityData.identity.ambiguousIdentities)}</TableCell><TableCell><Badge tone={qualityData.identity.ambiguousIdentities > 0 ? "warning" : "success"}>{qualityData.identity.ambiguousIdentities > 0 ? "Revisar" : "Correcto"}</Badge></TableCell></TableRow>
                <TableRow><TableCell><p className="font-medium">SQL pendientes de madurar</p><p className="text-xs text-muted-foreground">Elegibles con menos de 90 días</p></TableCell><TableCell className="text-right tabular-nums">{integer.format(qualityData.pendingMaturitySql)}</TableCell><TableCell><Badge tone={qualityData.pendingMaturitySql > 0 ? "warning" : "success"}>{qualityData.pendingMaturitySql > 0 ? "Pendiente" : "Correcto"}</Badge></TableCell></TableRow>
                <TableRow><TableCell><p className="font-medium">Fallos de integridad</p><p className="text-xs text-muted-foreground">Fechas y referencias</p></TableCell><TableCell className="text-right tabular-nums">{integer.format(integrityFailures)}</TableCell><TableCell><Badge tone={integrityFailures > 0 ? "danger" : "success"}>{integrityFailures > 0 ? "Bloqueado" : "Correcto"}</Badge></TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Decisiones registradas</CardTitle><CardDescription>Decisión humana y motivo guardados por versión.</CardDescription></CardHeader>
          <CardContent className="p-0">
            {data.decisions.length ? <Table className="min-w-[680px]"><TableHeader><TableRow><TableHead>Decisión</TableHead><TableHead>Landing</TableHead><TableHead>Motivo</TableHead><TableHead className="text-right">Versión</TableHead></TableRow></TableHeader><TableBody>{data.decisions.map((decision) => <TableRow key={decision.id}>
              <TableCell><Badge tone={decision.decision === "keep" ? "success" : decision.decision === "stop" ? "danger" : "warning"}>{decision.decision === "keep" ? "Mantener" : decision.decision === "stop" ? "Parar" : "Modificar"}</Badge></TableCell>
              <TableCell className="font-medium"><Link className="underline" to={`/landing?url=${encodeURIComponent(decision.url)}&decision=${encodeURIComponent(decision.id)}`}>{decision.municipality ?? "Landing general"}</Link>{decision.service ? <span className="block text-xs font-normal text-muted-foreground">{titleCase(decision.service)}</span> : null}</TableCell>
              <TableCell className="max-w-md text-muted-foreground">{decision.hypothesis}</TableCell>
              <TableCell className="text-right text-muted-foreground">v{decision.version}</TableCell>
            </TableRow>)}</TableBody></Table> : <p className="p-5 text-sm text-muted-foreground">Todavía no hay decisiones registradas.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

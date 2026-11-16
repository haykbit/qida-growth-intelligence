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
import {
  MetricStrip,
  PageTitle,
  StatusBadge,
} from "../components/data-display";
import { api, type LearningData } from "../lib/api";
import { formatDate, integer, percent, titleCase } from "../lib/format";

type Experiment = LearningData["experiments"][number];

function methodologyLabel(value: string): string {
  if (value.toLocaleLowerCase("es-ES").includes("did"))
    return "Comparación de la evolución de ambas versiones";
  if (value.toLocaleLowerCase("es-ES").includes("piloto sintético"))
    return "Piloto municipal comparado con municipios de la misma provincia y un volumen previo de SQL similar";
  const labels: Record<string, string> = {
    descriptive: "Seguimiento descriptivo",
    quasi_experimental: "Comparación con la versión anterior",
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
  return experiment.primaryMetric === "sql_per_municipality_week"
    ? experiment.didEstimate.toLocaleString("es-ES") + " SQL"
    : (experiment.didEstimate * 100).toLocaleString("es-ES", {
        maximumFractionDigits: 2,
      }) + " pp";
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
            <CardDescription>
              Resultado principal del experimento seleccionado.
            </CardDescription>
          </div>
          <StatusBadge status={experiment.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <MetricStrip
          columns={3}
          items={[
            {
              id: "selected-experiment-change",
              label: "Resultado frente a la versión anterior",
              value: estimatedChange,
              detail: resultLabel(experiment),
              definition:
                "Compara cuánto cambió la nueva landing y descuenta el cambio observado en municipios similares que conservaron la versión anterior.",
              tone:
                experiment.didEstimate !== null &&
                experiment.didEstimate > 0.005
                  ? "success"
                  : experiment.didEstimate !== null &&
                      experiment.didEstimate < -0.005
                    ? "warning"
                    : "neutral",
            },
            {
              id: "selected-experiment-treatment",
              label: "Municipios con la nueva landing",
              value: integer.format(experiment.treatmentMunicipalities),
              detail: "Nueva versión",
              definition:
                "Municipios que reciben la versión de landing que se está evaluando.",
            },
            {
              id: "selected-experiment-control",
              label: "Municipios con la versión anterior",
              value: integer.format(experiment.controlMunicipalities),
              detail: "Referencia",
              definition:
                "Municipios comparables que mantienen la versión anterior durante las mismas fechas.",
            },
          ]}
        />
        <Separator />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrica</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Lectura</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                {metricLabel(experiment.primaryMetric)}
              </TableCell>
              <TableCell>{methodologyLabel(experiment.methodology)}</TableCell>
              <TableCell>
                {formatDate(experiment.startDate)} –{" "}
                {experiment.endDate
                  ? formatDate(experiment.endDate)
                  : "en curso"}
              </TableCell>
              <TableCell>
                <Badge
                  tone={
                    experiment.controlMunicipalities > 0 ? "violet" : "neutral"
                  }
                >
                  {experiment.controlMunicipalities > 0
                    ? "Con versión anterior comparable"
                    : "Sin versión de referencia"}
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function MeasurementCenterPage() {
  const [params] = useSearchParams();
  const learning = useQuery({
    queryKey: ["measurement-learning"],
    queryFn: api.learning,
  });
  const quality = useQuery({
    queryKey: ["measurement-quality"],
    queryFn: () => api.dataQuality({}),
  });
  if (learning.isLoading || quality.isLoading)
    return <LoadingState cards={4} />;
  const error = learning.error ?? quality.error;
  if (error instanceof Error)
    return (
      <ErrorState
        error={error}
        retry={() => {
          void learning.refetch();
          void quality.refetch();
        }}
      />
    );
  if (!learning.data || !quality.data)
    return (
      <ErrorState
        error={new Error("No se recibieron las mediciones.")}
        retry={() => {
          void learning.refetch();
          void quality.refetch();
        }}
      />
    );

  const data = learning.data;
  const qualityData = quality.data;
  const primaryExperiment =
    data.experiments.find(
      (experiment) => experiment.id === params.get("experiment"),
    ) ?? data.experiments[0];
  const integrityFailures = qualityData.integrity.reduce(
    (sum, check) => sum + check.failures,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Medición" />
      <Separator />

      <MetricStrip
        columns={4}
        items={[
          {
            id: "measurement-experiments",
            label: "Experimentos",
            value: integer.format(data.totals.experiments),
            detail: `${integer.format(data.totals.positive)} con mejora`,
            definition:
              "Pruebas registradas que comparan una nueva landing con su versión anterior o realizan seguimiento descriptivo.",
          },
          {
            id: "measurement-traceability",
            label: "Eventos conectados con CRM",
            value: percent.format(qualityData.identity.traceabilityCoverage),
            detail: "Web y CRM",
            definition:
              "Porcentaje de eventos web que pueden relacionarse con una oportunidad del CRM mediante un identificador confirmado.",
          },
          {
            id: "measurement-maturity",
            label: "SQL aún en seguimiento",
            value: integer.format(qualityData.pendingMaturitySql),
            detail: "Creados hace menos de 90 días",
            definition:
              "Todavía no se usan para calcular la conversión a alta porque no han completado 90 días de seguimiento.",
          },
          {
            id: "measurement-integrity",
            label: "Registros con errores",
            value: integer.format(integrityFailures),
            detail:
              integrityFailures === 0 ? "Sin bloqueos" : "Requieren revisión",
            definition:
              "Registros con fechas imposibles o referencias ausentes que impiden interpretar una métrica con seguridad.",
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Comparaciones de landings</CardTitle>
          <CardDescription>
            Nueva versión, versión anterior, resultado observado y estado de la
            lectura.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prueba</TableHead>
                <TableHead>Métrica</TableHead>
                <TableHead>Municipios nueva / anterior</TableHead>
                <TableHead>Resultado comparado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.experiments.map((experiment) => (
                <TableRow
                  className={
                    experiment.id === primaryExperiment?.id
                      ? "bg-muted/50"
                      : undefined
                  }
                  key={experiment.id}
                >
                  <TableCell className="max-w-md">
                    <Link
                      aria-current={
                        experiment.id === primaryExperiment?.id
                          ? "true"
                          : undefined
                      }
                      className="font-semibold underline underline-offset-4"
                      to={`/measurement?experiment=${encodeURIComponent(experiment.id)}#experiment-result`}
                    >
                      {experiment.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {methodologyLabel(experiment.methodology)}
                    </p>
                  </TableCell>
                  <TableCell>{metricLabel(experiment.primaryMetric)}</TableCell>
                  <TableCell className="tabular-nums">
                    {integer.format(experiment.treatmentMunicipalities)} nueva ·{" "}
                    {integer.format(experiment.controlMunicipalities)} anterior
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold tabular-nums">
                      {changeValue(experiment)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {resultLabel(experiment)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={experiment.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {primaryExperiment && (
        <section
          aria-live="polite"
          className="flex scroll-mt-24 flex-col gap-5"
          id="experiment-result"
        >
          <ExperimentResult experiment={primaryExperiment} />
          <CommercialResult id={primaryExperiment.id} />
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Calidad del dato</CardTitle>
            <CardDescription>
              Controles aplicados antes de interpretar resultados.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <p className="font-medium">Eventos conectados con CRM</p>
                    <p className="text-xs text-muted-foreground">
                      Eventos web relacionados con una oportunidad confirmada
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {percent.format(qualityData.identity.traceabilityCoverage)}
                  </TableCell>
                  <TableCell>
                    <Badge tone="success">Utilizable</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <p className="font-medium">Identidades sin confirmar</p>
                    <p className="text-xs text-muted-foreground">
                      No se usan para atribuir resultados
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {integer.format(qualityData.identity.ambiguousIdentities)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        qualityData.identity.ambiguousIdentities > 0
                          ? "warning"
                          : "success"
                      }
                    >
                      {qualityData.identity.ambiguousIdentities > 0
                        ? "Revisar"
                        : "Ninguna"}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <p className="font-medium">SQL aún en seguimiento</p>
                    <p className="text-xs text-muted-foreground">
                      Creados hace menos de 90 días; todavía no cuentan en SQL →
                      alta
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {integer.format(qualityData.pendingMaturitySql)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        qualityData.pendingMaturitySql > 0
                          ? "warning"
                          : "success"
                      }
                    >
                      {qualityData.pendingMaturitySql > 0
                        ? "Esperar"
                        : "Seguimiento completo"}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <p className="font-medium">Registros con errores</p>
                    <p className="text-xs text-muted-foreground">
                      Fechas imposibles o referencias ausentes
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {integer.format(integrityFailures)}
                  </TableCell>
                  <TableCell>
                    <Badge tone={integrityFailures > 0 ? "danger" : "success"}>
                      {integrityFailures > 0 ? "Bloqueado" : "Ninguno"}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decisiones registradas</CardTitle>
            <CardDescription>
              Decisión humana y motivo guardados por versión.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.decisions.length ? (
              <Table className="min-w-[680px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Decisión</TableHead>
                    <TableHead>Landing</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Versión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.decisions.map((decision) => (
                    <TableRow key={decision.id}>
                      <TableCell>
                        <Badge
                          tone={
                            decision.decision === "keep"
                              ? "success"
                              : decision.decision === "stop"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {decision.decision === "keep"
                            ? "Mantener"
                            : decision.decision === "stop"
                              ? "Parar"
                              : "Modificar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          className="underline"
                          to={`/landing?url=${encodeURIComponent(decision.url)}&decision=${encodeURIComponent(decision.id)}`}
                        >
                          {decision.municipality ?? "Landing general"}
                        </Link>
                        {decision.service ? (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {titleCase(decision.service)}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-md text-muted-foreground">
                        {decision.hypothesis}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        v{decision.version}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-5 text-sm text-muted-foreground">
                Todavía no hay decisiones registradas.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

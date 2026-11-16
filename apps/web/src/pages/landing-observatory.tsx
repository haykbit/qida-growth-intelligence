import { LandingChanges } from "../components/landing-changes";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qida/ui";
import { ArrowLeft, ChevronRight, ExternalLink, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { chartPalette, TrendChart } from "../components/charts";
import {
  FunnelEvidence,
  landingReading,
  MetricComparison,
  PerformanceBadge,
  ScoreLine,
} from "../components/landing-performance";
import { MetricCard, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api } from "../lib/api";
import { decimal, integer, percent, titleCase } from "../lib/format";
import { useFilters } from "../state/filters";

function PortfolioMetric({
  label,
  value,
  definition,
}: {
  label: string;
  value: string;
  definition: string;
}) {
  return <MetricCard definition={definition} label={label} value={value} />;
}

export function LandingObservatoryPage() {
  const { filters } = useFilters();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["landing-observatory", filters, page, search],
    queryFn: () => api.landingInsights(filters, page, 20, search),
  });
  if (query.isLoading) return <LoadingState cards={4} />;
  if (query.error instanceof Error)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const data = query.data;
  const totalPages = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)),
  );

  return (
    <div className="space-y-5">
      <header className="grid gap-5 border-b pb-5 xl:grid-cols-[minmax(280px,0.7fr)_minmax(700px,1.3fr)] xl:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Rendimiento de landings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Datos web y CRM agrupados por URL de entrada.
          </p>
        </div>
        <div className="grid overflow-hidden rounded-lg border border-border bg-border gap-px sm:grid-cols-2 lg:grid-cols-5">
          <PortfolioMetric
            definition="Número de URLs de landing que cumplen los filtros activos."
            label="landings"
            value={integer.format(data?.totals.landings ?? 0)}
          />
          <PortfolioMetric
            definition="Sesiones web registradas cuya URL de entrada es una landing del inventario."
            label="sesiones"
            value={integer.format(data?.totals.sessions ?? 0)}
          />
          <PortfolioMetric
            definition="Contactos de familias atribuidos a esas landings; excluye empleo de cuidadoras."
            label="leads"
            value={integer.format(data?.totals.leads ?? 0)}
          />
          <PortfolioMetric
            definition="Leads de familias que alcanzaron la condición de SQL en CRM."
            label="SQL"
            value={integer.format(data?.totals.sql ?? 0)}
          />
          <PortfolioMetric
            definition="SQL que terminaron en un alta reconciliada con CRM."
            label="altas"
            value={integer.format(data?.totals.altas ?? 0)}
          />
        </div>
      </header>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          <form
            className="flex w-full max-w-xl gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(input.trim());
              setPage(1);
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 pr-9"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Municipio, servicio o URL"
                value={input}
              />
              {input ? (
                <button
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => {
                    setInput("");
                    setSearch("");
                    setPage(1);
                  }}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <Button type="submit">Buscar</Button>
          </form>
          <p className="whitespace-nowrap text-xs text-muted-foreground">
            {integer.format(data?.total ?? 0)} resultados
          </p>
        </div>

        {data?.items.length ? (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Landing</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Comparación</TableHead>
                <TableHead className="text-right">Sesiones</TableHead>
                <TableHead className="text-right">Sesión → lead</TableHead>
                <TableHead className="text-right">Lead → SQL</TableHead>
                <TableHead className="text-right">SQL → alta</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Abrir</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((landing) => (
                <TableRow key={landing.url}>
                  <TableCell className="min-w-[230px]">
                    <Link
                      className="font-semibold hover:underline"
                      to={`/landing?url=${encodeURIComponent(landing.url)}`}
                    >
                      {landing.municipality ?? "Landing general"}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {landing.service
                        ? titleCase(landing.service)
                        : "Sin servicio"}{" "}
                      · {landing.language.toUpperCase()}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={landing.status} />
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <PerformanceBadge landing={landing} />
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {integer.format(landing.sessions)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {percent.format(landing.rates.sessionToLead)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {percent.format(landing.rates.leadToSql)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {percent.format(landing.rates.sqlToAlta)}
                  </TableCell>
                  <TableCell>
                    <Button
                      asChild
                      aria-label={`Abrir ${landing.municipality ?? landing.url}`}
                      size="icon"
                      variant="ghost"
                    >
                      <Link
                        to={`/landing?url=${encodeURIComponent(landing.url)}`}
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState title="No hay landings con estos filtros" />
        )}

        <div className="flex items-center justify-between border-t p-3">
          <p className="text-xs text-muted-foreground">
            Página {integer.format(page)} de {integer.format(totalPages)}
          </p>
          <div className="flex gap-2">
            <Button
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              size="sm"
              variant="secondary"
            >
              Anterior
            </Button>
            <Button
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              size="sm"
              variant="secondary"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function LandingRecordPage() {
  const [params] = useSearchParams();
  const url = params.get("url") ?? "";
  const { filters } = useFilters();
  const landing = useQuery({
    queryKey: ["landing-record", url, filters],
    queryFn: () => api.landingInsight(url, filters),
    enabled: Boolean(url),
  });
  const municipalityId = landing.data?.municipalityId ?? "";
  const service = landing.data?.service ?? "";
  const opportunity = useQuery({
    queryKey: ["landing-opportunity-context", municipalityId, service],
    queryFn: () => api.opportunity(municipalityId, service, filters),
    enabled: Boolean(municipalityId && service),
  });

  if (landing.isLoading) return <LoadingState cards={4} />;
  if (landing.error instanceof Error)
    return (
      <ErrorState error={landing.error} retry={() => void landing.refetch()} />
    );
  if (!landing.data)
    return (
      <EmptyState
        title="No se encontró la landing"
        action={
          <Button asChild variant="secondary">
            <Link to="/">Volver a landings</Link>
          </Button>
        }
      />
    );

  const data = landing.data;
  return (
    <div className="space-y-5">
      <Button asChild className="-ml-3" size="sm" variant="ghost">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Landings
        </Link>
      </Button>
      <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={data.status} />
            <PerformanceBadge landing={data} />
            <Badge>{data.origin === "generada" ? "Generada" : "Manual"}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
            {data.municipality ?? "Landing general"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.service ? titleCase(data.service) : "Sin servicio"} ·{" "}
            {data.language.toUpperCase()} · {data.url}
          </p>
        </div>
        {data.municipalityId && data.service ? (
          <Button asChild size="sm" variant="secondary">
            <Link
              rel="noreferrer"
              target="_blank"
              to={`/demo/${data.municipalityId}/${encodeURIComponent(data.service)}`}
            >
              Ver landing <ExternalLink className="size-4" />
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="rounded-lg border-l-4 border-l-primary bg-card px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Resumen de los datos
        </p>
        <p className="mt-2 text-sm leading-6">{landingReading(data)}</p>
      </div>

      <Tabs
        key={params.get("decision") ?? url}
        defaultValue={params.has("decision") ? "changes" : "summary"}
      >
        <div className="overflow-x-auto border-b">
          <TabsList className="h-auto min-w-max rounded-none bg-transparent p-0">
            {(
              [
                ["summary", "Resumen"],
                ["traffic", "Tráfico y CRM"],
                ["motor", "Datos del municipio"],
                ["experiments", "Experimentos"],
                ["changes", "Cambios y decisiones"],
              ] as const
            ).map(([value, label]) => (
              <TabsTrigger
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                key={value}
                value={value}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="changes">
          <LandingChanges data={data} selectedId={params.get("decision")} />
        </TabsContent>
        <TabsContent className="space-y-5" value="summary">
          <FunnelEvidence
            altas={data.altas}
            leads={data.leads}
            sessions={data.sessions}
            sql={data.sql}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <MetricComparison
              benchmark={data.benchmark.sessionToLead}
              current={data.rates.sessionToLead}
              label="Sesión → lead"
            />
            <MetricComparison
              benchmark={data.benchmark.leadToSql}
              current={data.rates.leadToSql}
              label="Lead → SQL"
            />
            <MetricComparison
              benchmark={data.benchmark.sqlToAlta}
              current={data.rates.sqlToAlta}
              label="SQL → alta"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Puntuaciones comparables</CardTitle>
              <CardDescription>
                Mismas reglas para todas las landings · escala de 0 a 100
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {data.evaluation.dimensions.map((dimension) => (
                <ScoreLine
                  explanation={
                    dimension.key === "visibility"
                      ? "Indexación, clics desde Google y posición media."
                      : dimension.key === "acquisition"
                        ? "Tasa sesión → lead comparada con la media seleccionada."
                        : dimension.key === "quality"
                          ? "Tasas lead → SQL y SQL → alta comparadas con la media."
                          : "Cobertura y cuidadoras disponibles a 30 días."
                  }
                  key={dimension.key}
                  label={dimension.label}
                  score={dimension.score}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-5" value="traffic">
          <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
            <Card>
              <CardHeader>
                <CardTitle>Totales del periodo</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {[
                      ["Sesiones", integer.format(data.sessions)],
                      ["Formularios", integer.format(data.forms)],
                      ["Clics en teléfono", integer.format(data.phoneClicks)],
                      [
                        "Impresiones en Google",
                        integer.format(data.impressions),
                      ],
                      ["Clics desde Google", integer.format(data.clicks)],
                      ["CTR orgánico", percent.format(data.rates.organicCtr)],
                      [
                        "Posición media",
                        data.averagePosition === null
                          ? "—"
                          : decimal.format(data.averagePosition),
                      ],
                    ].map(([label, value]) => (
                      <TableRow key={label}>
                        <TableCell className="text-muted-foreground">
                          {label}
                        </TableCell>
                        <TableCell className="tabular text-right font-semibold">
                          {value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sesiones por mes</CardTitle>
              </CardHeader>
              <TrendChart
                data={data.monthly}
                height="h-72"
                series={[
                  {
                    key: "sessions",
                    label: "Sesiones",
                    color: chartPalette.neutral,
                  },
                ]}
                xKey="period"
              />
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Leads, SQL y altas por mes</CardTitle>
            </CardHeader>
            <TrendChart
              data={data.monthly}
              height="h-72"
              series={[
                { key: "leads", label: "Leads", color: chartPalette.tertiary },
                { key: "sql", label: "SQL", color: chartPalette.primary },
                { key: "altas", label: "Altas", color: chartPalette.danger },
              ]}
              xKey="period"
            />
          </Card>
        </TabsContent>

        <TabsContent value="motor">
          <Card>
            <CardHeader>
              <CardTitle>Datos del municipio y servicio</CardTitle>
              <CardDescription>
                Datos enlazados mediante municipio y servicio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dato</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Fuente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [
                      "Cobertura activa",
                      data.operations.coverage ? "Sí" : "No",
                      "motor_municipio",
                    ],
                    [
                      "Cuidadoras disponibles a 30 días",
                      integer.format(data.operations.caregiversAvailable),
                      "motor_municipio",
                    ],
                    [
                      "Capacidad mínima",
                      data.operations.eligible ? "Cumple" : "No cumple",
                      "motor_municipio",
                    ],
                    [
                      "Puntuación de oportunidad",
                      data.opportunityScore === null
                        ? "—"
                        : `${integer.format(data.opportunityScore)}/100`,
                      "growth_recommendation",
                    ],
                    [
                      "Búsquedas mensuales",
                      opportunity.data
                        ? integer.format(opportunity.data.monthlySearches)
                        : "—",
                      "motor_demanda_busqueda",
                    ],
                    [
                      "Menciones en llamadas",
                      opportunity.data
                        ? integer.format(opportunity.data.voiceSignals)
                        : "—",
                      "motor_voz_cliente",
                    ],
                    [
                      "Competidores registrados",
                      opportunity.data
                        ? integer.format(opportunity.data.competitors)
                        : "—",
                      "motor_competencia",
                    ],
                  ].map(([label, value, source]) => (
                    <TableRow key={label}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell className="tabular text-right">
                        {value}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">
                          {source}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-5" value="experiments">
          <Card>
            <CardHeader>
              <CardTitle>Experimentos del municipio</CardTitle>
            </CardHeader>
            <CardContent>
              {data.experiments.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Experimento</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.experiments.map((experiment) => (
                      <TableRow key={experiment.id}>
                        <TableCell>
                          <p className="font-semibold">{experiment.name}</p>
                          <p className="mt-1 max-w-lg text-xs text-muted-foreground">
                            {experiment.hypothesis}
                          </p>
                        </TableCell>
                        <TableCell>
                          {experiment.startDate.slice(0, 10)}
                          {experiment.endDate
                            ? ` – ${experiment.endDate.slice(0, 10)}`
                            : ""}
                        </TableCell>
                        <TableCell>
                          <Badge>
                            {experiment.evidenceLevel === "quasi_experimental"
                              ? "Comparación con versión anterior"
                              : "Solo seguimiento"}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {experiment.didEstimate === null
                            ? "Pendiente"
                            : experiment.primaryMetric ===
                                "sql_per_municipality_week"
                              ? decimal.format(experiment.didEstimate) + " SQL"
                              : decimal.format(experiment.didEstimate * 100) +
                                " pp"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este municipio no participa en ningún experimento.
                </p>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [
                "Web",
                "Sesiones, formularios y clics en teléfono",
                "web_sesiones_diarias",
              ],
              ["CRM", "Leads, SQL y altas enlazados por URL", "lead"],
              [
                "Alcance",
                "La URL permite relacionar la landing con resultados del CRM. Esta relación no demuestra que la landing los haya causado.",
                "landing.url = lead.url_entrada",
              ],
            ].map(([title, text, source]) => (
              <Card key={title}>
                <CardContent className="p-4">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                  <code className="mt-3 block text-xs">{source}</code>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

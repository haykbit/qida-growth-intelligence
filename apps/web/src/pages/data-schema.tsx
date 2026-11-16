import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@qida/ui";
import {
  Braces,
  Calculator,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Code2,
  Database,
  FileInput,
  GitMerge,
  ServerCog,
  TableProperties,
} from "lucide-react";
import { Fragment, useState } from "react";
import { ErrorState, LoadingState } from "../components/feedback";
import { api, type WorkbenchData } from "../lib/api";
import { formatDateTime, integer, percent } from "../lib/format";

const sourceTables = [
  [
    "motor_municipio",
    "municipio",
    "Cobertura, cuidadoras disponibles, actividad, NPS y oficina",
  ],
  [
    "motor_demanda_busqueda",
    "municipio · tema · mes",
    "Búsquedas mensuales, competencia en Ads y CPC",
  ],
  [
    "motor_voz_cliente",
    "municipio · mes · tema · tipo",
    "Necesidades y expresiones agregadas de las llamadas",
  ],
  [
    "motor_competencia",
    "municipio · competidor",
    "Servicios y presencia local de cada competidor",
  ],
  ["landing", "URL", "Municipio, idioma, origen, publicación e indexación"],
  [
    "gsc_diario",
    "fecha · URL · consulta",
    "Impresiones, clics y posición en Google",
  ],
  [
    "web_sesiones_diarias",
    "fecha · URL · canal · dispositivo",
    "Sesiones, formularios y clics en teléfono",
  ],
  [
    "ads_diario",
    "fecha · plataforma · campaña",
    "Coste, impresiones, clics y conversiones de plataforma",
  ],
  ["lead", "lead", "Canal, URL de entrada, SQL, alta y descarte en CRM"],
] as const;

const extensionTables = [
  ["identity_map", "Enlaces deterministas entre identificadores seudónimos"],
  ["care_opportunity", "Oportunidad familiar y estado CRM"],
  ["journey_event", "Eventos enlazados a una persona u oportunidad"],
  ["growth_experiment", "Definición y método de cada experimento"],
  ["experiment_assignment", "Municipios de tratamiento y control"],
  ["landing_workflow", "Estado de revisión y publicación de una landing"],
  ["audit_log", "Historial de cambios y aprobaciones"],
] as const;

const tableColumns: Record<string, ReadonlyArray<readonly [string, string, string]>> = {
  motor_municipio: [["municipio_id", "texto", "Identificador del municipio"], ["nombre", "texto", "Nombre oficial"], ["provincia", "texto", "Provincia"], ["tiene_cobertura", "booleano", "Cobertura activa"], ["cuidadoras_disponibles_30d", "entero", "Capacidad disponible"], ["nps", "decimal", "NPS con muestra mínima"]],
  motor_demanda_busqueda: [["municipio_id", "texto", "Municipio"], ["tema", "texto", "Servicio o necesidad"], ["mes", "fecha", "Mes observado"], ["busquedas", "entero", "Búsquedas mensuales"], ["cpc_estimado", "decimal", "CPC estimado"]],
  motor_voz_cliente: [["municipio_id", "texto", "Municipio agregado"], ["mes", "fecha", "Mes analizado"], ["tema", "texto", "Tema del codebook"], ["tipo", "texto", "Lead o cliente activo"], ["menciones", "entero", "Menciones anonimizadas"]],
  motor_competencia: [["municipio_id", "texto", "Municipio"], ["competidor", "texto", "Competidor observado"], ["servicios", "json", "Servicios encontrados"], ["presencia_local", "booleano", "Presencia en la zona"]],
  landing: [["url", "texto", "URL única"], ["municipio_id", "texto", "Municipio objetivo"], ["idioma", "texto", "Castellano o catalán"], ["servicio", "texto", "Servicio principal"], ["estado", "texto", "Estado de publicación"], ["fecha_indexacion", "fecha", "Primera indexación"]],
  gsc_diario: [["fecha", "fecha", "Día observado"], ["url", "texto", "Landing"], ["consulta", "texto", "Consulta de búsqueda"], ["impresiones", "entero", "Impresiones orgánicas"], ["clics", "entero", "Clics orgánicos"], ["posicion", "decimal", "Posición media"]],
  web_sesiones_diarias: [["fecha", "fecha", "Día observado"], ["url_entrada", "texto", "Landing de entrada"], ["canal", "texto", "Canal atribuido"], ["dispositivo", "texto", "Tipo de dispositivo"], ["sesiones", "entero", "Sesiones"], ["formularios", "entero", "Formularios enviados"]],
  ads_diario: [["fecha", "fecha", "Día observado"], ["plataforma", "texto", "Plataforma publicitaria"], ["campaña", "texto", "Campaña"], ["coste", "decimal", "Inversión"], ["clics", "entero", "Clics"], ["conversiones_plataforma", "entero", "Conversiones declaradas"]],
  lead: [["lead_id", "texto", "Identificador seudónimo"], ["municipio_id", "texto", "Municipio"], ["url_entrada", "texto", "Landing atribuida"], ["fecha_creacion", "fecha", "Alta del lead"], ["fecha_sql", "fecha", "Paso a SQL"], ["fecha_alta", "fecha", "Alta confirmada"], ["tipo_contacto", "texto", "Familia o empleo"]],
  identity_map: [["identity_id", "texto", "Identificador de origen"], ["person_id", "texto", "Persona seudónima"], ["metodo", "texto", "Regla determinista"]],
  care_opportunity: [["opportunity_id", "texto", "Oportunidad familiar"], ["person_id", "texto", "Persona seudónima"], ["lead_id", "texto", "Lead de origen"], ["estado", "texto", "Estado comercial"]],
  journey_event: [["event_id", "texto", "Evento"], ["person_id", "texto", "Persona enlazada"], ["opportunity_id", "texto", "Oportunidad enlazada"], ["tipo", "texto", "Tipo de evento"], ["fecha", "fecha", "Momento del evento"]],
  growth_experiment: [["experiment_id", "texto", "Experimento"], ["hipotesis", "texto", "Hipótesis congelada"], ["metrica_principal", "texto", "Métrica de decisión"], ["metodologia", "texto", "Diseño de medición"]],
  experiment_assignment: [["experiment_id", "texto", "Experimento"], ["municipio_id", "texto", "Municipio"], ["variante", "texto", "Tratamiento o control"], ["fecha_asignacion", "fecha", "Asignación"]],
  landing_workflow: [["url", "texto", "Landing"], ["version", "entero", "Versión"], ["estado", "texto", "Borrador, revisión o publicación"], ["aprobador", "texto", "Responsable seudónimo"]],
  audit_log: [["audit_id", "texto", "Registro"], ["entidad", "texto", "Entidad modificada"], ["accion", "texto", "Acción"], ["actor_role", "texto", "Rol responsable"], ["fecha", "fecha", "Momento"]],
};

function FlowStage({
  icon: Icon,
  step,
  title,
  detail,
  owner,
  status,
}: {
  icon: typeof Database;
  step: string;
  title: string;
  detail: string;
  owner: string;
  status: "existing" | "demo" | "proposed";
}) {
  const statusCopy = {
    existing: { label: "Existe", tone: "success" as const },
    demo: { label: "Demo", tone: "warning" as const },
    proposed: { label: "Propuesto", tone: "neutral" as const },
  };
  return (
    <div className="min-w-0 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <Icon className="size-5 text-accent" />
        <Badge tone={statusCopy[status].tone}>{statusCopy[status].label}</Badge>
      </div>
      <p className="mt-5 text-xs font-semibold text-muted-foreground">{step} · {owner}</p>
      <p className="mt-1 font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function TableCatalog() {
  const [expanded, setExpanded] = useState<string | null>("landing");
  const tables = [
    ...sourceTables.map(([name, grain, description]) => ({ name, grain, description, source: true })),
    ...extensionTables.map(([name, description]) => ({ name, grain: "Extensión de la plataforma", description, source: false })),
  ];
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Tablas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead className="w-10" /><TableHead>Tabla</TableHead><TableHead>Una fila representa</TableHead><TableHead>Contenido</TableHead><TableHead>Origen</TableHead></TableRow></TableHeader>
          <TableBody>
            {tables.map((table) => {
              const isOpen = expanded === table.name;
              return <Fragment key={table.name}>
                <TableRow className="cursor-pointer" onClick={() => setExpanded(isOpen ? null : table.name)}>
                  <TableCell><ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} /></TableCell>
                  <TableCell><code className="text-xs font-semibold">{table.name}</code></TableCell>
                  <TableCell>{table.grain}</TableCell>
                  <TableCell className="text-muted-foreground">{table.description}</TableCell>
                  <TableCell><Badge tone={table.source ? "info" : "neutral"}>{table.source ? "Esquema original" : "Extensión"}</Badge></TableCell>
                </TableRow>
                {isOpen ? <TableRow className="bg-muted/25 hover:bg-muted/25"><TableCell colSpan={5} className="p-0"><div className="px-12 py-5"><p className="mb-3 text-xs font-semibold text-muted-foreground">Columnas principales</p><div className="overflow-hidden rounded-md border bg-card"><Table><TableHeader><TableRow><TableHead>Columna</TableHead><TableHead>Tipo</TableHead><TableHead>Definición</TableHead></TableRow></TableHeader><TableBody>{(tableColumns[table.name] ?? []).map(([name, type, definition]) => <TableRow key={name}><TableCell><code className="text-xs">{name}</code></TableCell><TableCell>{type}</TableCell><TableCell className="text-muted-foreground">{definition}</TableCell></TableRow>)}</TableBody></Table></div></div></TableCell></TableRow> : null}
              </Fragment>;
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function QueryExplorer({ data }: { data: WorkbenchData }) {
  const [selectedId, setSelectedId] = useState<
    WorkbenchData["queries"][number]["id"]
  >("opportunity_score");
  const selected =
    data.queries.find((query) => query.id === selectedId) ?? data.queries[0];
  if (!selected) return null;
  const columns = Object.keys(selected.resultRows[0] ?? {});
  const evidenceCopy = {
    descriptive: { label: "Descriptiva", tone: "neutral" as const, help: "Resume patrones observados. No atribuye ni demuestra un efecto." },
    attribution: { label: "Atribución", tone: "info" as const, help: "Relaciona resultados mediante una clave observada, como la URL de entrada." },
    quasi_experimental: { label: "Cuasi experimental", tone: "violet" as const, help: "Compara el cambio de tratamiento con el cambio de control; la demo no prueba significación." },
    quality: { label: "Control de calidad", tone: "warning" as const, help: "Comprueba si los datos se pueden interpretar con seguridad." },
  }[selected.evidence];
  const areaTone = {
    Oportunidades: "warning",
    Landings: "info",
    Medición: "violet",
    Calidad: "success",
  } as const;
  const percentageColumns = new Set([
    "sesion_a_lead", "lead_a_sql", "sql_a_alta", "cobertura", "tratamiento_antes",
    "tratamiento_despues", "control_antes", "control_despues", "cambio_estimado",
  ]);
  const formatColumn = (column: string): string => column.replaceAll("_", " ").replace(/^./u, (value) => value.toUpperCase());
  const formatCell = (column: string, value: string | number | boolean | null): string => {
    if (value === null) return "—";
    if (typeof value === "boolean") return value ? "Sí" : "No";
    if (typeof value === "number" && percentageColumns.has(column)) return percent.format(value);
    if (typeof value === "number") return integer.format(value);
    return value;
  };

  return (
    <TooltipProvider>
      <div className="grid min-w-0 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="h-fit xl:sticky xl:top-24">
          <CardHeader>
            <CardTitle>Consultas del producto</CardTitle>
            <CardDescription>Solo aparecen cálculos que producen una métrica o control visible.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:flex xl:flex-col">
            {data.queries.map((query) => (
              <Button
                className="h-auto w-full justify-start whitespace-normal px-3 py-3 text-left"
                key={query.id}
                onClick={() => setSelectedId(query.id)}
                type="button"
                variant={query.id === selected.id ? "primary" : "ghost"}
              >
                <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <span className="text-xs opacity-70">{query.area}</span>
                  <span className="text-sm leading-5">{query.title}</span>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex max-w-3xl flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={areaTone[selected.area]}>{selected.area}</Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-help items-center gap-1">
                        <Badge tone={evidenceCopy.tone}>{evidenceCopy.label}</Badge>
                        <CircleHelp className="size-3.5 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{evidenceCopy.help}</TooltipContent>
                  </Tooltip>
                </div>
                <CardTitle className="text-xl leading-7">{selected.title}</CardTitle>
                <CardDescription className="text-base leading-6">{selected.question}</CardDescription>
              </div>
              <div className="grid shrink-0 gap-1 text-sm lg:text-right">
                <span className="font-medium">{selected.grain}</span>
                <span className="text-xs text-muted-foreground">{selected.implementation.endpoint}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="calculation">
              <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0">
                <TabsTrigger className="gap-2 rounded-none border-b-2 border-transparent px-5 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none" value="calculation"><Calculator className="size-4" />Cálculo</TabsTrigger>
                <TabsTrigger className="gap-2 rounded-none border-b-2 border-transparent px-5 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none" value="sql"><Code2 className="size-4" />SQL</TabsTrigger>
                <TabsTrigger className="gap-2 rounded-none border-b-2 border-transparent px-5 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none" value="result"><TableProperties className="size-4" />Resultado</TabsTrigger>
              </TabsList>

              <TabsContent className="m-0 flex flex-col gap-6 p-5" value="calculation">
                <section className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Métricas que produce</h3>
                    <p className="mt-1 text-xs text-muted-foreground">La ubicación del cálculo distingue SQL de lógica posterior en la API.</p>
                  </div>
                  <Table>
                    <TableHeader><TableRow><TableHead>Métrica</TableHead><TableHead>Definición</TableHead><TableHead>Fórmula</TableHead><TableHead>Se calcula en</TableHead><TableHead>Se muestra en</TableHead></TableRow></TableHeader>
                    <TableBody>{selected.metrics.map((metric) => <TableRow key={metric.name}><TableCell className="font-medium">{metric.name}</TableCell><TableCell className="max-w-xs text-muted-foreground">{metric.definition}</TableCell><TableCell><code className="text-xs leading-5">{metric.calculation}</code></TableCell><TableCell><Badge tone={metric.calculatedIn === "sql" ? "info" : "violet"}>{metric.calculatedIn === "sql" ? "SQL" : "API"}</Badge></TableCell><TableCell className="text-muted-foreground">{metric.displayedAs}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><GitMerge className="size-4" />Uniones</CardTitle><CardDescription>Claves que conectan las fuentes.</CardDescription></CardHeader>
                    <CardContent className="flex flex-col gap-4">{selected.joins.map((join) => <div className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0" key={`${join.left}-${join.right}`}><div className="flex flex-wrap items-center gap-2 text-xs"><code className="rounded bg-secondary px-2 py-1">{join.left}</code><span className="text-muted-foreground">con</span><code className="rounded bg-secondary px-2 py-1">{join.right}</code></div><p className="text-xs font-medium">Clave: {join.on}</p><p className="text-xs leading-5 text-muted-foreground">{join.purpose}</p></div>)}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Uso y límites</CardTitle><CardDescription>Qué consume el resultado y qué queda fuera.</CardDescription></CardHeader>
                    <CardContent className="flex flex-col gap-5">
                      <div className="flex flex-col gap-3">{selected.shownIn.map((placement) => <div className="flex items-start justify-between gap-4" key={`${placement.page}-${placement.component}`}><span className="text-sm font-medium">{placement.page}</span><span className="max-w-xs text-right text-xs leading-5 text-muted-foreground">{placement.component}</span></div>)}</div>
                      <div className="flex flex-wrap gap-2">{selected.dataUsed.map((table) => <Badge key={table}>{table}</Badge>)}</div>
                      <div className="flex flex-col gap-2">{selected.exclusions.map((exclusion) => <p className="text-xs leading-5 text-muted-foreground" key={exclusion}>• {exclusion}</p>)}</div>
                    </CardContent>
                  </Card>
                </section>
                {selected.caveats.map((caveat) => <Alert key={caveat}><AlertDescription>{caveat}</AlertDescription></Alert>)}
              </TabsContent>

              <TabsContent className="m-0 p-5" value="sql">
                <Tabs defaultValue="statement-0">
                  <TabsList>{selected.statements.map((statement, index) => <TabsTrigger key={statement.title} value={`statement-${index}`}>{statement.title}</TabsTrigger>)}</TabsList>
                  {selected.statements.map((statement, index) => <TabsContent className="mt-4" key={statement.title} value={`statement-${index}`}>
                    <Card>
                      <CardHeader><CardTitle>{statement.title}</CardTitle><CardDescription>{statement.purpose}</CardDescription></CardHeader>
                      <CardContent className="p-0">
                        {statement.parameters.length ? <div className="flex flex-wrap gap-2 border-t bg-muted/30 px-5 py-3">{statement.parameters.map((parameter) => <Badge key={parameter.name}>{parameter.name}: {parameter.value}</Badge>)}</div> : null}
                        <pre className="max-h-[560px] overflow-auto border-t bg-slate-950 p-5 text-xs leading-6 text-slate-100"><code>{statement.sql}</code></pre>
                      </CardContent>
                    </Card>
                  </TabsContent>)}
                </Tabs>
              </TabsContent>

              <TabsContent className="m-0 flex flex-col gap-4 p-5" value="result">
                <div>
                  <h3 className="text-sm font-semibold">Resultado ejecutado</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{selected.resultDescription}</p>
                </div>
                {selected.resultRows.length ? <Card><CardContent className="p-0"><Table><TableHeader><TableRow>{columns.map((column) => <TableHead key={column}>{formatColumn(column)}</TableHead>)}</TableRow></TableHeader><TableBody>{selected.resultRows.slice(0, 10).map((row, index) => <TableRow key={`${selected.id}-${index}`}>{columns.map((column) => <TableCell className="whitespace-nowrap tabular-nums" key={column}>{formatCell(column, row[column] ?? null)}</TableCell>)}</TableRow>)}</TableBody></Table></CardContent></Card> : <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No hay filas disponibles para este ejemplo.</CardContent></Card>}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

export function DataSchemaPage() {
  const quality = useQuery({
    queryKey: ["schema-data-quality"],
    queryFn: () => api.dataQuality({}),
  });
  const workbench = useQuery({
    queryKey: ["schema-workbench"],
    queryFn: api.workbench,
  });
  const governance = useQuery({
    queryKey: ["schema-governance"],
    queryFn: api.governance,
  });
  if (quality.isLoading || workbench.isLoading || governance.isLoading)
    return <LoadingState cards={4} />;
  const error = quality.error ?? workbench.error ?? governance.error;
  if (error instanceof Error)
    return (
      <ErrorState
        error={error}
        retry={() => {
          void quality.refetch();
          void workbench.refetch();
          void governance.refetch();
        }}
      />
    );
  if (!quality.data || !workbench.data || !governance.data)
    return (
      <ErrorState
        error={new Error("No se recibieron los datos técnicos.")}
        retry={() => {
          void quality.refetch();
          void workbench.refetch();
          void governance.refetch();
        }}
      />
    );

  const data = quality.data;
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Modelo de datos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tablas, consultas, resultados y controles de calidad.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">9</strong> tablas fuente
          </span>
          <span>·</span>
          <span>
            <strong className="text-foreground">
              {percent.format(data.identity.traceabilityCoverage)}
            </strong>{" "}
            eventos enlazados
          </span>
          <span>·</span>
          <span>control {formatDateTime(data.generatedAt)}</span>
        </div>
      </header>

      <Tabs defaultValue="queries">
        <div className="overflow-x-auto border-b">
          <TabsList className="h-auto min-w-max rounded-none bg-transparent p-0">
            {(
              [
                ["flow", "Flujo"],
                ["tables", "Tablas"],
                ["queries", "Consultas"],
                ["quality", "Calidad"],
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

        <TabsContent className="space-y-5" value="flow">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {governance.data.architectureStages.map((stage, index) => {
              const Icon = [Database, TableProperties, FileInput, ServerCog, CheckCircle2, Braces][index % 6] ?? Database;
              return <FlowStage detail={stage.purpose} icon={Icon} key={stage.stage} owner={stage.owner} status={stage.status} step={String(stage.stage).padStart(2, "0")} title={stage.name} />;
            })}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Qué llega a cada pantalla</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pantalla</TableHead>
                    <TableHead>Datos</TableHead>
                    <TableHead>Actualización</TableHead>
                    <TableHead>Clave principal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [
                      "Landings",
                      "Sesiones, leads, SQL, altas y tasas",
                      "Diaria",
                      "URL",
                    ],
                    [
                      "Ficha de landing",
                      "Serie mensual, Google, CRM y datos del municipio",
                      "Diaria / mensual",
                      "URL + municipio + servicio",
                    ],
                    [
                      "Medición",
                      "Experimentos, grupos y resultados",
                      "Al cerrar cada lectura",
                      "experiment_id + municipio_id",
                    ],
                    [
                      "Calidad",
                      "Frescura, enlaces y reglas de integridad",
                      "Diaria",
                      "fuente + fecha",
                    ],
                  ].map(([screen, values, cadence, key]) => (
                    <TableRow key={screen}>
                      <TableCell className="font-semibold">{screen}</TableCell>
                      <TableCell>{values}</TableCell>
                      <TableCell>{cadence}</TableCell>
                      <TableCell>
                        <code className="text-xs">{key}</code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables"><TableCatalog /></TabsContent>

        <TabsContent value="queries">
          <QueryExplorer data={workbench.data} />
        </TabsContent>

        <TabsContent className="grid gap-5 xl:grid-cols-2" value="quality">
          <Card>
            <CardHeader>
              <CardTitle>Actualización por fuente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Último dato</TableHead>
                    <TableHead>Retraso</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.freshness.map((source) => (
                    <TableRow key={source.source}>
                      <TableCell className="font-medium">
                        {source.source}
                      </TableCell>
                      <TableCell>
                        {source.latestAt
                          ? formatDateTime(source.latestAt)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {source.lagDays === null
                          ? "—"
                          : `${integer.format(source.lagDays)} días`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          tone={
                            source.status === "healthy"
                              ? "success"
                              : source.status === "warning"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {source.status === "healthy"
                            ? "Correcto"
                            : source.status === "warning"
                              ? "Revisar"
                              : "Error"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reglas de integridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.integrity.map((check) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-md border p-3"
                  key={check.check}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={cn(
                        "size-4",
                        check.failures === 0
                          ? "text-emerald-600"
                          : "text-rose-600",
                      )}
                    />
                    <span className="text-sm font-medium">{check.check}</span>
                  </div>
                  <Badge
                    tone={
                      check.failures === 0
                        ? "success"
                        : check.severity === "error"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {integer.format(check.failures)} fallos
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Badge, Button, CardContent } from "@qida/ui";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { chartPalette, TrendChart } from "../components/charts";
import { DataTable, type DataColumn } from "../components/data-table";
import { ExplainablePanel, PageTitle, Panel, StatusBadge, SummaryCard } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type OpportunityRowData } from "../lib/api";
import { integer, percent, titleCase } from "../lib/format";
import { useFilters } from "../state/filters";

const opportunityColumns: Array<DataColumn<OpportunityRowData>> = [
  { id: "municipality", header: "Municipio", cell: (row) => <div><Link className="font-medium text-slate-950 hover:underline" to={`/opportunities/${row.municipalityId}/${encodeURIComponent(row.service)}`}>{row.municipality}</Link><p className="text-xs text-slate-400">{row.province}</p></div> },
  { id: "service", header: "Servicio", cell: (row) => row.service, hideBelow: "xl" },
  { id: "eligibility", header: "Estado", cell: (row) => <StatusBadge status={row.eligibility} /> },
  { id: "sql", header: "SQL", cell: (row) => integer.format(row.sql), align: "right" },
  { id: "altas", header: "Altas", cell: (row) => integer.format(row.altas), align: "right", hideBelow: "xl" },
  { id: "score", header: "Score", cell: (row) => <span className="font-semibold">{integer.format(row.score)}</span>, align: "right" },
];

const funnelQuery = `SELECT
  to_char(date_trunc('month', l.fecha_creacion), 'YYYY-MM') AS periodo,
  COUNT(*) AS leads,
  COUNT(*) FILTER (WHERE l.es_sql) AS sql,
  COUNT(*) FILTER (WHERE l.es_alta) AS altas
FROM lead l
LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
WHERE l.tipo_contacto <> 'cuidadora_empleo' /* + filtros activos */
GROUP BY 1
ORDER BY 1;`;

const conversionQuery = `SELECT
  to_char(date_trunc('month', l.fecha_creacion), 'YYYY-MM') AS periodo,
  COUNT(*) FILTER (WHERE fecha_creacion <= CURRENT_DATE - interval '90 days') AS leads_maduros,
  COUNT(*) FILTER (WHERE es_sql AND fecha_creacion <= CURRENT_DATE - interval '90 days') AS sql_maduros,
  COUNT(*) FILTER (WHERE es_alta AND fecha_creacion <= CURRENT_DATE - interval '90 days') AS altas_maduras
FROM lead l
WHERE l.tipo_contacto <> 'cuidadora_empleo' /* + filtros activos */
GROUP BY 1
HAVING COUNT(*) FILTER (WHERE fecha_creacion <= CURRENT_DATE - interval '90 days') > 0
ORDER BY 1;`;

const opportunitiesQuery = `WITH lead_stats AS (
  SELECT municipio_id, servicio,
    COUNT(*) FILTER (WHERE es_sql) AS sql,
    COUNT(*) FILTER (WHERE es_alta) AS altas
  FROM lead
  WHERE tipo_contacto <> 'cuidadora_empleo'
  GROUP BY municipio_id, servicio
)
SELECT m.nombre, d.tema, ls.sql, ls.altas, score
FROM motor_demanda_busqueda d
JOIN motor_municipio m USING (municipio_id)
LEFT JOIN lead_stats ls USING (municipio_id)
ORDER BY score DESC
LIMIT 6;`;

export function OverviewPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["overview", filters], queryFn: () => api.overview(filters) });
  const landingQuery = useQuery({ queryKey: ["overview-landings", filters], queryFn: () => api.landingInsights(filters, 1, 6) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;
  const conversionSeries = data.monthlyConversion.map((point) => ({
    period: point.period,
    leadToSql: Math.round(point.leadToSql * 1000) / 10,
    sqlToAlta: Math.round(point.sqlToAlta * 1000) / 10,
  }));

  return <div className="page-grid"><PageTitle title="Resumen" /><SummaryCard label="Leads observados" value={integer.format(data.kpis.leads)} detail="Oportunidades de familias en la selección activa" metrics={[
    { id: "summary-sql", label: "SQL", value: integer.format(data.kpis.sql), detail: `${percent.format(data.kpis.leadToSql)} de leads` },
    { id: "summary-altas", label: "Altas", value: integer.format(data.kpis.altas), detail: `${percent.format(data.kpis.sqlToAlta)} de SQL maduros` },
    { id: "summary-traceability", label: "Trazabilidad", value: percent.format(data.kpis.traceabilityCoverage) },
    { id: "summary-opportunities", label: "Municipios oportunidad", value: integer.format(data.kpis.opportunityMunicipalities) },
  ]} /><Panel title="Decisiones de landing pendientes" description="Páginas donde el evaluador recomienda iterar o detener" actions={<Button asChild size="sm" variant="ghost"><Link to="/landings">Abrir evaluador<ArrowRight className="size-4" /></Link></Button>} componentId="overview-landing-decisions"><CardContent className="grid gap-3 lg:grid-cols-3">{landingQuery.data?.items.filter((landing) => landing.diagnosis.decision !== "keep").slice(0, 3).map((landing) => <Link className="group rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50" key={landing.url} to={`/landings/insight?url=${encodeURIComponent(landing.url)}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-950 group-hover:underline">{landing.municipality}</p><p className="mt-1 text-xs text-slate-500">{landing.service ? titleCase(landing.service) : "Sin servicio"}</p></div><Badge tone={landing.diagnosis.decision === "stop" ? "danger" : "warning"}>{landing.diagnosis.decision === "stop" ? "Detener" : "Iterar"}</Badge></div><p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">{landing.diagnosis.headline}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs"><span className="text-slate-400">Evaluación</span><span className="font-semibold text-slate-950">{integer.format(landing.evaluation.overall)}/100</span></div></Link>)}{landingQuery.isLoading ? <p className="text-sm text-slate-400">Evaluando landings…</p> : null}</CardContent></Panel><div className="dashboard-paired-grid grid items-start gap-5"><ExplainablePanel title="Volumen del embudo" description="Leads, SQL y altas por mes" explanation="Las tres líneas muestran cuántas oportunidades entran y avanzan cada mes. La separación entre ellas representa pérdida de volumen entre etapas; no demuestra por sí sola qué canal causó la conversión." query={funnelQuery} queryExplanation="La consulta agrupa leads de familias por mes y cuenta sus estados persistidos. Excluye contactos de empleo de cuidadoras y añade los filtros activos de fecha, territorio, servicio, canal e idioma." componentId="overview-funnel-volume"><TrendChart data={data.monthlyFunnel} xKey="period" height="h-64" series={[
    { key: "leads", label: "Leads", color: chartPalette.danger },
    { key: "sql", label: "SQL", color: chartPalette.primary },
    { key: "altas", label: "Altas", color: chartPalette.tertiary },
  ]} /></ExplainablePanel><ExplainablePanel title="Eficiencia del embudo" description="Conversión mensual de cohortes maduras" explanation="Esta gráfica añade una lectura clave: qué porcentaje de leads llega a SQL y qué porcentaje de SQL madura termina en alta. Solo usa cohortes con al menos 90 días, para no penalizar artificialmente los meses recientes." query={conversionQuery} queryExplanation="La API cuenta leads, SQL y altas del mismo mes de creación cuando la cohorte ya ha madurado 90 días. Después calcula ambos cocientes con denominadores persistidos y protegidos frente a cero." componentId="overview-funnel-conversion"><TrendChart data={conversionSeries} xKey="period" height="h-64" series={[
    { key: "leadToSql", label: "Lead → SQL (%)", color: chartPalette.danger },
    { key: "sqlToAlta", label: "SQL → alta (%)", color: chartPalette.primary },
  ]} /></ExplainablePanel></div>
<ExplainablePanel title="Principales oportunidades" description="Municipios y servicios priorizados por reglas explicables" explanation="Cada fila combina demanda, conversión, cobertura y capacidad. El score ordena dónde conviene validar una oportunidad; no es una predicción de éxito." query={opportunitiesQuery} queryExplanation="La consulta agrega SQL y altas por municipio y servicio, cruza la demanda local y aplica la versión activa de las reglas. Los municipios sin cobertura quedan excluidos y la capacidad limitada penaliza el resultado." componentId="overview-opportunities-table" actions={<Button className="whitespace-nowrap" asChild variant="ghost" size="sm"><Link to="/opportunities">Ver todas<ArrowRight className="size-4" /></Link></Button>}><DataTable rows={data.opportunityRanking.slice(0, 6)} columns={opportunityColumns} rowKey={(row) => `${row.municipalityId}-${row.service}`} minWidth="min-w-0" rowDescription={(row) => `${row.municipality} aparece como ${row.eligibility === "eligible" ? "elegible" : row.eligibility === "constrained" ? "restringido por capacidad" : "no elegible"} para ${row.service}, con ${integer.format(row.sql)} SQL, ${integer.format(row.altas)} altas y un score explicable de ${integer.format(row.score)} sobre 100.`} /></ExplainablePanel></div>;
}

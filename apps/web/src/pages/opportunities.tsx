import { useQuery } from "@tanstack/react-query";
import type { GlobalFilters } from "@qida/contracts";
import { Badge, Button, Card, CardContent, Input, Skeleton, cn } from "@qida/ui";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  MapPin,
  Search,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { useId, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TablePagination } from "../components/data-table";
import { MetricStrip, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type OpportunityDetailData, type OpportunityRowData } from "../lib/api";
import { decimal, integer, percent, titleCase } from "../lib/format";
import { useFilters } from "../state/filters";

function signedContribution(value: number): string {
  if (value > 0) return `+${decimal.format(value)}`;
  if (value < 0) return decimal.format(value);
  return "0,0";
}

function contributionLabel(value: number): string {
  return `${value < 0 ? "Resta" : "Aporta"} ${signedContribution(value)} puntos`;
}

function ScoreSummary({ score }: { score: number }) {
  return (
    <div className="min-w-16 shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-center" aria-label={`Puntuación ${integer.format(score)} de 100`}>
      <p className="text-[10px] font-medium uppercase text-rose-600">Puntuación</p>
      <p className="mt-0.5 text-2xl font-semibold leading-none tabular-nums text-rose-700">{integer.format(score)}</p>
      <p className="mt-1 text-[10px] text-rose-500">de 100</p>
    </div>
  );
}

function OpportunitySignals({ opportunity, detailed = false }: { opportunity: OpportunityRowData; detailed?: boolean }) {
  const signals = [
    { label: "Búsquedas/mes", value: integer.format(opportunity.monthlySearches), detail: "Demanda observada", icon: TrendingUp },
    { label: "SQL", value: integer.format(opportunity.sql), detail: "Oportunidades cualificadas", icon: BarChart3 },
    { label: "Altas", value: integer.format(opportunity.altas), detail: `${percent.format(opportunity.sqlToAlta)} de SQL`, icon: CheckCircle2 },
    { label: "Cuidadoras", value: integer.format(opportunity.caregiversAvailable), detail: "Disponibles en 30 días", icon: Users },
  ];
  return (
    <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200", detailed ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-4")}>
      {signals.map((signal) => {
        const Icon = signal.icon;
        return <div className="min-w-0 bg-white p-3" key={signal.label}><div className="flex items-center gap-2 text-[10px] font-medium uppercase text-slate-500"><Icon className="size-3.5" />{signal.label}</div><p className="mt-2 text-lg font-semibold tabular-nums text-slate-950">{signal.value}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{signal.detail}</p></div>;
      })}
    </div>
  );
}

function OpportunityExplanation({ detail }: { detail: OpportunityDetailData }) {
  return (
    <div>
        <p className="mb-3 text-xs font-semibold text-slate-700">Cómo se calcula la puntuación</p>
        <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 sm:[&>*:last-child]:col-span-2">
          {detail.factors.map((factor) => (
            <div className="bg-white p-3" key={factor.key}>
              <div className="flex items-start justify-between gap-3"><p className="text-balance text-xs font-semibold text-slate-800">{factor.label}</p><Badge className="tabular-nums" tone={factor.contribution < 0 ? "warning" : "neutral"}>{contributionLabel(factor.contribution)}</Badge></div>
              <p className="mt-2 text-pretty text-[11px] leading-5 text-slate-500">{factor.evidence}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", factor.contribution < 0 ? "bg-amber-400" : "bg-rose-500")} style={{ width: `${Math.max(4, Math.min(100, factor.normalizedValue * 100))}%` }} /></div>
            </div>
          ))}
        </div>
    </div>
  );
}

function OpportunityCard({ opportunity, filters }: { opportunity: OpportunityRowData; filters: GlobalFilters }) {
  const [expanded, setExpanded] = useState(false);
  const explanationId = useId();
  const detailQuery = useQuery({
    queryKey: ["opportunity-preview", opportunity.municipalityId, opportunity.service, filters],
    queryFn: () => api.opportunity(opportunity.municipalityId, opportunity.service, filters),
    enabled: expanded,
  });

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md" data-component-id="opportunity-card">
      <CardContent className="p-0">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(240px,0.62fr)_minmax(0,1.38fr)] lg:items-center">
          <div className="flex min-w-0 items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={opportunity.selectionEligibility} /><Badge>{titleCase(opportunity.service)}</Badge><Badge tone="neutral">{opportunity.dataSource === "municipal_own" ? "Datos municipales" : "Agregado provincial"}</Badge></div>
              <Link className="mt-3 block truncate text-lg font-semibold text-slate-950 hover:text-rose-700 hover:underline" to={`/opportunities/${opportunity.municipalityId}/${encodeURIComponent(opportunity.service)}`}>{opportunity.municipality}</Link>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="size-3.5" />{opportunity.province} · {opportunity.municipalityId}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-500"><span>{opportunity.coverage ? "Con cobertura" : "Sin cobertura"}</span><span className="size-1 rounded-full bg-slate-300" /><span>{integer.format(opportunity.demandMonthsObserved)} meses de demanda</span><span className="size-1 rounded-full bg-slate-300" /><span>actualizado {opportunity.latestDemandMonth ?? "sin fecha"}</span></div>
            </div>
            <ScoreSummary score={opportunity.score} />
          </div>
          <div className="min-w-0">
            <OpportunitySignals opportunity={opportunity} />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] tabular-nums text-slate-400">{integer.format(opportunity.voiceSignals)} señales de voz de cliente</p>
              <div className="flex items-center gap-1">
                <Button asChild size="sm" variant="ghost"><Link rel="noreferrer" target="_blank" to={`/demo/${opportunity.municipalityId}/${encodeURIComponent(opportunity.service)}?version=cercana`}>Ver landing<ExternalLink className="size-3.5" /></Link></Button>
                <Button aria-controls={explanationId} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} size="sm" type="button" variant="ghost">{expanded ? "Ocultar cálculo" : "Ver cálculo"}<ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} /></Button>
              </div>
            </div>
          </div>
        </div>
        {expanded ? <div aria-label={`Explicación del score de ${opportunity.municipality}`} className="border-t border-slate-100 bg-slate-50/45 p-5" id={explanationId} role="region">{detailQuery.isLoading ? <div aria-label="Cargando explicación" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="grid gap-2 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Skeleton className="h-28" key={index} />)}</div><Skeleton className="h-48" /></div> : detailQuery.isError ? <div className="flex flex-col items-center gap-3 py-6 text-center"><p className="text-pretty text-sm text-rose-600">No se pudo cargar la explicación.</p><Button onClick={() => void detailQuery.refetch()} size="sm" type="button" variant="secondary">Reintentar</Button></div> : detailQuery.data ? <><OpportunityExplanation detail={detailQuery.data} /><div className="mt-4 flex justify-end"><Button asChild size="sm" variant="secondary"><Link to={`/opportunities/${opportunity.municipalityId}/${encodeURIComponent(opportunity.service)}`}>Abrir análisis completo<ArrowRight className="size-3.5" /></Link></Button></div></> : null}</div> : null}
      </CardContent>
    </Card>
  );
}

export function OpportunitiesPage() {
  const { filters } = useFilters();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["opportunities", filters, search, page], queryFn: () => api.opportunities(filters, page, 12, search) });
  if (query.isLoading) return <LoadingState cards={4} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const data = query.data;
  const items = data?.items ?? [];
  const eligible = items.filter((item) => item.selectionEligibility === "eligible").length;
  const averageScore = items.length ? items.reduce((sum, item) => sum + item.score, 0) / items.length : 0;
  const pageSql = items.reduce((sum, item) => sum + item.sql, 0);

  return (
    <div className="page-grid">
      <PageTitle title="Oportunidades" />
      <MetricStrip columns={4} items={[
        { id: "opportunities-total", label: "Combinaciones", value: integer.format(data?.total ?? 0), detail: "Municipio y servicio" },
        { id: "opportunities-eligible", label: "Elegibles", value: integer.format(eligible), detail: "En esta página" },
        { id: "opportunities-score", label: "Puntuación media", value: integer.format(averageScore), detail: "En esta página" },
        { id: "opportunities-sql", label: "SQL observados", value: integer.format(pageSql), detail: "En esta página" },
      ]} />
      <Card>
        <CardContent className="p-3">
          <form className="flex w-full gap-2" onSubmit={(event) => { event.preventDefault(); setSearch(input.trim()); setPage(1); }}><Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Buscar por municipio o servicio" aria-label="Buscar oportunidades" /><Button type="submit" size="icon" aria-label="Buscar"><Search className="size-4" /></Button></form>
        </CardContent>
      </Card>
      <div className="grid gap-3" aria-live="polite">{items.length ? items.map((opportunity) => <OpportunityCard filters={filters} key={`${opportunity.municipalityId}-${opportunity.service}`} opportunity={opportunity} />) : <Card><EmptyState action={search ? <Button onClick={() => { setInput(""); setSearch(""); setPage(1); }} size="sm" type="button" variant="secondary">Limpiar búsqueda</Button> : <Button asChild size="sm" variant="secondary"><Link to="/">Volver al resumen</Link></Button>} title="No hay oportunidades para esta selección" /></Card>}</div>
      <TablePagination page={page} pageSize={data?.pageSize ?? 12} total={data?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}

export function OpportunityDetailPage() {
  const { municipalityId = "", service = "" } = useParams();
  const { filters } = useFilters();
  const decodedService = decodeURIComponent(service);
  const query = useQuery({ queryKey: ["opportunity", municipalityId, service, filters], queryFn: () => api.opportunity(municipalityId, decodedService, filters), enabled: Boolean(municipalityId && service) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;

  return (
    <div className="page-grid">
      <div>
        <PageTitle title={`${data.municipality} · ${titleCase(data.service)}`} actions={<Button asChild variant="secondary" size="sm"><Link to="/opportunities"><ArrowLeft className="size-4" />Volver</Link></Button>} />
        <p className="mt-2 text-sm text-slate-500">{data.province} · {data.municipalityId} · reglas {data.rulesVersion}</p>
      </div>
      <MetricStrip columns={5} items={[
        { id: "opportunity-score", label: "Puntuación", value: integer.format(data.score), detail: "Reglas versionadas" },
        { id: "opportunity-searches", label: "Búsquedas mensuales", value: integer.format(data.monthlySearches) },
        { id: "opportunity-sql", label: "SQL observados", value: integer.format(data.sql) },
        { id: "opportunity-conversion", label: "SQL → alta", value: percent.format(data.sqlToAlta), detail: `${data.altas} altas` },
        { id: "opportunity-capacity", label: "Cuidadoras", value: integer.format(data.caregiversAvailable), detail: "Disponibles en 30 días" },
      ]} />
      <Card><CardContent><div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-950">Señales de oportunidad</p><div className="flex items-center gap-2"><Badge tone="neutral">{data.dataSource === "municipal_own" ? "Datos municipales" : "Agregado provincial"}</Badge><StatusBadge status={data.selectionEligibility} /></div></div><OpportunitySignals detailed opportunity={data} /></CardContent></Card>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Evidencia de las reglas" componentId="opportunity-rule-evidence"><CardContent className="divide-y divide-slate-100 p-0">{data.factors.map((factor) => <div key={factor.key} className="px-5 py-4"><div className="flex items-start justify-between gap-5"><div><p className="text-sm font-medium">{factor.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{factor.evidence}</p></div><Badge tone={factor.contribution < 0 ? "warning" : "neutral"}>{contributionLabel(factor.contribution)}</Badge></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", factor.contribution < 0 ? "bg-amber-400" : "bg-rose-500")} style={{ width: `${Math.max(4, Math.min(100, factor.normalizedValue * 100))}%` }} /></div></div>)}</CardContent></Panel>
        <Panel title="Elegibilidad para la prueba"><CardContent><StatusBadge status={data.selectionEligibility} /><div className="mt-4 space-y-2">{data.constraints.length ? data.constraints.map((constraint) => <div key={constraint} className="flex gap-2 text-sm text-slate-600"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />{constraint}</div>) : <div className="flex gap-2 text-sm text-slate-600"><CheckCircle2 className="size-4 text-emerald-500" />Cumple datos propios, cobertura, capacidad y demanda mínima.</div>}</div><p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400">{data.selectionRulesVersion} · demanda hasta {data.latestDemandMonth ?? "sin fecha"}</p></CardContent></Panel>
      </div>
      <Panel title="Versiones de la landing" componentId="opportunity-related-landings">
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {[
            { id: "cercana", label: "Cercana", focus: "Confianza y acompañamiento", image: "/images/cuidados-mayores-hero.png" },
            { id: "directa", label: "Directa", focus: "Servicio y contacto", image: "/images/acompanamiento-mayores.png" },
            { id: "local", label: "Local", focus: `Cobertura en ${data.municipality}`, image: "/images/cuidados-mayores-hero.png" },
          ].map((version) => {
            const href = `/demo/${municipalityId}/${encodeURIComponent(decodedService)}?version=${version.id}`;
            return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white" key={version.id}>
              <img alt="" className="h-36 w-full object-cover" src={version.image} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{version.label}</p><p className="mt-1 text-xs text-slate-500">{version.focus}</p></div><Badge>Demo</Badge></div>
                <p className="mt-4 truncate rounded-md bg-slate-50 px-2 py-1.5 font-mono text-[10px] text-slate-500">{href}</p>
                <Button className="mt-3 w-full" asChild size="sm" variant="secondary"><Link rel="noreferrer" target="_blank" to={href}>Abrir landing<ExternalLink className="size-3.5" /></Link></Button>
              </div>
            </article>;
          })}
        </CardContent>
      </Panel>
    </div>
  );
}

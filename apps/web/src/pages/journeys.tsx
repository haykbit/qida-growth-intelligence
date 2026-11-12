import { useQuery } from "@tanstack/react-query";
import { Badge, Button, CardContent, Input } from "@qida/ui";
import { ArrowLeft, CheckCircle2, CircleDashed, Copy, Link2, Search, ShieldQuestion } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DataTable, TablePagination, type DataColumn } from "../components/data-table";
import { EvidenceNotice, MetricStrip, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type JourneySummaryData } from "../lib/api";
import { formatDate, formatDateTime, titleCase } from "../lib/format";
import { useFilters } from "../state/filters";

const columns: Array<DataColumn<JourneySummaryData>> = [
  { id: "opportunity", header: "Oportunidad", cell: (row) => <Link to={`/journeys/${row.opportunityId}`} className="font-mono text-xs font-medium text-slate-950 hover:underline dark:text-white">{row.opportunityId}</Link> },
  { id: "municipality", header: "Municipio", cell: (row) => row.municipality },
  { id: "service", header: "Servicio", cell: (row) => row.service, hideBelow: "sm" },
  { id: "status", header: "Estado", cell: (row) => <StatusBadge status={row.status} /> },
  { id: "identity", header: "Identidad", cell: (row) => <StatusBadge status={row.identityStatus} /> },
  { id: "created", header: "Creación", cell: (row) => formatDate(row.createdAt), hideBelow: "md" },
  { id: "links", header: "Identidades enlazadas", cell: (row) => row.linkedIdentityCount ? <Badge><Copy className="size-3" />{row.linkedIdentityCount}</Badge> : "—", align: "right" },
];

const identityDetail = {
  confirmed: "Vínculo determinista confirmado",
  ambiguous: "Vínculo ambiguo; identidades separadas",
  unlinked: "Sin vínculo de identidad",
} as const;

export function JourneysPage() {
  const { filters } = useFilters();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["journeys", filters, search, page], queryFn: () => api.journeys(filters, search, page) });
  if (query.isLoading) return <LoadingState cards={0} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const data = query.data;

  return <div className="page-grid"><PageTitle title="Recorridos" /><Panel title={data ? `${data.total} oportunidades` : "Recorridos"} componentId="journeys-table" actions={<form className="flex w-full max-w-sm gap-2" onSubmit={(event) => { event.preventDefault(); setSearch(input.trim()); setPage(1); }}><Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="ID, municipio o servicio" aria-label="Buscar recorridos" /><Button type="submit" size="icon" aria-label="Buscar"><Search className="size-4" /></Button></form>}><DataTable rows={data?.items ?? []} columns={columns} rowKey={(row) => row.opportunityId} minWidth="min-w-[760px]" /><TablePagination page={page} pageSize={data?.pageSize ?? 25} total={data?.total ?? 0} onPageChange={setPage} /></Panel></div>;
}

export function JourneyDetailPage() {
  const { opportunityId = "" } = useParams();
  const query = useQuery({ queryKey: ["journey", opportunityId], queryFn: () => api.journey(opportunityId), enabled: Boolean(opportunityId) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const data = query.data;

  return <div className="page-grid"><PageTitle title={`${data.municipality} · ${data.service}`} actions={<Button asChild variant="secondary" size="sm"><Link to="/journeys"><ArrowLeft className="size-4" />Volver</Link></Button>} /><MetricStrip columns={3} items={[
    { id: "journey-status", label: "Estado", value: titleCase(data.status), detail: formatDate(data.createdAt) },
    { id: "journey-identity", label: "Identidad", value: titleCase(data.identityStatus), detail: identityDetail[data.identityStatus] },
    { id: "journey-events", label: "Eventos", value: String(data.events.length), detail: `${data.events.filter((event) => event.observed).length} observados` },
  ]} /><div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]"><Panel title="Cronología" componentId="journey-timeline"><CardContent>{data.events.length ? <ol className="relative ml-2 border-l border-slate-200 pl-7 dark:border-slate-700">{data.events.map((event) => <li key={event.eventId} className="relative pb-6 last:pb-0"><div className={`absolute -left-[37px] top-0.5 grid size-5 place-items-center rounded-full ring-4 ring-white dark:ring-slate-900 ${event.observed ? "bg-brand-500 text-white" : "border border-dashed border-violet-400 bg-white text-violet-500 dark:bg-slate-900"}`}>{event.observed ? <CheckCircle2 className="size-3" /> : <CircleDashed className="size-3" />}</div><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-medium">{titleCase(event.eventType)}</p><p className="mt-0.5 text-xs text-slate-500">{formatDateTime(event.occurredAt)} · {event.sourceSystem}</p></div><div className="flex gap-1"><Badge tone={event.observed ? "success" : "violet"}>{event.observed ? "Observado" : "Inferido"}</Badge>{event.identityStatus !== "confirmed" ? <StatusBadge status={event.identityStatus} /> : null}</div></div><div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">{event.channel ? <Badge>{event.channel}</Badge> : null}{event.campaign ? <Badge>{event.campaign}</Badge> : null}{event.landingUrl ? <span className="max-w-full truncate font-mono">{event.landingUrl}</span> : null}</div></li>)}</ol> : <EmptyState />}</CardContent></Panel><div className="space-y-4"><Panel title="Identidades enlazadas"><CardContent className="space-y-3">{data.identities.map((identity) => <div key={`${identity.sourceSystem}-${identity.pseudonym}`} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2">{identity.ambiguous ? <ShieldQuestion className="size-4 text-amber-500" /> : <Link2 className="size-4 text-emerald-500" />}<span className="text-sm font-medium">{identity.sourceSystem}</span></div><Badge tone={identity.ambiguous ? "warning" : "success"}>{identity.ambiguous ? "Ambigua" : "Confirmada"}</Badge></div><p className="mt-2 font-mono text-xs text-slate-500">{identity.pseudonym}</p><p className="mt-1 text-xs text-slate-400">{identity.method}</p></div>)}</CardContent></Panel><Panel title="Atribución"><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[11px] text-slate-400">Primer contacto</p><p className="mt-1 text-sm font-medium">{data.attribution.firstTouch ?? "Sin atribuir"}</p></div><div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[11px] text-slate-400">Último contacto</p><p className="mt-1 text-sm font-medium">{data.attribution.lastTouch ?? "Sin atribuir"}</p></div></div>{data.attribution.multiTouch.map((touch) => <div key={touch.channel} className="flex items-center justify-between text-sm"><span>{touch.channel}</span><Badge>{touch.touches}</Badge></div>)}</CardContent></Panel></div></div><EvidenceNotice level="attribution">{data.warning}</EvidenceNotice></div>;
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { landingDraftRequestSchema, type LandingDraftRequest } from "@qida/contracts";
import { Badge, Button, Dialog, Input, Select } from "@qida/ui";
import { CheckCircle2, Eye, Plus, Rocket, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DataTable, type DataColumn } from "../components/data-table";
import { EvidenceNotice, PageTitle, Panel, StatusBadge } from "../components/data-display";
import { ErrorState, LoadingState } from "../components/feedback";
import { api, type LandingData } from "../lib/api";
import { formatDate, integer } from "../lib/format";
import { useFilters } from "../state/filters";

const blocks = [{ value: "hero", label: "Hero" }, { value: "coverage", label: "Cobertura" }, { value: "how_it_works", label: "Cómo funciona" }, { value: "faq", label: "Preguntas frecuentes" }, { value: "contact", label: "Contacto" }] as const;

function DraftForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const options = useQuery({ queryKey: ["filter-options"], queryFn: api.filters });
  const form = useForm<LandingDraftRequest>({ resolver: zodResolver(landingDraftRequestSchema), defaultValues: { municipalityId: "", language: "es", service: "", blocks: ["hero", "coverage", "how_it_works", "contact"] } });
  const mutation = useMutation({ mutationFn: api.draftLanding, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["landings"] }); } });
  if (mutation.data) return <div><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950"><div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-200"><CheckCircle2 className="size-5" />Borrador generado</div><p className="mt-2 break-all font-mono text-xs text-emerald-700 dark:text-emerald-300">{mutation.data.landing.url}</p><p className="mt-2 text-xs text-emerald-700">Auditoría: {mutation.data.auditId}</p></div><p className="mt-4 text-sm leading-6 text-slate-500">El contenido se ha creado de forma determinista con datos estructurados. Aún necesita validación y aprobación humana.</p><Button className="mt-5 w-full" onClick={onClose}>Ver inventario</Button></div>;
  return <form className="space-y-5" onSubmit={form.handleSubmit((value) => mutation.mutate(value))}><label className="block text-sm font-medium">Municipio<Controller name="municipalityId" control={form.control} render={({ field }) => <Select className="mt-2" {...field}><option value="">Selecciona un municipio</option>{options.data?.municipalities.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select>} />{form.formState.errors.municipalityId ? <span className="mt-1 text-xs text-rose-600">Selecciona un municipio.</span> : null}</label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Servicio<Controller name="service" control={form.control} render={({ field }) => <Select className="mt-2" {...field}><option value="">Selecciona un servicio</option>{options.data?.services.map((option) => <option key={option} value={option}>{option}</option>)}</Select>} /></label><label className="block text-sm font-medium">Idioma<Controller name="language" control={form.control} render={({ field }) => <Select className="mt-2" {...field}><option value="es">Español</option><option value="ca">Català</option></Select>} /></label></div><fieldset><legend className="text-sm font-medium">Bloques del borrador</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{blocks.map((block) => <Controller key={block.value} name="blocks" control={form.control} render={({ field }) => <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"><Input className="size-4" type="checkbox" checked={field.value.includes(block.value)} onChange={(event) => field.onChange(event.target.checked ? [...field.value, block.value] : field.value.filter((value) => value !== block.value))} />{block.label}</label>} />)}</div></fieldset><div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-800">La generación no publica precios, testimonios, afirmaciones sanitarias ni cifras no verificadas. La cobertura y capacidad se validan antes de publicar.</div>{mutation.isError ? <p role="alert" className="text-sm text-rose-600">{mutation.error.message}</p> : null}<Button className="w-full" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Generando…" : <><Plus className="size-4" />Generar borrador</>}</Button></form>;
}

function LandingActions({ landing }: { landing: LandingData }) {
  const client = useQueryClient();
  const action = landing.status === "draft" ? "review" : landing.status === "pending_review" ? "approve" : landing.status === "approved" ? "publish" : null;
  const mutation = useMutation({ mutationFn: (next: "review" | "approve" | "publish") => api.transitionLanding(landing.url, next), onSuccess: () => void client.invalidateQueries({ queryKey: ["landings"] }) });
  if (!action) return <span className="text-xs text-slate-400">Sin acciones</span>;
  const labels = { review: "Enviar a revisión", approve: "Aprobar", publish: "Publicar" };
  const icons = { review: Send, approve: ShieldCheck, publish: Rocket };
  const Icon = icons[action];
  return <div><Button size="sm" variant={action === "publish" ? "primary" : "secondary"} onClick={() => mutation.mutate(action)} disabled={mutation.isPending}><Icon className="size-4" />{mutation.isPending ? "Procesando…" : labels[action]}</Button>{mutation.isError ? <p className="mt-1 max-w-48 text-xs text-rose-600">{mutation.error.message}</p> : null}</div>;
}

const columns: Array<DataColumn<LandingData>> = [
  { id: "url", header: "URL", cell: (landing) => <div className="max-w-64"><div className="flex items-center gap-2"><Eye className="size-4 shrink-0 text-slate-400" /><span className="truncate font-mono text-xs">{landing.url}</span></div>{landing.validationIssues?.length ? <p className="mt-1 text-xs text-amber-600">{landing.validationIssues.length} validaciones pendientes</p> : null}</div> },
  { id: "place", header: "Municipio / servicio", cell: (landing) => <div><p>{landing.municipality ?? landing.municipalityId ?? "General"}</p><p className="text-xs text-slate-400">{landing.service ?? "—"}</p></div> },
  { id: "origin", header: "Origen", cell: (landing) => <Badge>{landing.origin}</Badge>, hideBelow: "md" },
  { id: "language", header: "Idioma", cell: (landing) => landing.language.toUpperCase(), hideBelow: "lg" },
  { id: "status", header: "Estado", cell: (landing) => <StatusBadge status={landing.status} /> },
  { id: "published", header: "Publicación", cell: (landing) => landing.publishedAt ? formatDate(landing.publishedAt) : "—", hideBelow: "lg" },
  { id: "performance", header: "Rendimiento", cell: (landing) => <span className="text-xs text-slate-500">{landing.sessions} sesiones · {landing.sql} SQL</span>, hideBelow: "sm" },
  { id: "action", header: "Acción", cell: (landing) => <LandingActions landing={landing} /> },
];

export function LandingsPage() {
  const { filters } = useFilters();
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ["landings", filters], queryFn: () => api.landings(filters) });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const rows = query.data?.items ?? [];
  return <div className="page-grid"><PageTitle title="Fábrica de landings" actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" />Nuevo borrador</Button>} /><EvidenceNotice level="quality">La publicación es local y simulada. Una página solo avanza tras validación, cobertura suficiente y transición de aprobación humana.</EvidenceNotice><Panel title="Inventario de landings" description={query.data ? `${integer.format(query.data.total)} páginas` : undefined} componentId="landings-inventory"><DataTable rows={rows} columns={columns} rowKey={(landing) => landing.url} minWidth="min-w-[900px]" emptyTitle="Aún no hay landings" /></Panel><Dialog open={open} title="Generar landing local" description="Borrador determinista desde señales y cobertura persistidas." onClose={() => setOpen(false)}><DraftForm onClose={() => setOpen(false)} /></Dialog></div>;
}

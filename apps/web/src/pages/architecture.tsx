import { Badge, CardContent } from "@qida/ui";
import { Activity, ArrowDown, ArrowRight, CheckCircle2, CloudCog, GitBranch, HardDrive, ShieldCheck, UserCheck } from "lucide-react";
import { DataTable, type DataColumn } from "../components/data-table";
import { PageTitle, Panel } from "../components/data-display";

type Mode = "Existente" | "Propuesto" | "Simulado";
const modeTone = { Existente: "success", Propuesto: "info", Simulado: "warning" } as const;

const flow: Array<{ name: string; detail: string; mode: Mode }> = [
  { name: "Databricks", detail: "Productos de datos", mode: "Propuesto" },
  { name: "Growth Intelligence", detail: "Modelo persistido y API", mode: "Existente" },
  { name: "Priorización", detail: "Reglas y evidencia", mode: "Existente" },
  { name: "Fábrica de landings", detail: "Activo de activación", mode: "Existente" },
  { name: "Validación", detail: "Cobertura y contenido", mode: "Existente" },
  { name: "Aprobación humana", detail: "Paso obligatorio", mode: "Simulado" },
  { name: "Strapi", detail: "Publicación CMS", mode: "Propuesto" },
  { name: "Adquisición", detail: "SEO y medios", mode: "Existente" },
  { name: "CRM", detail: "SQL y altas", mode: "Propuesto" },
  { name: "Medición", detail: "Cohortes y atribución", mode: "Existente" },
  { name: "Aprendizaje", detail: "Continuar, modificar o parar", mode: "Existente" },
];

type OwnershipRow = { scope: string; team: string; tool: string };
const ownership: OwnershipRow[] = [
  { scope: "Datos fuente", team: "Plataforma de datos", tool: "Databricks" },
  { scope: "Métricas y reglas", team: "Analítica de Growth", tool: "PostgreSQL + API" },
  { scope: "Activación", team: "Growth + operaciones locales", tool: "Fábrica de landings" },
  { scope: "Publicación", team: "Operaciones de contenido", tool: "Aprobación + Strapi" },
  { scope: "Resultado comercial", team: "Ventas + Care Ops", tool: "CRM" },
];
const ownershipColumns: Array<DataColumn<OwnershipRow>> = [
  { id: "scope", header: "Ámbito", cell: (row) => row.scope },
  { id: "team", header: "Equipo", cell: (row) => row.team },
  { id: "tool", header: "Herramienta", cell: (row) => row.tool },
];

export function ArchitecturePage() {
  const integrations = [
    { icon: HardDrive, title: "Ejecución local", text: "PostgreSQL, datos deterministas, API, reglas, validaciones y auditoría.", badge: "Existente" as const },
    { icon: UserCheck, title: "Aprobación", text: "El rol local simula la transición humana previa a publicar.", badge: "Simulado" as const },
    { icon: CloudCog, title: "Sistemas externos", text: "Databricks, Strapi, plataformas publicitarias y CRM mantienen fronteras documentadas.", badge: "Propuesto" as const },
  ];
  const monitoring = [
    { icon: Activity, title: "Pipelines", items: ["Frescura por fuente", "Versión de carga", "Eventos tardíos"] },
    { icon: ShieldCheck, title: "Datos", items: ["Integridad referencial", "Campos incompletos", "Identidad ambigua"] },
    { icon: GitBranch, title: "Decisiones", items: ["Versión de reglas", "Fuente de métrica", "ID de auditoría"] },
    { icon: CheckCircle2, title: "Activación", items: ["Cobertura", "Capacidad", "Aprobación humana"] },
  ];

  return <div className="page-grid">
    <PageTitle title="Arquitectura y gobierno" />
    <Panel title="Flujo operativo"><CardContent><div className="flex flex-col items-stretch gap-2 xl:flex-row xl:flex-wrap xl:items-center">
      {flow.map((step, index) => <div key={step.name} className="contents"><div className="min-w-40 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{step.name}</p><Badge tone={modeTone[step.mode]}>{step.mode}</Badge></div><p className="mt-1 text-xs text-slate-500">{step.detail}</p></div>{index < flow.length - 1 ? <ArrowRight className="hidden size-4 shrink-0 text-slate-300 xl:block" /> : null}{index < flow.length - 1 ? <ArrowDown className="mx-auto size-4 text-slate-300 xl:hidden" /> : null}</div>)}
    </div></CardContent></Panel>
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Responsabilidades"><DataTable rows={ownership} columns={ownershipColumns} rowKey={(row) => row.scope} minWidth="min-w-[560px]" /></Panel>
      <Panel title="Integraciones"><CardContent className="space-y-3">{integrations.map((item) => <div key={item.title} className="flex gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800"><item.icon className="size-4" /></div><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{item.title}</p><Badge tone={modeTone[item.badge]}>{item.badge}</Badge></div><p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p></div></div>)}</CardContent></Panel>
    </div>
    <Panel title="Gobierno y monitorización"><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{monitoring.map((group) => <section key={group.title} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><group.icon className="size-5 text-brand-600" /><h3 className="mt-3 text-sm font-semibold">{group.title}</h3><ul className="mt-2 space-y-1 text-xs text-slate-500">{group.items.map((item) => <li key={item}>• {item}</li>)}</ul></section>)}</CardContent></Panel>
  </div>;
}

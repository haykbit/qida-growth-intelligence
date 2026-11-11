import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Input, Select, cn } from "@qida/ui";
import { BarChart3, Beaker, Blocks, BookOpenCheck, ChevronDown, CircleGauge, Factory, Filter, Menu, Moon, MousePointerClick, Route, Search, ShieldCheck, Sun, Target, TerminalSquare, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { useFilters } from "../state/filters";

type NavigationItem = { to: string; label: string; icon: LucideIcon };

export const navigationGroups: Array<{ label: string; items: NavigationItem[]; primary?: boolean }> = [
  {
    label: "Principal",
    primary: true,
    items: [
      { to: "/", label: "Resumen", icon: CircleGauge },
      { to: "/opportunities", label: "Oportunidades", icon: Target },
      { to: "/journeys", label: "Recorridos", icon: Route },
      { to: "/landings", label: "Fábrica de landings", icon: Factory },
      { to: "/strategy", label: "Estrategia", icon: Target },
    ],
  },
  {
    label: "Análisis",
    items: [
      { to: "/funnel", label: "Embudo", icon: BarChart3 },
      { to: "/seo", label: "SEO", icon: Search },
      { to: "/paid-media", label: "Medios de pago", icon: MousePointerClick },
      { to: "/experiments", label: "Experimentos", icon: Beaker },
      { to: "/data-quality", label: "Calidad de datos", icon: ShieldCheck },
      { to: "/workbench", label: "Banco SQL", icon: TerminalSquare },
    ],
  },
  {
    label: "Contexto",
    items: [
      { to: "/architecture", label: "Arquitectura", icon: Blocks },
      { to: "/case-study", label: "Modo entrevista", icon: BookOpenCheck },
    ],
  },
];

const allNavigation = navigationGroups.flatMap((group) => group.items);

function NavigationLink({ item, close }: { item: NavigationItem; close: () => void }) {
  return <NavLink to={item.to} end={item.to === "/"} onClick={close} className={({ isActive }) => cn("flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors", isActive ? "bg-slate-800 font-medium text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100")}><item.icon className="size-4 shrink-0" /><span>{item.label}</span></NavLink>;
}

function Sidebar({ mobileOpen, close }: { mobileOpen: boolean; close: () => void }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => new Set(navigationGroups.filter((group) => !group.primary && group.items.some((item) => location.pathname.startsWith(item.to))).map((group) => group.label)));
  useEffect(() => {
    const activeGroup = navigationGroups.find((group) => !group.primary && group.items.some((item) => location.pathname.startsWith(item.to)));
    if (activeGroup) setExpanded((current) => new Set(current).add(activeGroup.label));
  }, [location.pathname]);
  const toggle = (label: string) => setExpanded((current) => { const next = new Set(current); if (next.has(label)) next.delete(label); else next.add(label); return next; });
  return <><button className={cn("fixed inset-0 z-30 bg-slate-950/40 lg:hidden", mobileOpen ? "block" : "hidden")} onClick={close} aria-label="Cerrar navegación" /><aside className={cn("fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}><div className="flex h-14 items-center gap-3 border-b border-slate-800 px-4"><div className="grid size-7 place-items-center rounded-lg bg-brand-500 text-xs font-bold text-white">Q</div><span className="text-sm font-semibold">Qida</span><Button className="ml-auto text-slate-400 lg:hidden" variant="ghost" size="icon" onClick={close} aria-label="Cerrar navegación"><X className="size-4" /></Button></div><nav className="flex-1 overflow-y-auto p-3" aria-label="Navegación principal"><div className="space-y-1">{navigationGroups[0]?.items.map((item) => <NavigationLink key={item.to} item={item} close={close} />)}</div>{navigationGroups.slice(1).map((group) => { const open = expanded.has(group.label); return <section key={group.label} className="mt-4 border-t border-slate-800 pt-3"><button className="flex h-8 w-full items-center justify-between px-3 text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-300" onClick={() => toggle(group.label)} aria-expanded={open}>{group.label}<ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} /></button>{open ? <div className="mt-1 space-y-1">{group.items.map((item) => <NavigationLink key={item.to} item={item} close={close} />)}</div> : null}</section>; })}</nav></aside></>;
}

function GlobalFilters({ close }: { close: () => void }) {
  const { filters, setFilter, clearFilters, activeCount } = useFilters();
  const options = useQuery({ queryKey: ["filter-options"], queryFn: api.filters, staleTime: 5 * 60_000 });
  return <><button className="fixed inset-0 z-30 bg-slate-950/15" onClick={close} aria-label="Cerrar filtros" /><section className="fixed inset-x-3 top-16 z-40 mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900" aria-label="Filtros globales"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold">Filtros</h2>{activeCount ? <p className="mt-0.5 text-xs text-slate-500">{activeCount} activos</p> : null}</div><Button variant="ghost" size="icon" onClick={close} aria-label="Cerrar filtros"><X className="size-4" /></Button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs text-slate-500">Desde<Input className="mt-1 h-9" type="date" value={filters.from ?? ""} onChange={(event) => setFilter("from", event.target.value || undefined)} /></label><label className="text-xs text-slate-500">Hasta<Input className="mt-1 h-9" type="date" value={filters.to ?? ""} onChange={(event) => setFilter("to", event.target.value || undefined)} /></label><label className="text-xs text-slate-500">Provincia<Select className="mt-1 h-9" value={filters.province ?? ""} onChange={(event) => setFilter("province", event.target.value || undefined)}><option value="">Todas</option>{options.data?.provinces.map((option) => <option key={option} value={option}>{option}</option>)}</Select></label><label className="text-xs text-slate-500">Municipio<Select className="mt-1 h-9" value={filters.municipalityId ?? ""} onChange={(event) => setFilter("municipalityId", event.target.value || undefined)}><option value="">Todos</option>{options.data?.municipalities.filter((option) => !filters.province || option.province === filters.province).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label><label className="text-xs text-slate-500">Servicio<Select className="mt-1 h-9" value={filters.service ?? ""} onChange={(event) => setFilter("service", event.target.value || undefined)}><option value="">Todos</option>{options.data?.services.map((option) => <option key={option} value={option}>{option}</option>)}</Select></label><label className="text-xs text-slate-500">Canal<Select className="mt-1 h-9" value={filters.channel ?? ""} onChange={(event) => setFilter("channel", event.target.value || undefined)}><option value="">Todos</option>{options.data?.channels.map((option) => <option key={option} value={option}>{option}</option>)}</Select></label><label className="text-xs text-slate-500">Idioma<Select className="mt-1 h-9" value={filters.language ?? ""} onChange={(event) => setFilter("language", event.target.value === "es" || event.target.value === "ca" ? event.target.value : undefined)}><option value="">Todos</option>{options.data?.languages?.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}</Select></label></div><div className="mt-4 flex justify-end gap-2">{activeCount ? <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar</Button> : null}<Button size="sm" onClick={close}>Aplicar</Button></div>{options.isError ? <p className="mt-2 text-xs text-rose-600">No se pudieron cargar las opciones.</p> : null}</section></>;
}

function Header({ menu }: { menu: () => void }) {
  const location = useLocation();
  const { activeCount } = useFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("qida-theme") === "dark" || (!localStorage.getItem("qida-theme") && matchMedia("(prefers-color-scheme: dark)").matches));
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("qida-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => setFiltersOpen(false), [location.pathname]);
  const current = allNavigation.filter((item) => item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)).sort((a, b) => b.to.length - a.to.length)[0];
  return <><header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-6"><Button className="lg:hidden" variant="ghost" size="icon" onClick={menu} aria-label="Abrir navegación"><Menu className="size-5" /></Button><span className="truncate text-sm font-medium">{current?.label ?? "Growth Intelligence"}</span><div className="ml-auto flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => setFiltersOpen(true)} aria-label="Filtros" aria-expanded={filtersOpen}><Filter className="size-4" /><span className="hidden sm:inline">Filtros</span>{activeCount ? <Badge>{activeCount}</Badge> : null}</Button><Button variant="ghost" size="icon" onClick={() => setDark((value) => !value)} aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}>{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button></div></header>{filtersOpen ? <GlobalFilters close={() => setFiltersOpen(false)} /> : null}</>;
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);
  return <div className="min-h-screen"><Sidebar mobileOpen={mobileOpen} close={() => setMobileOpen(false)} /><div className="min-h-screen lg:ml-56"><div className="sticky top-0 z-20"><Header menu={() => setMobileOpen(true)} /></div><main className="mx-auto max-w-[1440px] p-4 lg:p-6"><Outlet /></main></div></div>;
}

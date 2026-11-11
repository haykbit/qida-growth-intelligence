import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Input, Select, cn } from "@qida/ui";
import { Activity, BarChart3, Beaker, Blocks, BookOpenCheck, Building2, ChevronRight, CircleGauge, Factory, Filter, Menu, Moon, MousePointerClick, PanelLeftClose, Route, Search, ShieldCheck, Sun, Target, TerminalSquare, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { useFilters } from "../state/filters";

const navigation = [
  { to: "/", label: "Overview", icon: CircleGauge },
  { to: "/opportunities", label: "Opportunities", icon: Target },
  { to: "/journeys", label: "Customer Journeys", icon: Route },
  { to: "/funnel", label: "Funnel", icon: BarChart3 },
  { to: "/landings", label: "Landing Factory", icon: Factory },
  { to: "/seo", label: "SEO", icon: Search },
  { to: "/paid-media", label: "Paid Media", icon: MousePointerClick },
  { to: "/experiments", label: "Experiments", icon: Beaker },
  { to: "/data-quality", label: "Data Quality", icon: ShieldCheck },
  { to: "/strategy", label: "Strategy & Roadmap", icon: Target },
  { to: "/workbench", label: "Analytics Workbench", icon: TerminalSquare },
  { to: "/architecture", label: "Architecture", icon: Blocks },
  { to: "/case-study", label: "Interview Mode", icon: BookOpenCheck },
];

function Sidebar({ collapsed, mobileOpen, onCollapse, onMobileClose }: { collapsed: boolean; mobileOpen: boolean; onCollapse: () => void; onMobileClose: () => void }) {
  return <><div className={cn("fixed inset-0 z-30 bg-slate-950/40 lg:hidden", mobileOpen ? "block" : "hidden")} onClick={onMobileClose} /><aside className={cn("fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition-all duration-200", collapsed ? "lg:w-[76px]" : "lg:w-64", mobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0")}><div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-950/30"><Activity className="size-5" /></div>{!collapsed ? <div className="min-w-0"><p className="truncate text-sm font-semibold">Growth Intelligence</p><p className="text-[11px] text-slate-400">Qida · synthetic workspace</p></div> : null}<Button className="ml-auto lg:hidden" variant="ghost" size="icon" onClick={onMobileClose}><X className="size-4" /></Button></div><nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navegación principal">{navigation.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={onMobileClose} title={collapsed ? item.label : undefined} className={({ isActive }) => cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100", collapsed && "lg:justify-center lg:px-0")}><item.icon className="size-4.5 shrink-0" />{!collapsed ? <span>{item.label}</span> : null}</NavLink>)}</nav><div className="border-t border-slate-800 p-3"><Button className="hidden w-full text-slate-400 hover:bg-slate-900 hover:text-white lg:flex" variant="ghost" size={collapsed ? "icon" : "sm"} onClick={onCollapse}>{collapsed ? <ChevronRight className="size-4" /> : <><PanelLeftClose className="size-4" />Contraer</>}</Button></div></aside></>;
}

function GlobalFilters({ open, close }: { open: boolean; close: () => void }) {
  const { filters, setFilter, clearFilters, activeCount } = useFilters();
  const options = useQuery({ queryKey: ["filter-options"], queryFn: api.filters, staleTime: 5 * 60_000 });
  return <div className={cn("border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:px-6", open ? "block" : "hidden lg:block")}><div className="flex flex-wrap items-end gap-2"><label className="min-w-36 flex-1 text-xs text-slate-500">Desde<Input className="mt-1 h-9" type="date" value={filters.from ?? ""} onChange={(event) => setFilter("from", event.target.value || undefined)} /></label><label className="min-w-36 flex-1 text-xs text-slate-500">Hasta<Input className="mt-1 h-9" type="date" value={filters.to ?? ""} onChange={(event) => setFilter("to", event.target.value || undefined)} /></label><label className="min-w-40 flex-1 text-xs text-slate-500">Provincia<Select className="mt-1 h-9" value={filters.province ?? ""} onChange={(event) => setFilter("province", event.target.value || undefined)}><option value="">Todas</option>{options.data?.provinces.map((option) => <option key={option} value={option}>{option}</option>)}</Select></label><label className="min-w-48 flex-[1.4] text-xs text-slate-500">Municipio<Select className="mt-1 h-9" value={filters.municipalityId ?? ""} onChange={(event) => setFilter("municipalityId", event.target.value || undefined)}><option value="">Todos</option>{options.data?.municipalities.filter((option) => !filters.province || option.province === filters.province).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label><label className="min-w-40 flex-1 text-xs text-slate-500">Servicio<Select className="mt-1 h-9" value={filters.service ?? ""} onChange={(event) => setFilter("service", event.target.value || undefined)}><option value="">Todos</option>{options.data?.services.map((option) => <option key={option} value={option}>{option}</option>)}</Select></label><label className="min-w-36 flex-1 text-xs text-slate-500">Canal<Select className="mt-1 h-9" value={filters.channel ?? ""} onChange={(event) => setFilter("channel", event.target.value || undefined)}><option value="">Todos</option>{options.data?.channels.map((option) => <option key={option} value={option}>{option}</option>)}</Select></label><label className="min-w-28 flex-1 text-xs text-slate-500">Idioma<Select className="mt-1 h-9" value={filters.language ?? ""} onChange={(event) => setFilter("language", event.target.value === "es" || event.target.value === "ca" ? event.target.value : undefined)}><option value="">Todos</option>{options.data?.languages?.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}</Select></label>{activeCount ? <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar <Badge>{activeCount}</Badge></Button> : null}<Button className="lg:hidden" variant="secondary" size="sm" onClick={close}>Aplicar</Button></div>{options.isError ? <p className="mt-2 text-xs text-rose-600">No se pudieron cargar las opciones. Los filtros de fecha siguen disponibles.</p> : null}</div>;
}

function Header({ onMenu }: { onMenu: () => void }) {
  const { activeCount } = useFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("qida-theme") === "dark" || (!localStorage.getItem("qida-theme") && matchMedia("(prefers-color-scheme: dark)").matches));
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("qida-theme", dark ? "dark" : "light"); }, [dark]);
  return <><header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-6"><Button className="lg:hidden" variant="ghost" size="icon" onClick={onMenu}><Menu className="size-5" /></Button><div className="flex min-w-0 items-center gap-2 text-sm"><Building2 className="size-4 text-brand-600" /><span className="truncate font-medium">Qida Growth</span><span className="text-slate-300 dark:text-slate-700">/</span><span className="hidden text-slate-500 sm:inline">Intelligence workspace</span></div><div className="ml-auto flex items-center gap-2"><Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setFiltersOpen((value) => !value)}><Filter className="size-4" />Filtros{activeCount ? <Badge>{activeCount}</Badge> : null}</Button><Button variant="ghost" size="icon" onClick={() => setDark((value) => !value)} aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}>{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><div className="hidden items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-800 sm:flex"><div className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-100">GI</div><div><p className="text-xs font-medium">Growth Intelligence</p><p className="text-[10px] text-slate-400">Entorno local</p></div></div></div></header><GlobalFilters open={filtersOpen} close={() => setFiltersOpen(false)} /></>;
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("qida-sidebar") === "collapsed");
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const toggle = () => { const next = !collapsed; setCollapsed(next); localStorage.setItem("qida-sidebar", next ? "collapsed" : "expanded"); };
  return <div className="min-h-screen"><Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCollapse={toggle} onMobileClose={() => setMobileOpen(false)} /><div className={cn("min-h-screen transition-[margin] duration-200", collapsed ? "lg:ml-[76px]" : "lg:ml-64")}><div className="sticky top-0 z-20"><Header onMenu={() => setMobileOpen(true)} /></div><main className="mx-auto max-w-[1600px] p-4 lg:p-6"><Outlet /></main></div></div>;
}

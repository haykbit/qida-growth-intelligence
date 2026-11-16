import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Input, Select, cn } from "@qida/ui";
import {
  Clock3,
  Filter,
  FlaskConical,
  Menu,
  PanelsTopLeft,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { z } from "zod";
import { api } from "../lib/api";
import { useFilters } from "../state/filters";

type NavigationItem = { to: string; label: string; icon: LucideIcon };

export const navigationGroups: Array<{
  label: string;
  items: NavigationItem[];
  primary?: boolean;
}> = [
  {
    label: "Principal",
    primary: true,
    items: [
      { to: "/", label: "Landings", icon: PanelsTopLeft },
      { to: "/opportunities", label: "Oportunidades", icon: Target },
      { to: "/measurement", label: "Medición", icon: FlaskConical },
    ],
  },
];

function NavigationLink({
  item,
  close,
  mobile = false,
}: {
  item: NavigationItem;
  close: () => void;
  mobile?: boolean;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={close}
      className={({ isActive }) =>
        cn(
          "group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
          mobile && "w-full",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )
      }
    >
      <item.icon className="size-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

function GlobalFilters({ close }: { close: () => void }) {
  const { filters, setFilter, clearFilters, activeCount } = useFilters();
  const options = useQuery({
    queryKey: ["filter-options"],
    queryFn: api.filters,
    staleTime: 5 * 60_000,
  });
  return (
    <aside
      className="pointer-events-auto fixed inset-x-3 top-20 z-40 max-h-[calc(100dvh-6rem)] overflow-y-auto sm:inset-y-4 sm:left-auto sm:right-4 sm:top-auto sm:w-[22rem]"
      aria-label="Filtros globales"
      data-component-id="global-filters"
    >
      <section className="min-h-full rounded-lg border border-border bg-card p-5 shadow-[0_24px_80px_rgba(16,24,40,0.18)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Filtros</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              La vista se actualiza al cambiar cada valor.
            </p>
            {activeCount ? (
              <p className="mt-1 text-xs font-semibold text-accent">
                {activeCount} activos
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Cerrar filtros"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4">
          <label className="text-sm font-medium">
            Desde
            <Input
              className="mt-1.5 h-9"
              type="date"
              value={filters.from ?? ""}
              onChange={(event) =>
                setFilter("from", event.target.value || undefined)
              }
            />
          </label>
          <label className="text-sm font-medium">
            Hasta
            <Input
              className="mt-1.5 h-9"
              type="date"
              value={filters.to ?? ""}
              onChange={(event) =>
                setFilter("to", event.target.value || undefined)
              }
            />
          </label>
          <label className="text-sm font-medium">
            Provincia
            <Select
              className="mt-1.5 h-9"
              value={filters.province ?? ""}
              onChange={(event) =>
                setFilter("province", event.target.value || undefined)
              }
            >
              <option value="">Todas</option>
              {options.data?.provinces.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-medium">
            Municipio
            <Select
              className="mt-1.5 h-9"
              value={filters.municipalityId ?? ""}
              onChange={(event) =>
                setFilter("municipalityId", event.target.value || undefined)
              }
            >
              <option value="">Todos</option>
              {options.data?.municipalities
                .filter(
                  (option) =>
                    !filters.province || option.province === filters.province,
                )
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
            </Select>
          </label>
          <label className="text-sm font-medium">
            Servicio
            <Select
              className="mt-1.5 h-9"
              value={filters.service ?? ""}
              onChange={(event) =>
                setFilter("service", event.target.value || undefined)
              }
            >
              <option value="">Todos</option>
              {options.data?.services.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-medium">
            Canal
            <Select
              className="mt-1.5 h-9"
              value={filters.channel ?? ""}
              onChange={(event) =>
                setFilter("channel", event.target.value || undefined)
              }
            >
              <option value="">Todos</option>
              {options.data?.channels.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-medium">
            Idioma
            <Select
              className="mt-1.5 h-9"
              value={filters.language ?? ""}
              onChange={(event) =>
                setFilter(
                  "language",
                  event.target.value === "es" || event.target.value === "ca"
                    ? event.target.value
                    : undefined,
                )
              }
            >
              <option value="">Todos</option>
              {options.data?.languages?.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {activeCount ? (
          <Button
            className="mt-6 w-full"
            variant="secondary"
            size="sm"
            onClick={clearFilters}
          >
            Limpiar filtros
          </Button>
        ) : null}
        {options.isError ? (
          <p className="mt-3 text-xs text-rose-600">
            No se pudieron cargar las opciones.
          </p>
        ) : null}
      </section>
    </aside>
  );
}

const historyItemSchema = z.object({
  label: z.string(),
  to: z.string(),
});

type HistoryItem = z.infer<typeof historyItemSchema>;

function pageLabel(pathname: string): string {
  if (pathname === "/") return "Landings";
  if (pathname === "/landing") return "Ficha de landing";
  if (pathname === "/opportunities") return "Oportunidades";
  if (pathname.startsWith("/opportunities/")) return "Detalle de oportunidad";
  if (pathname === "/measurement") return "Medición";
  if (pathname === "/planning") return "Plan de 90 días";
  if (pathname === "/data-model") return "Modelo de datos";
  return "Inteligencia de landings";
}

function readHistory(): HistoryItem[] {
  try {
    const stored = window.sessionStorage.getItem("qida-page-history");
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    const result = z.array(historyItemSchema).safeParse(parsed);
    return result.success ? result.data.slice(-5) : [];
  } catch {
    return [];
  }
}

function AppSidebar({
  close,
  mobile = false,
}: {
  close: () => void;
  mobile?: boolean;
}) {
  const items = navigationGroups.flatMap((group) => group.items);
  const staticDemo = import.meta.env.VITE_STATIC_DEMO === "true";
  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card",
        !mobile && "fixed inset-y-0 left-0 hidden lg:flex",
      )}
      aria-label="Navegación principal"
      data-component-id="app-sidebar"
    >
      <div className="flex h-16 items-center border-b px-5">
        <Link
          className="flex min-w-0 items-center gap-3"
          onClick={close}
          to="/"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            Q
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              Inteligencia de landings
            </span>
            <span className="block text-xs text-muted-foreground">
              Área de Growth
            </span>
          </span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => (
          <NavigationLink
            key={item.to}
            item={item}
            close={close}
            mobile={mobile}
          />
        ))}
      </nav>
      <div className="border-t p-4">
        <p className="text-xs font-medium">Entorno de demostración</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {staticDemo
            ? "Datos sintéticos desde JSON · cambios solo en este navegador"
            : "Datos sintéticos persistidos · v2"}
        </p>
      </div>
    </aside>
  );
}

function WorkspaceHeader({
  filtersOpen,
  setFiltersOpen,
  openMenu,
}: {
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  openMenu: () => void;
}) {
  const location = useLocation();
  const { activeCount } = useFilters();
  const [history, setHistory] = useState<HistoryItem[]>(readHistory);
  const current = {
    label: pageLabel(location.pathname),
    to: `${location.pathname}${location.search}`,
  };

  useEffect(() => {
    setFiltersOpen(false);
    setHistory((existing) => {
      const next = [
        ...existing.filter((item) => item.to !== current.to),
        current,
      ].slice(-5);
      window.sessionStorage.setItem("qida-page-history", JSON.stringify(next));
      return next;
    });
  }, [location.pathname, location.search]);

  const previousPages = history
    .filter((item) => item.to !== current.to)
    .slice(-3)
    .reverse();
  return (
    <header
      className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8"
      data-component-id="workspace-header"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button
          className="lg:hidden"
          variant="ghost"
          size="icon"
          onClick={openMenu}
          aria-label="Abrir navegación"
        >
          <Menu className="size-4" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{current.label}</p>
          <div className="mt-0.5 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Clock3 className="size-3.5" />
            <span>Visitadas:</span>
            {previousPages.length ? (
              previousPages.map((item, index) => (
                <span className="flex items-center gap-1.5" key={item.to}>
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  <Link
                    className="max-w-36 truncate hover:text-foreground hover:underline"
                    to={item.to}
                  >
                    {item.label}
                  </Link>
                </span>
              ))
            ) : (
              <span>Esta es la primera vista</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-label="Filtros"
          aria-expanded={filtersOpen}
        >
          <Filter className="size-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeCount ? <Badge>{activeCount}</Badge> : null}
        </Button>
      </div>
    </header>
  );
}

export function AppLayout() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("qida-theme");
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <AppSidebar close={() => setMenuOpen(false)} />
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/35"
            aria-label="Cerrar navegación"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
          <div className="relative h-full w-64 shadow-2xl">
            <AppSidebar close={() => setMenuOpen(false)} mobile />
          </div>
        </div>
      ) : null}
      <div className="min-w-0">
        <WorkspaceHeader
          filtersOpen={filtersOpen}
          openMenu={() => setMenuOpen(true)}
          setFiltersOpen={setFiltersOpen}
        />
        <main className="mx-auto min-w-0 max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      {filtersOpen ? (
        <GlobalFilters close={() => setFiltersOpen(false)} />
      ) : null}
    </div>
  );
}

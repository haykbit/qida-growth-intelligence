import { filterSchema, type GlobalFilters } from "@qida/contracts";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type FilterContextValue = {
  filters: GlobalFilters;
  setFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K] | undefined) => void;
  clearFilters: () => void;
  activeCount: number;
};

const FilterContext = createContext<FilterContextValue | null>(null);
const storageKey = "qida-growth-filters";

function initialFilters(): GlobalFilters {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    const result = filterSchema.safeParse(parsed);
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(initialFilters);
  const persist = useCallback((next: GlobalFilters) => { setFilters(next); localStorage.setItem(storageKey, JSON.stringify(next)); }, []);
  const setFilter = useCallback(<K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K] | undefined) => {
    const next = { ...filters, [key]: value || undefined };
    persist(filterSchema.parse(next));
  }, [filters, persist]);
  const clearFilters = useCallback(() => persist({}), [persist]);
  const value = useMemo(() => ({ filters, setFilter, clearFilters, activeCount: Object.values(filters).filter(Boolean).length }), [filters, setFilter, clearFilters]);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used inside FilterProvider");
  return context;
}

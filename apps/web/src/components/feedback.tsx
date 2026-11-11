import { Button, Card, CardContent, Skeleton } from "@qida/ui";
import { AlertTriangle, DatabaseZap, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { ApiClientError } from "../lib/api";

export function LoadingState({ cards = 4 }: { cards?: number }) {
  return <div className="page-grid" aria-label="Cargando"><div className="metric-grid">{Array.from({ length: cards }, (_, index) => <Skeleton key={index} className="h-28" />)}</div><Skeleton className="h-80" /><Skeleton className="h-64" /></div>;
}

export function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  const requestId = error instanceof ApiClientError ? error.requestId : "unavailable";
  return <Card><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><div className="mb-4 grid size-12 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950"><AlertTriangle className="size-6" /></div><h2 className="font-semibold">No pudimos cargar estos datos</h2><p className="mt-2 max-w-lg text-sm text-slate-500">{error.message}</p><p className="mt-2 font-mono text-xs text-slate-400">Request ID: {requestId}</p>{retry ? <Button className="mt-5" variant="secondary" onClick={retry}><RefreshCw className="size-4" />Reintentar</Button> : null}</CardContent></Card>;
}

export function EmptyState({ title = "No hay datos para esta selección", description = "Prueba a ampliar las fechas o retirar algún filtro.", action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center"><div className="mb-4 grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800"><DatabaseZap className="size-5" /></div><h3 className="font-medium">{title}</h3><p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}

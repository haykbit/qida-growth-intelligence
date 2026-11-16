import { useQuery } from "@tanstack/react-query";
import { Badge, Button, CardContent, Input, Select } from "@qida/ui";
import { ArrowRight, ChevronRight, Milestone } from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable, type DataColumn } from "../components/data-table";
import { Caveats, MetricStrip, PageTitle, Panel } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type StrategyData } from "../lib/api";
import { integer, titleCase } from "../lib/format";

type ScenarioKey = "conservative" | "base" | "optimistic";
type Assumptions = { scenario: ScenarioKey; demandCaptureRate: number; leadToSqlRate: number; sqlToAltaRate: number; capacityUtilization: number; months: number };
type StrategyBet = StrategyData["prioritizedBets"][number];
const defaults: Record<ScenarioKey, Omit<Assumptions, "scenario" | "months">> = {
  conservative: { demandCaptureRate: 0.015, leadToSqlRate: 0.35, sqlToAltaRate: 0.12, capacityUtilization: 0.5 },
  base: { demandCaptureRate: 0.025, leadToSqlRate: 0.42, sqlToAltaRate: 0.18, capacityUtilization: 0.7 },
  optimistic: { demandCaptureRate: 0.04, leadToSqlRate: 0.5, sqlToAltaRate: 0.24, capacityUtilization: 0.85 },
};

function BetDetail({ bet }: { bet: StrategyBet }) {
  const levels = { low: "Bajo", medium: "Medio", high: "Alto" } as const;
  return <Panel title={`${bet.municipality} · ${bet.service}`} componentId="strategy-bet-detail"><CardContent className="space-y-4"><div className="flex flex-wrap gap-2"><Badge>Impacto {levels[bet.impact]}</Badge><Badge>Esfuerzo {levels[bet.effort]}</Badge><Badge>{bet.owner}</Badge></div><div><p className="text-xs text-slate-400">Hipótesis</p><p className="mt-1 text-sm leading-6">{bet.hypothesis}</p></div><div><p className="text-xs text-slate-400">MVP</p><p className="mt-1 text-sm leading-6">{bet.mvp}</p></div><div className="grid gap-2 text-xs sm:grid-cols-3"><div className="rounded-lg border border-emerald-200 p-2 text-emerald-700"><strong>Continuar</strong><p className="mt-1">{bet.decisionCriteria.continue}</p></div><div className="rounded-lg border border-amber-200 p-2 text-amber-700"><strong>Modificar</strong><p className="mt-1">{bet.decisionCriteria.modify}</p></div><div className="rounded-lg border border-rose-200 p-2 text-rose-700"><strong>Parar</strong><p className="mt-1">{bet.decisionCriteria.stop}</p></div></div></CardContent></Panel>;
}

export function StrategyPage() {
  const [assumptions, setAssumptions] = useState<Assumptions>({ scenario: "base", ...defaults.base, months: 6 });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const setScenario = (scenario: ScenarioKey) => setAssumptions((current) => ({ scenario, ...defaults[scenario], months: current.months }));
  const setRate = (key: keyof Omit<Assumptions, "scenario">, value: number) => setAssumptions((current) => ({ ...current, [key]: Number.isFinite(value) ? value : 0 }));
  const query = useQuery({ queryKey: ["strategy", assumptions], queryFn: () => api.strategy(assumptions) });
  const data = query.data;
  const selected = data?.prioritizedBets.find((bet) => `${bet.municipalityId}-${bet.service}` === selectedKey) ?? data?.prioritizedBets[0];
  useEffect(() => { if (data?.prioritizedBets[0] && selectedKey === null) setSelectedKey(`${data.prioritizedBets[0].municipalityId}-${data.prioritizedBets[0].service}`); }, [data, selectedKey]);
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!data) return <EmptyState />;
  const columns: Array<DataColumn<StrategyBet>> = [
    { id: "rank", header: "#", cell: (bet) => bet.rank },
    { id: "bet", header: "Municipio / servicio", cell: (bet) => <div><p className="font-medium">{bet.municipality}</p><p className="text-xs text-slate-400">{bet.service}</p></div> },
    { id: "impact", header: "Impacto", cell: (bet) => titleCase(bet.impact), hideBelow: "sm" },
    { id: "effort", header: "Esfuerzo", cell: (bet) => titleCase(bet.effort), hideBelow: "md" },
    { id: "sql", header: "SQL escenario", cell: (bet) => integer.format(bet.scenarioSql), align: "right" },
    { id: "altas", header: "Altas escenario", cell: (bet) => integer.format(bet.scenarioAltas), align: "right" },
    { id: "action", header: "", cell: (bet) => <Button variant="ghost" size="icon" onClick={() => setSelectedKey(`${bet.municipalityId}-${bet.service}`)} aria-label={`Ver ${bet.municipality}`}><ChevronRight className="size-4" /></Button>, align: "right" },
  ];

  return <div className="page-grid"><PageTitle title="Estrategia" /><MetricStrip items={[
    { id: "strategy-baseline", label: "Base", value: `${integer.format(data.baseline.sqlPerMonth)} SQL/mes` },
    { id: "strategy-sql", label: "SQL del escenario", value: integer.format(data.scenarioProjection.sql), detail: `${data.scenarioProjection.periodMonths} meses` },
    { id: "strategy-altas", label: "Altas del escenario", value: integer.format(data.scenarioProjection.altas) },
    { id: "strategy-bets", label: "Apuestas", value: integer.format(data.prioritizedBets.length), detail: `${data.rejectedBets.length} descartadas` },
  ]} /><Panel title="Supuestos" componentId="strategy-assumptions"><CardContent><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><label className="text-xs text-slate-500">Escenario<Select className="mt-1" value={assumptions.scenario} onChange={(event) => setScenario(event.target.value as ScenarioKey)}><option value="conservative">Conservador</option><option value="base">Base</option><option value="optimistic">Optimista</option></Select></label>{([{ key: "demandCaptureRate", label: "Captura de demanda" }, { key: "leadToSqlRate", label: "Lead → SQL" }, { key: "sqlToAltaRate", label: "SQL → alta" }, { key: "capacityUtilization", label: "Capacidad" }] as const).map((field) => <label key={field.key} className="text-xs text-slate-500">{field.label} (%)<Input className="mt-1" type="number" min="0" max={field.key === "demandCaptureRate" ? "20" : "100"} step="0.5" value={assumptions[field.key] * 100} onChange={(event) => setRate(field.key, Number(event.target.value) / 100)} /></label>)}<label className="text-xs text-slate-500">Meses<Input className="mt-1" type="number" min="1" max="24" value={assumptions.months} onChange={(event) => setRate("months", Number(event.target.value))} /></label></div></CardContent></Panel><div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]"><Panel title="Apuestas priorizadas" componentId="strategy-bets-table"><DataTable rows={data.prioritizedBets.slice(0, 8)} columns={columns} rowKey={(bet) => `${bet.municipalityId}-${bet.service}`} rowClassName={(bet) => selectedKey === `${bet.municipalityId}-${bet.service}` ? "bg-brand-50/60" : undefined} minWidth="min-w-[720px]" /></Panel>{selected ? <BetDetail bet={selected} /> : null}</div><div className="grid gap-4 lg:grid-cols-2"><Panel title="Hoja de ruta"><CardContent className="space-y-5">{[{ phase: "Primeros 90 días", items: data.milestones.first90Days }, { phase: "Seis meses", items: data.milestones.sixMonths }].map((phase) => <div key={phase.phase}><div className="flex items-center gap-2"><Milestone className="size-4 text-brand-600" /><h3 className="text-sm font-semibold">{phase.phase}</h3></div><ul className="mt-2 space-y-1 text-sm text-slate-600">{phase.items.map((item) => <li key={item} className="flex gap-2"><ArrowRight className="mt-0.5 size-4 shrink-0 text-brand-600" />{item}</li>)}</ul></div>)}</CardContent></Panel><Panel title="Apuestas descartadas"><CardContent className="divide-y divide-slate-100 p-0">{data.rejectedBets.slice(0, 6).map((bet) => <div key={`${bet.municipalityId}-${bet.service}`} className="px-5 py-3"><p className="text-sm font-medium">{bet.municipality} · {bet.service}</p><p className="mt-1 text-xs text-slate-500">{bet.reason}</p></div>)}</CardContent></Panel></div><Caveats items={data.caveats} /></div>;
}

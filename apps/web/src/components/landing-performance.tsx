import { Badge, Card, CardContent, Progress, cn } from "@qida/ui";
import type { LandingInsightSummaryData } from "../lib/api";
import { decimal, integer, percent } from "../lib/format";

export type PerformanceState =
  | "above"
  | "inline"
  | "below"
  | "limited"
  | "restricted";

export function performanceState(
  landing: LandingInsightSummaryData,
): PerformanceState {
  if (!landing.operations.eligible) return "restricted";
  if (landing.sessions < 100) return "limited";
  const comparisons = [
    landing.benchmark.sessionToLead > 0
      ? landing.rates.sessionToLead / landing.benchmark.sessionToLead
      : 1,
    landing.benchmark.leadToSql > 0
      ? landing.rates.leadToSql / landing.benchmark.leadToSql
      : 1,
    landing.benchmark.sqlToAlta > 0
      ? landing.rates.sqlToAlta / landing.benchmark.sqlToAlta
      : 1,
  ];
  const average =
    comparisons.reduce((sum, value) => sum + value, 0) / comparisons.length;
  if (comparisons.some((value) => value < 0.75)) return "below";
  if (average >= 1.06 && comparisons.every((value) => value >= 0.95))
    return "above";
  if (average < 0.9) return "below";
  return "inline";
}

const performanceMeta: Record<
  PerformanceState,
  { label: string; tone: "success" | "info" | "warning" | "danger" | "neutral" }
> = {
  above: { label: "Mejor que la media", tone: "success" },
  inline: { label: "Similar a la media", tone: "info" },
  below: { label: "Peor que la media", tone: "warning" },
  limited: { label: "Menos de 100 sesiones", tone: "neutral" },
  restricted: { label: "Sin capacidad suficiente", tone: "danger" },
};

export function PerformanceBadge({
  landing,
}: {
  landing: LandingInsightSummaryData;
}) {
  const meta = performanceMeta[performanceState(landing)];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

function pointDifference(current: number, benchmark: number): string {
  const value = (current - benchmark) * 100;
  return `${value >= 0 ? "+" : ""}${decimal.format(value)} pp`;
}

export function landingReading(landing: LandingInsightSummaryData): string {
  const state = performanceState(landing);
  if (state === "restricted") {
    return `${integer.format(landing.sessions)} sesiones registradas. El municipio tiene ${integer.format(landing.operations.caregiversAvailable)} cuidadoras disponibles a 30 días y no cumple el mínimo operativo.`;
  }
  if (state === "limited") {
    return `Solo hay ${integer.format(landing.sessions)} sesiones. No se compara el rendimiento hasta alcanzar 100 sesiones.`;
  }
  const gaps = [
    {
      key: "session",
      value: landing.rates.sessionToLead - landing.benchmark.sessionToLead,
    },
    {
      key: "lead",
      value: landing.rates.leadToSql - landing.benchmark.leadToSql,
    },
    {
      key: "alta",
      value: landing.rates.sqlToAlta - landing.benchmark.sqlToAlta,
    },
  ].sort((left, right) => left.value - right.value);
  const weakest = gaps[0];
  const variant =
    [...(landing.municipality ?? landing.url)].reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0,
    ) % 3;
  if (state === "above") {
    const alternatives = [
      `Convierte ${percent.format(landing.rates.sessionToLead)} de las sesiones en leads. La media de las landings seleccionadas es ${percent.format(landing.benchmark.sessionToLead)}.`,
      `${integer.format(landing.leads)} leads generan ${integer.format(landing.sql)} SQL y ${integer.format(landing.altas)} altas. Las tres tasas superan o igualan la media seleccionada.`,
      `La puntuación conjunta es ${integer.format(landing.evaluation.overall)}/100. Ninguna etapa del embudo queda por debajo de la media seleccionada.`,
    ];
    return alternatives[variant] ?? alternatives[0] ?? "";
  }
  if (weakest?.key === "session") {
    const alternatives = [
      `La tasa sesión → lead está ${pointDifference(landing.rates.sessionToLead, landing.benchmark.sessionToLead)} frente a la media seleccionada.`,
      `Convierte ${percent.format(landing.rates.sessionToLead)} de las sesiones en leads; la media es ${percent.format(landing.benchmark.sessionToLead)}.`,
      `${integer.format(landing.sessions)} sesiones generan ${integer.format(landing.leads)} leads. Es la etapa con mayor diferencia frente a la media.`,
    ];
    return alternatives[variant] ?? alternatives[0] ?? "";
  }
  if (weakest?.key === "lead") {
    const alternatives = [
      `La tasa lead → SQL está ${pointDifference(landing.rates.leadToSql, landing.benchmark.leadToSql)} frente a la media seleccionada.`,
      `${integer.format(landing.leads)} leads generan ${integer.format(landing.sql)} SQL. Es la etapa con mayor diferencia frente a la media.`,
      `Convierte ${percent.format(landing.rates.leadToSql)} de los leads en SQL; la media es ${percent.format(landing.benchmark.leadToSql)}.`,
    ];
    return alternatives[variant] ?? alternatives[0] ?? "";
  }
  const alternatives = [
    `La tasa SQL → alta está ${pointDifference(landing.rates.sqlToAlta, landing.benchmark.sqlToAlta)} frente a la media seleccionada.`,
    `${integer.format(landing.sql)} SQL generan ${integer.format(landing.altas)} altas. Es la etapa con mayor diferencia frente a la media.`,
    `Convierte ${percent.format(landing.rates.sqlToAlta)} de los SQL en altas; la media es ${percent.format(landing.benchmark.sqlToAlta)}.`,
  ];
  return alternatives[variant] ?? alternatives[0] ?? "";
}

export function FunnelEvidence({
  sessions,
  leads,
  sql,
  altas,
}: {
  sessions: number;
  leads: number;
  sql: number;
  altas: number;
}) {
  const stages = [
    { label: "Sesiones", value: sessions, rate: null },
    {
      label: "Leads",
      value: leads,
      rate: sessions ? leads / sessions : 0,
    },
    { label: "SQL (cualificados)", value: sql, rate: leads ? sql / leads : 0 },
    { label: "Altas", value: altas, rate: sql ? altas / sql : 0 },
  ];
  return (
    <div className="grid overflow-hidden rounded-lg border bg-border md:grid-cols-4">
      {stages.map((stage) => (
        <div className="bg-card p-5" key={stage.label}>
          <p className="text-sm text-muted-foreground">{stage.label}</p>
          <p className="tabular mt-2 text-3xl font-semibold tracking-tight">
            {integer.format(stage.value)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stage.rate === null
              ? "Entrada observada"
              : `${percent.format(stage.rate)} desde la etapa anterior`}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ScoreLine({
  label,
  score,
  explanation,
}: {
  label: string;
  score: number;
  explanation: string;
}) {
  const tone =
    score >= 70
      ? "bg-emerald-600"
      : score >= 45
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <span className="tabular text-sm font-semibold">
          {integer.format(score)}/100
        </span>
      </div>
      <Progress className="mt-2" indicatorClassName={tone} value={score} />
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {explanation}
      </p>
    </div>
  );
}

export function MetricComparison({
  label,
  current,
  benchmark,
}: {
  label: string;
  current: number;
  benchmark: number;
}) {
  const delta = current - benchmark;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="tabular mt-2 text-3xl font-semibold">
              {percent.format(current)}
            </p>
          </div>
          <Badge tone={delta >= 0 ? "success" : "warning"}>
            {pointDifference(current, benchmark)}
          </Badge>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Media seleccionada</span>
          <span className="tabular">{percent.format(benchmark)}</span>
        </div>
        <Progress
          className="mt-2"
          indicatorClassName={cn(
            delta >= 0 ? "bg-emerald-600" : "bg-amber-500",
          )}
          value={Math.min(100, benchmark > 0 ? (current / benchmark) * 70 : 0)}
        />
      </CardContent>
    </Card>
  );
}

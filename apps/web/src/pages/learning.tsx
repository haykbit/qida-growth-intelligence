import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent } from "@qida/ui";
import { ArrowRight, Beaker, BookOpenCheck, CircleAlert, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Caveats, MetricStrip, PageTitle, Panel } from "../components/data-display";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type ExperimentSummaryData } from "../lib/api";
import { formatDate, percent, titleCase } from "../lib/format";

type ResultKind = "positive" | "inconclusive" | "negative";

function resultKind(experiment: ExperimentSummaryData): ResultKind {
  if (experiment.didEstimate !== null && experiment.didEstimate > 0.005) return "positive";
  if (experiment.didEstimate !== null && experiment.didEstimate < -0.005) return "negative";
  return "inconclusive";
}

const resultLabels: Record<ResultKind, string> = { positive: "Señal positiva", inconclusive: "Inconcluso", negative: "Señal negativa" };

function ResultIcon({ kind }: { kind: ResultKind }) {
  if (kind === "positive") return <TrendingUp className="size-5 text-emerald-600" />;
  if (kind === "negative") return <TrendingDown className="size-5 text-rose-600" />;
  return <CircleAlert className="size-5 text-amber-600" />;
}

export function LearningPage() {
  const query = useQuery({ queryKey: ["learning"], queryFn: api.learning });
  if (query.isLoading) return <LoadingState cards={5} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  const data = query.data;
  if (!data) return <EmptyState />;

  return <div className="page-grid">
    <PageTitle eyebrow="Memoria de decisión" title="Aprendizajes" />
    <MetricStrip columns={5} items={[
      { id: "learning-experiments", label: "Experimentos", value: String(data.totals.experiments), detail: "Evaluados" },
      { id: "learning-positive", label: "Señal positiva", value: String(data.totals.positive), detail: "DiD > +0,5 pp" },
      { id: "learning-inconclusive", label: "Inconclusos", value: String(data.totals.inconclusive), detail: "Sin señal suficiente" },
      { id: "learning-negative", label: "Señal negativa", value: String(data.totals.negative), detail: "DiD < −0,5 pp" },
      { id: "learning-decisions", label: "Decisiones", value: String(data.totals.decisions), detail: "Versionadas" },
    ]} />

    <Panel title="Qué hemos aprendido" description="Resultados observados de las pruebas registradas" componentId="learning-experiments">
      <CardContent className="grid gap-3 lg:grid-cols-3">
        {data.experiments.map((experiment) => {
          const kind = resultKind(experiment);
          return <article className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5" key={experiment.id}>
            <div className="flex items-start justify-between gap-3"><div className="grid size-10 place-items-center rounded-xl bg-slate-50"><ResultIcon kind={kind} /></div><Badge tone={kind === "positive" ? "success" : kind === "negative" ? "danger" : "warning"}>{resultLabels[kind]}</Badge></div>
            <h2 className="mt-5 text-base font-semibold leading-6 text-slate-950">{experiment.name}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">{experiment.hypothesis}</p>
            <div className="mt-auto border-t border-slate-100 pt-4"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Cambio estimado</p><p className="mt-1 text-2xl font-semibold tabular-nums">{experiment.didEstimate === null ? "—" : `${experiment.didEstimate >= 0 ? "+" : ""}${percent.format(experiment.didEstimate)}`}</p></div><div className="text-right text-[11px] text-slate-400"><p>{experiment.treatmentMunicipalities} tratamiento</p><p>{experiment.controlMunicipalities} control</p></div></div></div>
          </article>;
        })}
      </CardContent>
    </Panel>

    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <Panel title="Decisiones sobre landings" description="Historial humano separado de la recomendación automática" componentId="learning-decisions">
        <CardContent className="space-y-3">
          {data.decisions.length ? data.decisions.map((decision) => <div className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-start" key={decision.id}>
            <div className="grid size-10 place-items-center rounded-xl bg-slate-950 text-xs font-semibold text-white">v{decision.version}</div>
            <div><div className="flex flex-wrap items-center gap-2"><Badge tone={decision.decision === "keep" ? "success" : decision.decision === "iterate" ? "warning" : "danger"}>{decision.decision === "keep" ? "Mantener" : decision.decision === "iterate" ? "Iterar" : "Detener"}</Badge><span className="text-sm font-semibold">{decision.municipality ?? "Landing general"}</span>{decision.service ? <span className="text-xs text-slate-400">· {titleCase(decision.service)}</span> : null}</div><p className="mt-2 text-sm leading-6 text-slate-600">{decision.hypothesis}</p><p className="mt-1 text-[11px] text-slate-400">Registrada el {formatDate(decision.createdAt)}</p></div>
            <Button asChild size="sm" variant="ghost"><Link to={`/landings/insight?url=${encodeURIComponent(decision.url)}`}>Ver evaluación<ArrowRight className="size-3.5" /></Link></Button>
          </div>) : <EmptyState title="Todavía no hay decisiones" />}
        </CardContent>
      </Panel>
      <div className="space-y-4">
        <Card className="overflow-hidden bg-slate-950 text-white"><CardContent className="p-6"><BookOpenCheck className="size-7 text-rose-400" /><h2 className="mt-5 text-xl font-semibold">Del dato a la siguiente versión</h2><p className="mt-3 text-sm leading-6 text-slate-300">Cada evaluación conecta rendimiento, capacidad y evidencia. La recomendación orienta; la decisión humana queda registrada y una prueba posterior confirma —o refuta— la hipótesis.</p><Button className="mt-5" asChild size="sm" variant="secondary"><Link to="/landings">Abrir evaluador<ArrowRight className="size-4" /></Link></Button></CardContent></Card>
        <Card><CardContent className="flex gap-3 p-5"><Beaker className="mt-0.5 size-5 shrink-0 text-violet-600" /><div><p className="text-sm font-semibold">Nivel de evidencia</p><p className="mt-1 text-xs leading-5 text-slate-500">Una atribución explica qué contactos asociamos al resultado. Solo el diseño cuasi experimental intenta estimar cuánto cambio fue incremental.</p></div></CardContent></Card>
      </div>
    </div>
    <Caveats items={data.caveats} />
  </div>;
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LandingDecisionRequest } from "@qida/contracts";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
} from "@qida/ui";
import { Link, useSearchParams } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { api, type LandingInsightDetailData } from "../lib/api";
import { formatDate } from "../lib/format";
import { CommercialEvidence, CommercialResult } from "./commercial-result";

const decisionNames = { keep: "Mantener", iterate: "Modificar", stop: "Parar" };
const metricNames = {
  sql_per_municipality_week: "SQL familiares por municipio-semana",
  session_to_lead: "Sesión → lead",
  lead_to_sql: "Lead → SQL",
  sql_to_alta: "SQL → alta",
  caregiver_capacity: "Capacidad",
};
type Decision = LandingInsightDetailData["decisions"][number];

function DecisionEditor({
  data,
  source,
}: {
  data: LandingInsightDetailData;
  source?: Decision | undefined;
}) {
  const client = useQueryClient();
  const [, setParams] = useSearchParams();
  const [decision, setDecision] =
    useState<LandingDecisionRequest["decision"]>("keep");
  const [compare, setCompare] = useState(false);
  const [message, setMessage] = useState("");
  const save = useMutation({
    mutationFn: (input: LandingDecisionRequest) =>
      api.recordLandingDecision(data.url, input),
    onSuccess: async (saved) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["landing-record", data.url] }),
        client.invalidateQueries({ queryKey: ["measurement-learning"] }),
      ]);
      setParams({ url: data.url, decision: saved.id });
    },
  });
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const value = (name: string) => String(f.get(name) ?? "").trim();
    const change =
      compare && decision === "iterate"
        ? {
            element: value("element"),
            event: value("event"),
            experimentId: null,
            before: { title: value("beforeTitle"), cta: value("beforeCta") },
            after: { title: value("afterTitle"), cta: value("afterCta") },
          }
        : undefined;
    if (
      change &&
      change.before.title === change.after.title &&
      change.before.cta === change.after.cta
    ) {
      setMessage("Las dos versiones tienen el mismo contenido.");
      return;
    }
    setMessage("");
    save.mutate({
      decision,
      author: value("author"),
      hypothesis: value("reason"),
      primaryMetric: "sql_per_municipality_week",
      guardrailMetric: "sql_to_alta",
      ...(source ? { evidenceDecisionId: source.id } : {}),
      ...(change ? { change } : {}),
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar la siguiente decisión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Decisión
              <Select
                value={decision}
                onChange={(e) =>
                  setDecision(
                    e.target.value as LandingDecisionRequest["decision"],
                  )
                }
              >
                {Object.entries(decisionNames).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              Responsable
              <Input required name="author" maxLength={100} />
            </label>
          </div>
          <label className="block">
            Motivo de la decisión
            <textarea
              required
              minLength={10}
              maxLength={500}
              name="reason"
              className="block w-full rounded-md border p-2"
            />
          </label>
          {decision === "iterate" && (
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
              />
              Registrar el cambio propuesto
            </label>
          )}
          {compare && decision === "iterate" && (
            <fieldset className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
              {[
                ["element", "Elemento modificado"],
                ["event", "Evento de medición"],
                ["beforeTitle", "Titular anterior"],
                ["afterTitle", "Titular propuesto"],
                ["beforeCta", "Botón anterior"],
                ["afterCta", "Botón propuesto"],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <Input name={name} required maxLength={500} />
                </label>
              ))}
            </fieldset>
          )}
          <p className="text-sm text-muted-foreground">
            Métrica de decisión: SQL familiares por municipio-semana.
            Guardarraíl: SQL → alta de cohorte madura.
          </p>
          {(message || save.error) && (
            <p role="alert">{message || save.error?.message}</p>
          )}
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Guardando…" : "Guardar decisión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function LandingChanges({
  data,
  selectedId,
}: {
  data: LandingInsightDetailData;
  selectedId: string | null;
}) {
  const selected =
    data.decisions.find((d) => d.id === selectedId) ?? data.decisions[0];
  const source = selected?.change
    ? selected
    : data.decisions.find((d) => d.id === selected?.evidenceDecisionId);
  const change = source?.change;
  return (
    <div className="space-y-4">
      {selectedId && selected?.id !== selectedId && (
        <p role="alert">
          La decisión solicitada no pertenece al historial de esta landing.
        </p>
      )}
      {data.decisions.length > 0 && (
        <nav
          aria-label="Historial de decisiones"
          className="flex flex-wrap gap-2"
        >
          {data.decisions.map((d) => (
            <Button
              size="sm"
              asChild
              variant={selected?.id === d.id ? "primary" : "secondary"}
              key={d.id}
            >
              <Link
                to={`/landing?url=${encodeURIComponent(data.url)}&decision=${encodeURIComponent(d.id)}`}
              >
                {decisionNames[d.decision]} · {formatDate(d.createdAt)} · v
                {d.version}
              </Link>
            </Button>
          ))}
        </nav>
      )}
      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {decisionNames[selected.decision]} · {data.municipality}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{selected.hypothesis}</p>
            <p className="text-sm text-muted-foreground">
              {selected.author ?? selected.actorRole} ·{" "}
              {formatDate(selected.createdAt)} ·{" "}
              {metricNames[selected.primaryMetric]} · Guardarraíl:{" "}
              {metricNames[selected.guardrailMetric]}
            </p>
            {selected.note && <p className="text-sm">{selected.note}</p>}
            {change && source ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <strong>{change.element}</strong>
                  <Badge>
                    {change.experimentId
                      ? "Asignado a experimento"
                      : "Cambio propuesto"}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["before", "after"] as const).map((stage) => (
                    <div
                      className="space-y-3 rounded-lg border p-4"
                      key={stage}
                    >
                      <p className="text-xs font-semibold uppercase">
                        {stage === "before"
                          ? "Versión anterior"
                          : "Nueva versión"}
                      </p>
                      <h3 className="text-lg font-semibold">
                        {change[stage].title}
                      </h3>
                      <p className="text-sm">Botón · {change[stage].cta}</p>
                      {data.municipalityId && data.service && (
                        <Link
                          className="text-sm underline"
                          target="_blank"
                          rel="noreferrer"
                          to={`/demo/${data.municipalityId}/${encodeURIComponent(data.service)}?${new URLSearchParams({ url: data.url, decision: source.id, stage })}`}
                        >
                          Ver versión{" "}
                          {stage === "before" ? "anterior" : "nueva"}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm">Evento de medición · {change.event}</p>
                {change.experimentId && (
                  <Link
                    className="text-sm underline"
                    to={`/measurement?experiment=${encodeURIComponent(change.experimentId)}`}
                  >
                    Abrir experimento en Medición
                  </Link>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta decisión se registró sin versiones de contenido.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <p>Esta landing aún no tiene decisiones registradas.</p>
      )}
      {selected?.resultSnapshot ? (
        <Card>
          <CardHeader>
            <CardTitle>Evidencia guardada al decidir</CardTitle>
          </CardHeader>
          <CardContent>
            {selected.evidenceDecisionId && (
              <Link
                className="mb-3 block text-sm underline"
                to={`/landing?url=${encodeURIComponent(data.url)}&decision=${encodeURIComponent(selected.evidenceDecisionId)}`}
              >
                Ver el cambio evaluado
              </Link>
            )}
            <CommercialEvidence result={selected.resultSnapshot} />
          </CardContent>
        </Card>
      ) : change?.experimentId ? (
        <CommercialResult id={change.experimentId} />
      ) : (
        change && <p>Pendiente de asignar tratamiento y control.</p>
      )}
      <DecisionEditor
        key={selected?.id ?? data.url}
        data={data}
        source={source ?? selected}
      />
    </div>
  );
}

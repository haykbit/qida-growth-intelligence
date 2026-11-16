import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { weeklyStatus, type WeeklyNote } from "@qida/contracts";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from "@qida/ui";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, type LearningData } from "../lib/api";
import { formatDate } from "../lib/format";
import { ErrorState, LoadingState } from "./feedback";

type Action = WeeklyNote["actions"][number];
const blankAction = (date: string): Action => ({
  task: "",
  owner: "",
  reviewDate: date,
  status: "En curso",
});

function WeeklyEditor({
  date,
  history,
  decisions,
}: {
  date: string;
  history: WeeklyNote[];
  decisions: LearningData["decisions"];
}) {
  const client = useQueryClient();
  const latest = history[0];
  const [baseRevision] = useState(latest?.revision ?? 0);
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState(latest?.summary ?? "");
  const [actions, setActions] = useState<Action[]>(latest?.actions ?? []);
  const save = useMutation({
    mutationFn: api.saveWeekly,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["weekly", date] });
    },
  });
  function update(index: number, patch: Partial<Action>) {
    setActions((previous) =>
      previous.map((action, i) =>
        i === index ? { ...action, ...patch } : action,
      ),
    );
  }
  return (
    <div className="space-y-5">
      {latest && (
        <p role="status">
          Acta guardada · revisión {latest.revision} · {latest.author}
        </p>
      )}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            date,
            revision: baseRevision + 1,
            author: author.trim(),
            summary: summary.trim(),
            actions,
          });
        }}
      >
        <label className="block">
          Responsable del acta
          <Input
            required
            maxLength={100}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </label>
        <label className="block">
          Resumen de la reunión
          <textarea
            required
            maxLength={500}
            className="block min-h-20 w-full rounded-md border p-2"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
        {actions.map((a, i) => (
          <fieldset
            className="grid gap-3 rounded-md border p-4 sm:grid-cols-2"
            key={i}
          >
            <legend className="px-2 font-semibold">Acción {i + 1}</legend>
            <label>
              Acción acordada
              <Input
                required
                maxLength={500}
                value={a.task}
                onChange={(e) => update(i, { task: e.target.value })}
              />
            </label>
            <label>
              Responsable de la acción
              <Input
                required
                maxLength={100}
                value={a.owner}
                onChange={(e) => update(i, { owner: e.target.value })}
              />
            </label>
            <label>
              Próxima revisión
              <Input
                type="date"
                required
                min={date}
                value={a.reviewDate}
                onChange={(e) => update(i, { reviewDate: e.target.value })}
              />
            </label>
            <label>
              Estado
              <Select
                value={a.status}
                onChange={(e) =>
                  update(i, { status: weeklyStatus.parse(e.target.value) })
                }
              >
                {weeklyStatus.options.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </label>
            <label>
              Decisión relacionada
              <Select
                value={a.decisionId ?? ""}
                onChange={(e) =>
                  setActions((previous) =>
                    previous.map((row, index) => {
                      if (index !== i) return row;
                      const { decisionId: prior, ...rest } = row;
                      return e.target.value
                        ? { ...rest, decisionId: e.target.value }
                        : prior
                          ? rest
                          : row;
                    }),
                  )
                }
              >
                <option value="">Acción general</option>
                {a.decisionId &&
                  !decisions.some((d) => d.id === a.decisionId) && (
                    <option value={a.decisionId}>
                      {a.decisionUrl ?? a.decisionId}
                    </option>
                  )}
                {decisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.municipality ?? d.url} · v{d.version}
                  </option>
                ))}
              </Select>
            </label>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setActions((previous) =>
                  previous.filter((_, index) => index !== i),
                )
              }
            >
              Quitar acción
            </Button>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={actions.length >= 30}
          onClick={() =>
            setActions((previous) => [...previous, blankAction(date)])
          }
        >
          Añadir acción
        </Button>
        {save.error && <p role="alert">{save.error.message}</p>}
        <div>
          <Button
            type="submit"
            disabled={save.isPending || !author.trim() || !summary.trim()}
          >
            Guardar acta
          </Button>
        </div>
      </form>
      {history.length > 0 && (
        <details>
          <summary className="cursor-pointer font-semibold">
            Historial de actas ({history.length})
          </summary>
          {history.map((note) => (
            <article
              className="mt-3 space-y-2 border-t pt-3"
              key={note.revision}
            >
              <strong>
                Revisión {note.revision} · {note.author}
              </strong>
              <p>{note.summary}</p>
              {note.actions.map((a, i) => {
                const d = decisions.find((d) => d.id === a.decisionId);
                const url = d?.url ?? a.decisionUrl;
                return (
                  <p key={i}>
                    {a.task} · {a.owner} · {formatDate(a.reviewDate)} ·{" "}
                    {a.status}{" "}
                    {url && a.decisionId && (
                      <Link
                        className="underline"
                        to={`/landing?url=${encodeURIComponent(url)}&decision=${encodeURIComponent(a.decisionId)}`}
                      >
                        {d?.municipality ?? url}
                      </Link>
                    )}
                  </p>
                );
              })}
            </article>
          ))}
        </details>
      )}
    </div>
  );
}

export function WeeklyMinutes({
  dates,
  date,
  onDate,
}: {
  dates: string[];
  date: string;
  onDate: (date: string) => void;
}) {
  const q = useQuery({
    queryKey: ["weekly", date],
    queryFn: () => api.weeklyHistory(date),
  });
  const learning = useQuery({
    queryKey: ["measurement-learning"],
    queryFn: api.learning,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acta de la revisión semanal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label>
          Sesión
          <Select value={date} onChange={(e) => onDate(e.target.value)}>
            {dates.map((d) => (
              <option key={d} value={d}>
                {formatDate(d)}
              </option>
            ))}
          </Select>
        </label>
        <Link className="inline-block text-sm underline" to="/measurement">
          Consultar calidad, SQL y controles que no deben empeorar
        </Link>
        {q.error || learning.error ? (
          <ErrorState
            error={q.error ?? learning.error ?? new Error("Error de lectura")}
            retry={() => {
              void q.refetch();
              void learning.refetch();
            }}
          />
        ) : q.data && learning.data ? (
          <WeeklyEditor
            key={date + ":" + (q.data[0]?.revision ?? 0)}
            date={date}
            history={q.data}
            decisions={learning.data.decisions}
          />
        ) : (
          <LoadingState cards={1} />
        )}
      </CardContent>
    </Card>
  );
}

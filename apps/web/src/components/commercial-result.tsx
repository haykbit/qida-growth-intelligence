import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qida/ui";
import type { SqlResult } from "@qida/contracts";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { ErrorState, LoadingState } from "./feedback";

const number = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

export function CommercialEvidence({ result }: { result: SqlResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <strong className="text-2xl tabular-nums">
          {result.difference === null
            ? "Pendiente"
            : number.format(result.difference)}
        </strong>
        <span className="text-sm">
          SQL por municipio y semana · diferencia de cambios
        </span>
        <Badge tone={result.warnings.length ? "warning" : "neutral"}>
          {result.warnings.length ? "Inconcluso" : "Estimación descriptiva"}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Corte de la simulación {formatDate(result.asOf)}. La comparación usa las
        semanas completas con 34 días de maduración desde su cierre. Las altas
        se leen a 90 días de la fecha SQL.
      </p>
      {result.warnings.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {result.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Ventana madura",
                "Grupo",
                "Municipios",
                "Semanas",
                "SQL",
                "SQL / municipio-semana",
                "Altas / SQL maduros",
              ].map((t) => (
                <TableHead key={t}>{t}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(["Antes", "Después"] as const).flatMap((period) =>
              (["treatment", "control"] as const).map((group) => {
                const rows = result.weeks.filter(
                  (w) =>
                    w.group === group &&
                    w.mature &&
                    w.week < 0 === (period === "Antes"),
                );
                const sql = rows.reduce((a, w) => a + w.sql, 0);
                const denominator = rows.reduce(
                  (a, w) => a + w.municipalities,
                  0,
                );
                return (
                  <TableRow key={period + group}>
                    <TableCell>{period}</TableCell>
                    <TableCell>
                      {group === "control" ? "Control" : "Tratamiento"}
                    </TableCell>
                    <TableCell>{rows[0]?.municipalities ?? "—"}</TableCell>
                    <TableCell>{rows.length}</TableCell>
                    <TableCell>{rows.length ? sql : "—"}</TableCell>
                    <TableCell>
                      {denominator ? number.format(sql / denominator) : "—"}
                    </TableCell>
                    <TableCell>
                      {rows.length
                        ? rows.reduce((a, w) => a + w.altas, 0) +
                          " / " +
                          rows.reduce((a, w) => a + w.matureSql, 0)
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              }),
            )}
          </TableBody>
        </Table>
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-semibold">
          Semanas, sesiones y canales
        </summary>
        <p className="my-3 text-sm">
          Cambio de la brecha tratamiento–control entre las dos mitades del
          periodo previo:{" "}
          {result.preTrendGap === null
            ? "pendiente"
            : number.format(result.preTrendGap)}{" "}
          SQL por municipio-semana. Los canales se comparan sobre los SQL
          elegibles de los municipios asignados.
        </p>
        <div className="max-h-80 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Inicio",
                  "Ventana",
                  "Grupo",
                  "Sesiones web",
                  "SQL CRM",
                  "SQL teléfono",
                  "SQL pago",
                  "Madurez",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.weeks.map((w) => (
                <TableRow key={w.start + w.group}>
                  <TableCell>{formatDate(w.start)}</TableCell>
                  <TableCell>{w.week < 0 ? "Previa" : "Exposición"}</TableCell>
                  <TableCell>
                    {w.group === "control" ? "Control" : "Tratamiento"}
                  </TableCell>
                  <TableCell>{w.sessions}</TableCell>
                  <TableCell>{w.sql}</TableCell>
                  <TableCell>{w.phone}</TableCell>
                  <TableCell>{w.paid}</TableCell>
                  <TableCell>{w.mature ? "Madura" : "Provisional"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>
    </div>
  );
}

export function CommercialResult({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["experiment-sql", id],
    queryFn: () => api.experimentSql(id),
  });
  const experiment = useQuery({
    queryKey: ["experiment-detail", id],
    queryFn: () => api.experiment(id),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>SQL familiares elegibles frente al control</CardTitle>
      </CardHeader>
      <CardContent>
        {experiment.data && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Municipios asignados
            </summary>
            {(["treatment", "control"] as const).map((group) => (
              <p key={group} className="mt-2 text-sm">
                <strong>
                  {group === "control" ? "Control" : "Tratamiento"}
                </strong>{" "}
                ·{" "}
                {experiment.data?.assignments
                  .filter((a) => a.variant === group)
                  .map((a) => a.municipality)
                  .join(", ") || "Sin municipios"}
              </p>
            ))}
          </details>
        )}
        {q.data ? (
          <CommercialEvidence result={q.data} />
        ) : q.error instanceof Error ? (
          <ErrorState error={q.error} retry={() => void q.refetch()} />
        ) : (
          <LoadingState cards={1} />
        )}
      </CardContent>
    </Card>
  );
}

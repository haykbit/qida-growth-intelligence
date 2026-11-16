import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  Badge,
  Card,
  CardContent,
  CardDescription,
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

function resultSummary(value: number | null): string {
  if (value === null)
    return "Todavía no hay suficientes semanas completas para comparar las versiones.";
  if (value > 0)
    return `La nueva landing obtuvo ${number.format(value)} SQL más por municipio y semana que la versión anterior, después de descontar la evolución general.`;
  if (value < 0)
    return `La nueva landing obtuvo ${number.format(Math.abs(value))} SQL menos por municipio y semana que la versión anterior, después de descontar la evolución general.`;
  return "La nueva landing y la versión anterior evolucionaron igual durante el periodo analizado.";
}

function previousPeriodSummary(value: number | null): string {
  if (value === null)
    return "No hay suficientes semanas anteriores para comprobar si ambos grupos partían de una situación comparable.";
  return `Antes del cambio, la evolución de ambos grupos difería en ${number.format(Math.abs(value))} SQL por municipio y semana. Una diferencia cercana a cero indica que partían de situaciones más comparables.`;
}

export function CommercialEvidence({ result }: { result: SqlResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>
              Resultado frente a la versión anterior
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {result.difference === null
                ? "Sin datos suficientes"
                : `${result.difference >= 0 ? "+" : ""}${number.format(result.difference)}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {resultSummary(result.difference)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Comparabilidad antes del cambio</CardDescription>
            <CardTitle>
              {result.preTrendGap === null
                ? "Sin datos suficientes"
                : `${number.format(Math.abs(result.preTrendGap))} SQL de diferencia`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {previousPeriodSummary(result.preTrendGap)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Comprobación de otros canales</CardDescription>
            <CardTitle>Llamadas y campañas de pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Comprobamos si el cambio solo desplazó SQL desde teléfono o
              publicidad en lugar de generar resultados adicionales.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={result.warnings.length ? "warning" : "success"}>
          {result.warnings.length
            ? "Requiere revisión"
            : "Datos suficientes para interpretar"}
        </Badge>
        <p className="text-sm text-muted-foreground">
          Datos disponibles hasta {formatDate(result.asOf)}. Solo se comparan
          semanas completas. Las altas se calculan con SQL que llevan 90 días en
          seguimiento.
        </p>
      </div>
      {result.warnings.length > 0 && (
        <div className="grid gap-2">
          {result.warnings.map((warning) => (
            <Alert key={warning}>
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Periodo",
                "Versión",
                "Municipios",
                "Semanas",
                "SQL",
                "SQL / municipio-semana",
                "Altas / SQL con 90 días",
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
                      {group === "control"
                        ? "Versión anterior"
                        : "Nueva landing"}
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
          Ver desglose semanal y por canal
        </summary>
        <p className="my-3 text-sm leading-6 text-muted-foreground">
          El desglose permite comprobar cuándo se registró cada resultado y si
          procede de web, teléfono o publicidad.
        </p>
        <div className="max-h-80 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Inicio",
                  "Momento",
                  "Versión",
                  "Sesiones web",
                  "SQL CRM",
                  "SQL teléfono",
                  "SQL pago",
                  "Estado de la semana",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.weeks.map((w) => (
                <TableRow key={w.start + w.group}>
                  <TableCell>{formatDate(w.start)}</TableCell>
                  <TableCell>
                    {w.week < 0 ? "Antes del cambio" : "Después del cambio"}
                  </TableCell>
                  <TableCell>
                    {w.group === "control"
                      ? "Versión anterior"
                      : "Nueva landing"}
                  </TableCell>
                  <TableCell>{w.sessions}</TableCell>
                  <TableCell>{w.sql}</TableCell>
                  <TableCell>{w.phone}</TableCell>
                  <TableCell>{w.paid}</TableCell>
                  <TableCell>
                    {w.mature ? "Lista para analizar" : "Aún incompleta"}
                  </TableCell>
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
        <CardTitle>
          Resultados de la nueva landing frente a la versión anterior
        </CardTitle>
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
                  {group === "control" ? "Versión anterior" : "Nueva landing"}
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

import { sqlWeekSchema, type SqlWeek, type SqlResult } from "@qida/contracts";

// Every assigned municipality contributes to the denominator, including zero-count weeks.
// The observation cutoff belongs to the persisted simulation, independent of wall-clock time.
export const experimentSql = `
WITH bounds AS (
  SELECT ge.start_date, ge.end_date, sr.simulation_date AS cutoff,
         (SELECT MIN(fecha_creacion)::date FROM lead) AS first_observed
  FROM growth_experiment ge CROSS JOIN (SELECT MAX(simulation_date) AS simulation_date FROM seed_run) sr
  WHERE ge.experiment_id = $1
), weeks AS (
  SELECT n AS week, start_date + 7*n AS start, cutoff
  FROM bounds CROSS JOIN generate_series(-12,7) n
  WHERE start_date + 7*n >= first_observed AND start_date + 7*n + 6 <= COALESCE(end_date,cutoff)
    AND start_date + 7*n + 6 <= cutoff
), assigned AS (
  SELECT ea.* FROM experiment_assignment ea JOIN bounds ON true
  WHERE ea.experiment_id = $1 AND ea.assigned_at::date <= bounds.start_date
), eligible AS (
  SELECT l.municipio_id, l.fecha_sql::date AS qualified, l.fecha_alta::date AS activated, l.canal
  FROM lead l JOIN assigned a USING (municipio_id)
  JOIN care_opportunity co ON co.lead_id = l.lead_id
  JOIN motor_municipio m ON m.municipio_id = l.municipio_id
  WHERE l.es_sql AND l.tipo_contacto = 'familia_cuidado' AND m.datos_propios
    AND m.tiene_cobertura AND l.servicio = ANY(m.servicios_cubiertos) AND m.cuidadoras_disponibles_30d >= 8
    AND NOT EXISTS (SELECT 1 FROM audit_log p WHERE p.entity_type='experiment' AND p.action='experiment.protocol_registered'
      AND p.entity_id=$1 AND p.metadata->>'service' <> l.servicio)
    AND NOT EXISTS (SELECT 1 FROM identity_map i WHERE i.person_id = co.person_id AND i.ambiguous)
), crm AS (
  SELECT w.week, a.variant, count(e.qualified)::int AS sql,
    count(*) FILTER (WHERE e.qualified + 90 <= w.cutoff)::int AS mature,
    count(*) FILTER (WHERE e.qualified + 90 <= w.cutoff AND e.activated BETWEEN e.qualified AND e.qualified + 90)::int AS altas,
    count(*) FILTER (WHERE e.canal = 'phone')::int AS phone,
    count(*) FILTER (WHERE e.canal IN ('paid_search','paid_social'))::int AS paid
  FROM weeks w CROSS JOIN assigned a LEFT JOIN eligible e ON e.municipio_id=a.municipio_id
    AND e.qualified BETWEEN w.start AND w.start + 6
  GROUP BY w.week, a.variant
), traffic AS (
  SELECT w.week, a.variant, SUM(ws.sesiones)::int AS sessions
  FROM weeks w CROSS JOIN assigned a JOIN landing l ON l.municipio_id=a.municipio_id
  JOIN web_sesiones_diarias ws ON ws.url_entrada=l.url AND ws.fecha BETWEEN w.start AND w.start + 6
  GROUP BY w.week, a.variant
)
SELECT c.week, to_char(w.start,'YYYY-MM-DD') AS start, c.variant AS "group",
  (SELECT COUNT(*)::int FROM assigned a WHERE a.variant=c.variant) AS municipalities,
  w.start + 6 <= w.cutoff AS mature, c.sql,c.altas,c.mature AS "matureSql",c.phone,c.paid,COALESCE(t.sessions,0) AS sessions
FROM crm c JOIN weeks w USING (week) LEFT JOIN traffic t USING (week,variant) ORDER BY c.week,c.variant`;

export function sqlReadout(asOf: string, raw: unknown): SqlResult {
  const weeks = sqlWeekSchema.array().parse(raw);
  const average = (rows: SqlWeek[], field: "sql" | "phone" | "paid") => {
    const denominator = rows.reduce((n, r) => n + r.municipalities, 0);
    return denominator
      ? rows.reduce((n, r) => n + r[field], 0) / denominator
      : null;
  };
  function gap(
    from: number,
    until: number,
    field: "sql" | "phone" | "paid" = "sql",
  ) {
    const rows = weeks.filter(
      (r) => r.mature && r.week >= from && r.week < until,
    );
    const t = average(
      rows.filter((r) => r.group === "treatment"),
      field,
    );
    const c = average(
      rows.filter((r) => r.group === "control"),
      field,
    );
    return t === null || c === null ? null : t - c;
  }
  function delta(a: number | null, b: number | null) {
    return a === null || b === null ? null : Number((a - b).toFixed(3));
  }
  const difference = delta(gap(0, 8), gap(-12, 0));
  const preTrendGap = delta(gap(-6, 0), gap(-12, -6));
  const warnings: string[] = [];
  if (weeks.filter((r) => r.week < 0).length < 24)
    warnings.push(
      "Faltan semanas previas comunes para comprobar las tendencias.",
    );
  if (weeks.filter((r) => r.week >= 0 && r.mature).length < 16)
    warnings.push("Todavía no hay ocho semanas completas después del cambio.");
  if (weeks.some((r) => r.municipalities < 10) || difference === null)
    warnings.push("Muestra municipal insuficiente.");
  if (
    preTrendGap !== null &&
    difference !== null &&
    Math.abs(preTrendGap) >= Math.abs(difference) &&
    preTrendGap !== 0
  )
    warnings.push(
      "La divergencia previa es tan grande como el cambio observado o mayor.",
    );
  if (
    difference !== null &&
    ["treatment", "control"].some(
      (group) =>
        !weeks.some(
          (w) => w.group === group && w.week >= 0 && w.mature && w.sql > 0,
        ),
    )
  )
    warnings.push(
      "Una de las versiones no registra SQL durante las semanas analizadas.",
    );
  for (const field of ["phone", "paid"] as const) {
    if ((delta(gap(0, 8, field), gap(-12, 0, field)) ?? 0) < 0)
      warnings.push(
        field === "phone"
          ? "Posible desplazamiento de SQL de teléfono."
          : "Posible desplazamiento de SQL de pago.",
      );
  }
  return { asOf, weeks, difference, preTrendGap, warnings };
}

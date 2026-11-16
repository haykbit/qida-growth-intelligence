export type MetricDefinition = {
  key: string;
  label: string;
  formula: string;
  sources: string[];
  grain: string;
  window: string;
  limitations: string;
};

export type MetricTree = {
  business: MetricDefinition[];
  operational: MetricDefinition[];
  guardrails: MetricDefinition[];
};

export const metricTree: MetricTree = {
  business: [
    {
      key: "mature_sql_to_alta",
      label: "SQL → alta con seguimiento completo",
      formula: "altas / SQL elegibles con al menos 90 días de seguimiento",
      sources: ["care_opportunity", "lead"],
      grain: "SQL agrupados por servicio y fecha",
      window: "90 días de seguimiento",
      limitations:
        "No demuestra que la landing causara el alta; excluye contactos de cuidadoras y SQL más recientes.",
    },
    {
      key: "cost_per_reconciled_alta",
      label: "Coste por alta reconciliada",
      formula: "coste Ads / altas CRM atribuibles",
      sources: ["ads_diario", "journey_event", "care_opportunity"],
      grain: "campaña y mes",
      window: "mensual",
      limitations:
        "No reparte campañas sin segmentación municipal y no equivale a incrementalidad.",
    },
    {
      key: "eligible_opportunity_value",
      label: "Oportunidades elegibles priorizadas",
      formula: "recuento de recomendaciones elegibles por reglas",
      sources: ["growth_recommendation", "motor_municipio"],
      grain: "municipio-servicio",
      window: "snapshot",
      limitations: "Score de reglas, no predicción validada.",
    },
  ],
  operational: [
    {
      key: "family_sql",
      label: "SQL de familias",
      formula: "count(lead) where es_sql and tipo_contacto = familia_cuidado",
      sources: ["lead"],
      grain: "fecha de creación y canal",
      window: "diaria/mensual",
      limitations: "La fecha de creación no debe confundirse con fecha_sql.",
    },
    {
      key: "landing_form_rate",
      label: "Formularios por sesión",
      formula: "sum(formularios) / sum(sesiones)",
      sources: ["web_sesiones_diarias"],
      grain: "landing, canal y dispositivo",
      window: "diaria",
      limitations:
        "Describe conversión web; puede canibalizar teléfono u otros canales.",
    },
    {
      key: "indexation_rate",
      label: "Cobertura de indexación",
      formula: "landings indexadas / landings publicadas",
      sources: ["landing"],
      grain: "origen e idioma",
      window: "snapshot",
      limitations: "La indexación no garantiza tráfico ni demanda incremental.",
    },
  ],
  guardrails: [
    {
      key: "capacity_constrained_demand",
      label: "Demanda restringida por capacidad",
      formula: "búsquedas en municipios cubiertos con <4 cuidadoras",
      sources: ["motor_demanda_busqueda", "motor_municipio"],
      grain: "municipio-servicio-mes",
      window: "mensual",
      limitations: "El umbral es operativo y versionable.",
    },
    {
      key: "unidentified_event_rate",
      label: "Eventos sin identidad",
      formula: "eventos sin person_id / eventos",
      sources: ["journey_event"],
      grain: "source_system",
      window: "diaria",
      limitations: "Una identidad ausente no implica un evento inválido.",
    },
    {
      key: "channel_cannibalization",
      label: "Señal de canibalización",
      formula:
        "cambio tratamiento en canal objetivo versus cambio en otros canales",
      sources: ["experiment_assignment", "web_sesiones_diarias", "lead"],
      grain: "experimento, variante y canal",
      window: "pre/post",
      limitations:
        "Señal diagnóstica; exige grupos comparables y control de estacionalidad.",
    },
    {
      key: "negative_experiment_guardrail",
      label: "Experimentos con deterioro",
      formula: "DiD observada < 0 en métrica primaria o guardrail",
      sources: [
        "growth_experiment",
        "experiment_assignment",
        "web_sesiones_diarias",
      ],
      grain: "experimento",
      window: "pre/post",
      limitations: "No implica significación estadística.",
    },
  ],
};

export type MonitoringSignal = {
  key:
    | "indexation"
    | "traffic"
    | "conversion"
    | "staleness"
    | "coverage"
    | "quality"
    | "negative_experiment";
  condition: string;
  severity: "info" | "warning" | "critical";
  sources: string[];
};

export const monitoringSignals: MonitoringSignal[] = [
  {
    key: "indexation",
    condition: "published for 21 days without fecha_primera_indexacion",
    severity: "warning",
    sources: ["landing"],
  },
  {
    key: "traffic",
    condition: "sessions down >30% versus comparable prior 28 days",
    severity: "warning",
    sources: ["web_sesiones_diarias"],
  },
  {
    key: "conversion",
    condition: "form rate down >25% with at least 100 sessions",
    severity: "warning",
    sources: ["web_sesiones_diarias"],
  },
  {
    key: "staleness",
    condition: "latest source date older than its expected refresh SLA",
    severity: "critical",
    sources: ["gsc_diario", "web_sesiones_diarias", "ads_diario", "lead"],
  },
  {
    key: "coverage",
    condition: "demand exists where coverage is absent or capacity <4",
    severity: "info",
    sources: ["motor_municipio", "motor_demanda_busqueda"],
  },
  {
    key: "quality",
    condition:
      "invalid chronology, orphan conversion, or unidentified-event rate above 15%",
    severity: "critical",
    sources: ["lead", "care_opportunity", "journey_event"],
  },
  {
    key: "negative_experiment",
    condition: "observed DiD below zero in primary or guardrail metric",
    severity: "warning",
    sources: [
      "growth_experiment",
      "experiment_assignment",
      "web_sesiones_diarias",
    ],
  },
];

export type WorkbenchQuery = {
  id:
    | "municipality_prioritization"
    | "landing_cohort_comparison"
    | "quality_and_losses";
  title: string;
  sql: string;
  originalTables: string[];
  extensionTables: string[];
  interpretation: "descriptive" | "attribution" | "causal_candidate";
};

export const workbenchQueries: WorkbenchQuery[] = [
  {
    id: "municipality_prioritization",
    title: "Priorización municipio-servicio",
    originalTables: ["motor_municipio", "motor_demanda_busqueda", "lead"],
    extensionTables: ["growth_recommendation"],
    interpretation: "descriptive",
    sql: `WITH latest_demand AS (
  SELECT municipio_id, tema, busquedas, cpc_estimado_eur,
         ROW_NUMBER() OVER (PARTITION BY municipio_id, tema ORDER BY mes DESC) AS rn
  FROM motor_demanda_busqueda
), funnel AS (
  SELECT municipio_id, servicio,
         COUNT(*) FILTER (WHERE tipo_contacto = 'familia_cuidado' AND es_sql) AS sql,
         COUNT(*) FILTER (WHERE tipo_contacto = 'familia_cuidado' AND es_alta) AS altas
  FROM lead
  WHERE fecha_creacion >= $1::date AND fecha_creacion < $2::date
  GROUP BY municipio_id, servicio
)
SELECT m.municipio_id, m.nombre, d.tema AS servicio, d.busquedas,
       d.cpc_estimado_eur, COALESCE(f.sql, 0) AS sql, COALESCE(f.altas, 0) AS altas,
       m.cuidadoras_disponibles_30d, m.tiene_cobertura,
       r.score, r.explanation
FROM motor_municipio m
JOIN latest_demand d ON d.municipio_id = m.municipio_id AND d.rn = 1
LEFT JOIN funnel f ON f.municipio_id = d.municipio_id AND f.servicio = d.tema
LEFT JOIN growth_recommendation r ON r.municipio_id = d.municipio_id AND r.servicio = d.tema
ORDER BY r.score DESC NULLS LAST, d.busquedas DESC;`,
  },
  {
    id: "landing_cohort_comparison",
    title: "Cohortes de landings y grupos comparables",
    originalTables: [
      "landing",
      "web_sesiones_diarias",
      "lead",
      "motor_municipio",
    ],
    extensionTables: ["experiment_assignment", "growth_experiment"],
    interpretation: "causal_candidate",
    sql: `WITH landing_daily AS (
  SELECT l.municipio_id, l.url, l.origen, w.fecha,
         SUM(w.sesiones) AS sesiones, SUM(w.formularios) AS formularios
  FROM landing l
  JOIN web_sesiones_diarias w ON w.url_entrada = l.url
  WHERE w.fecha >= $1::date AND w.fecha < $2::date
  GROUP BY l.municipio_id, l.url, l.origen, w.fecha
), reconciled AS (
  SELECT municipio_id, url_entrada,
         COUNT(*) FILTER (WHERE tipo_contacto = 'familia_cuidado' AND es_sql) AS sql,
         COUNT(*) FILTER (WHERE tipo_contacto = 'familia_cuidado' AND es_alta) AS altas
  FROM lead
  WHERE fecha_creacion >= $1::date AND fecha_creacion < $2::date
  GROUP BY municipio_id, url_entrada
)
SELECT e.experiment_id, a.variant, d.origen,
       COUNT(DISTINCT d.municipio_id) AS municipios,
       SUM(d.sesiones) AS sesiones, SUM(d.formularios) AS formularios,
       SUM(COALESCE(r.sql, 0)) AS sql, SUM(COALESCE(r.altas, 0)) AS altas
FROM growth_experiment e
JOIN experiment_assignment a ON a.experiment_id = e.experiment_id
JOIN landing_daily d ON d.municipio_id = a.municipio_id
LEFT JOIN reconciled r ON r.municipio_id = d.municipio_id AND r.url_entrada = d.url
WHERE e.experiment_id = $3
GROUP BY e.experiment_id, a.variant, d.origen
ORDER BY a.variant, d.origen;`,
  },
  {
    id: "quality_and_losses",
    title: "Calidad de datos y pérdidas de funnel",
    originalTables: ["lead", "landing", "gsc_diario"],
    extensionTables: ["care_opportunity", "journey_event"],
    interpretation: "attribution",
    sql: `SELECT 'invalid_lead_chronology' AS issue, COUNT(*)::bigint AS affected
FROM lead
WHERE (es_sql AND (fecha_sql IS NULL OR fecha_sql < fecha_creacion))
   OR (es_alta AND (fecha_alta IS NULL OR fecha_sql IS NULL OR fecha_alta < fecha_sql))
UNION ALL
SELECT 'alta_without_opportunity', COUNT(*)::bigint
FROM lead l LEFT JOIN care_opportunity o ON o.lead_id = l.lead_id
WHERE l.es_alta AND o.opportunity_id IS NULL
UNION ALL
SELECT 'unidentified_events', COUNT(*)::bigint
FROM journey_event WHERE person_id IS NULL
UNION ALL
SELECT 'published_not_indexed', COUNT(*)::bigint
FROM landing WHERE fecha_publicacion IS NOT NULL AND fecha_primera_indexacion IS NULL
UNION ALL
SELECT 'gsc_clicks_before_indexation', COUNT(*)::bigint
FROM gsc_diario g JOIN landing l ON l.url = g.url
WHERE g.clics > 0 AND (l.fecha_primera_indexacion IS NULL OR g.fecha < l.fecha_primera_indexacion);`,
  },
];

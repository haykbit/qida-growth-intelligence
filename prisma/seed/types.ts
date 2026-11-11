export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type SyntheticDataset = {
  municipalities: Array<{ municipioId: string; nombre: string; provincia: string; comunidadAutonoma: string; tieneCobertura: boolean; serviciosCubiertos: string[]; cuidadorasDisponibles30d: number; oficinaMasCercanaKm: number; familiasActivas: number; mesesMediosServicio: number; nps12m: number | null; datosPropios: boolean }>;
  demand: Array<{ municipioId: string; tema: string; mes: Date; busquedas: number; competenciaAds: number; cpcEstimadoEur: number }>;
  voice: Array<{ municipioId: string; mes: Date; tema: string; tipo: string; llamadas: number; llamadasTotales: number; pctQidaDijoSi: number; expresiones: string[] }>;
  competitors: Array<{ municipioId: string; competidor: string; servicios: string[]; tieneLandingLocal: boolean; fechaRevision: Date }>;
  landings: Array<{ url: string; municipioId: string | null; idioma: "es" | "ca"; origen: "manual" | "generada"; fechaPublicacion: Date | null; fechaPrimeraIndexacion: Date | null }>;
  gsc: Array<{ fecha: Date; url: string; consulta: string; impresiones: number; clics: number; posicionMedia: number }>;
  webSessions: Array<{ fecha: Date; urlEntrada: string; canal: string; dispositivo: string; sesiones: number; formularios: number; clicsLlamar: number }>;
  ads: Array<{ adsId: string; fecha: Date; plataforma: string; campania: string; municipioId: string | null; impresiones: number; clics: number; costeEur: number; conversionesPlataforma: number }>;
  leads: Array<{ leadId: string; fechaCreacion: Date; municipioId: string | null; canal: string; urlEntrada: string | null; tipoContacto: string; esSql: boolean; fechaSql: Date | null; esAlta: boolean; fechaAlta: Date | null; servicio: string; motivoDescarte: string | null }>;
  identities: Array<{ identityId: string; personId: string; sourceSystem: string; sourceIdentifier: string; matchMethod: string; confidence: number; ambiguous: boolean; createdAt: Date }>;
  opportunities: Array<{ opportunityId: string; personId: string; municipioId: string; servicio: string; createdAt: Date; status: string; leadId: string; sqlAt: Date | null; altaAt: Date | null }>;
  events: Array<{ eventId: string; personId: string | null; opportunityId: string | null; sessionId: string | null; eventType: string; sourceSystem: string; occurredAt: Date; channel: string | null; campaign: string | null; landingUrl: string | null; metadata: JsonValue; identityConfidence: number | null }>;
  experiments: Array<{ experimentId: string; name: string; hypothesis: string; startDate: Date; endDate: Date | null; status: "draft" | "running" | "completed" | "cancelled"; primaryMetric: string; methodology: string }>;
  assignments: Array<{ experimentId: string; municipioId: string; variant: string; assignedAt: Date }>;
  recommendations: Array<{ recommendationId: string; municipioId: string; servicio: string; score: number; expectedImpact: string; confidence: number; explanation: JsonValue; status: "proposed" | "accepted" | "dismissed" | "completed"; rulesVersion: string; createdAt: Date }>;
  workflows: Array<{ url: string; service: string; status: "draft" | "pending_review" | "approved" | "published" | "rejected"; blocks: JsonValue; content: JsonValue; validationIssues: JsonValue; reviewedAt: Date | null; approvedAt: Date | null; publishedAt: Date | null; approvedBy: string | null; updatedAt: Date }>;
  auditLogs: Array<{ auditId: string; action: string; entityType: string; entityId: string; actorRole: string; requestId: string | null; metadata: JsonValue; createdAt: Date }>;
  scenarios: Array<{ code: string; name: string; description: string; subjectType: string; subjectId: string; metadata: JsonValue; createdAt: Date }>;
  seedRun: { runId: string; seed: number; simulationDate: Date; generatorVersion: string; datasetChecksum: string; createdAt: Date };
};

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LandingLanguage" AS ENUM ('es', 'ca');

-- CreateEnum
CREATE TYPE "LandingOrigin" AS ENUM ('manual', 'generada');

-- CreateEnum
CREATE TYPE "LandingWorkflowStatus" AS ENUM ('draft', 'pending_review', 'approved', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('draft', 'running', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('proposed', 'accepted', 'dismissed', 'completed');

-- CreateTable
CREATE TABLE "motor_municipio" (
    "municipio_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "comunidad_autonoma" TEXT NOT NULL,
    "tiene_cobertura" BOOLEAN NOT NULL,
    "servicios_cubiertos" TEXT[],
    "cuidadoras_disponibles_30d" INTEGER NOT NULL,
    "oficina_mas_cercana_km" DOUBLE PRECISION NOT NULL,
    "familias_activas" INTEGER NOT NULL,
    "meses_medios_servicio" DOUBLE PRECISION NOT NULL,
    "nps_12m" DOUBLE PRECISION,
    "datos_propios" BOOLEAN NOT NULL,

    CONSTRAINT "motor_municipio_pkey" PRIMARY KEY ("municipio_id")
);

-- CreateTable
CREATE TABLE "motor_demanda_busqueda" (
    "municipio_id" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "mes" DATE NOT NULL,
    "busquedas" INTEGER NOT NULL,
    "competencia_ads" DOUBLE PRECISION NOT NULL,
    "cpc_estimado_eur" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "motor_demanda_busqueda_pkey" PRIMARY KEY ("municipio_id","tema","mes")
);

-- CreateTable
CREATE TABLE "motor_voz_cliente" (
    "municipio_id" TEXT NOT NULL,
    "mes" DATE NOT NULL,
    "tema" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "llamadas" INTEGER NOT NULL,
    "llamadas_totales" INTEGER NOT NULL,
    "pct_qida_dijo_si" DOUBLE PRECISION NOT NULL,
    "expresiones" TEXT[],

    CONSTRAINT "motor_voz_cliente_pkey" PRIMARY KEY ("municipio_id","mes","tema","tipo")
);

-- CreateTable
CREATE TABLE "motor_competencia" (
    "municipio_id" TEXT NOT NULL,
    "competidor" TEXT NOT NULL,
    "servicios" TEXT[],
    "tiene_landing_local" BOOLEAN NOT NULL,
    "fecha_revision" DATE NOT NULL,

    CONSTRAINT "motor_competencia_pkey" PRIMARY KEY ("municipio_id","competidor")
);

-- CreateTable
CREATE TABLE "landing" (
    "url" TEXT NOT NULL,
    "municipio_id" TEXT,
    "idioma" "LandingLanguage" NOT NULL,
    "origen" "LandingOrigin" NOT NULL,
    "fecha_publicacion" TIMESTAMP(3),
    "fecha_primera_indexacion" TIMESTAMP(3),

    CONSTRAINT "landing_pkey" PRIMARY KEY ("url")
);

-- CreateTable
CREATE TABLE "gsc_diario" (
    "fecha" DATE NOT NULL,
    "url" TEXT NOT NULL,
    "consulta" TEXT NOT NULL,
    "impresiones" INTEGER NOT NULL,
    "clics" INTEGER NOT NULL,
    "posicion_media" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "gsc_diario_pkey" PRIMARY KEY ("fecha","url","consulta")
);

-- CreateTable
CREATE TABLE "web_sesiones_diarias" (
    "fecha" DATE NOT NULL,
    "url_entrada" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "dispositivo" TEXT NOT NULL,
    "sesiones" INTEGER NOT NULL,
    "formularios" INTEGER NOT NULL,
    "clics_llamar" INTEGER NOT NULL,

    CONSTRAINT "web_sesiones_diarias_pkey" PRIMARY KEY ("fecha","url_entrada","canal","dispositivo")
);

-- CreateTable
CREATE TABLE "ads_diario" (
    "ads_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "plataforma" TEXT NOT NULL,
    "campania" TEXT NOT NULL,
    "municipio_id" TEXT,
    "impresiones" INTEGER NOT NULL,
    "clics" INTEGER NOT NULL,
    "coste_eur" DECIMAL(12,2) NOT NULL,
    "conversiones_plataforma" INTEGER NOT NULL,

    CONSTRAINT "ads_diario_pkey" PRIMARY KEY ("ads_id")
);

-- CreateTable
CREATE TABLE "lead" (
    "lead_id" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL,
    "municipio_id" TEXT,
    "canal" TEXT NOT NULL,
    "url_entrada" TEXT,
    "tipo_contacto" TEXT NOT NULL,
    "es_sql" BOOLEAN NOT NULL,
    "fecha_sql" TIMESTAMP(3),
    "es_alta" BOOLEAN NOT NULL,
    "fecha_alta" TIMESTAMP(3),
    "servicio" TEXT NOT NULL,
    "motivo_descarte" TEXT,

    CONSTRAINT "lead_pkey" PRIMARY KEY ("lead_id")
);

-- CreateTable
CREATE TABLE "identity_map" (
    "identity_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "source_system" TEXT NOT NULL,
    "source_identifier" TEXT NOT NULL,
    "match_method" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "ambiguous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_map_pkey" PRIMARY KEY ("identity_id")
);

-- CreateTable
CREATE TABLE "care_opportunity" (
    "opportunity_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "municipio_id" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "lead_id" TEXT,
    "sql_at" TIMESTAMP(3),
    "alta_at" TIMESTAMP(3),

    CONSTRAINT "care_opportunity_pkey" PRIMARY KEY ("opportunity_id")
);

-- CreateTable
CREATE TABLE "journey_event" (
    "event_id" TEXT NOT NULL,
    "person_id" TEXT,
    "opportunity_id" TEXT,
    "session_id" TEXT,
    "event_type" TEXT NOT NULL,
    "source_system" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "channel" TEXT,
    "campaign" TEXT,
    "landing_url" TEXT,
    "metadata" JSONB NOT NULL,
    "identity_confidence" DOUBLE PRECISION,

    CONSTRAINT "journey_event_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "growth_experiment" (
    "experiment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "ExperimentStatus" NOT NULL,
    "primary_metric" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,

    CONSTRAINT "growth_experiment_pkey" PRIMARY KEY ("experiment_id")
);

-- CreateTable
CREATE TABLE "experiment_assignment" (
    "experiment_id" TEXT NOT NULL,
    "municipio_id" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiment_assignment_pkey" PRIMARY KEY ("experiment_id","municipio_id")
);

-- CreateTable
CREATE TABLE "growth_recommendation" (
    "recommendation_id" TEXT NOT NULL,
    "municipio_id" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "expected_impact" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "explanation" JSONB NOT NULL,
    "status" "RecommendationStatus" NOT NULL,
    "rules_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_recommendation_pkey" PRIMARY KEY ("recommendation_id")
);

-- CreateTable
CREATE TABLE "landing_workflow" (
    "url" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "status" "LandingWorkflowStatus" NOT NULL,
    "blocks" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "validation_issues" JSONB NOT NULL,
    "reviewed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_workflow_pkey" PRIMARY KEY ("url")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "audit_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "request_id" TEXT,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "synthetic_scenario" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synthetic_scenario_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "seed_run" (
    "run_id" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "simulation_date" DATE NOT NULL,
    "generator_version" TEXT NOT NULL,
    "dataset_checksum" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seed_run_pkey" PRIMARY KEY ("run_id")
);

-- CreateIndex
CREATE INDEX "motor_municipio_provincia_idx" ON "motor_municipio"("provincia");

-- CreateIndex
CREATE INDEX "motor_demanda_busqueda_mes_tema_idx" ON "motor_demanda_busqueda"("mes", "tema");

-- CreateIndex
CREATE INDEX "motor_voz_cliente_mes_tema_idx" ON "motor_voz_cliente"("mes", "tema");

-- CreateIndex
CREATE INDEX "landing_municipio_id_idioma_idx" ON "landing"("municipio_id", "idioma");

-- CreateIndex
CREATE INDEX "gsc_diario_url_fecha_idx" ON "gsc_diario"("url", "fecha");

-- CreateIndex
CREATE INDEX "web_sesiones_diarias_canal_fecha_idx" ON "web_sesiones_diarias"("canal", "fecha");

-- CreateIndex
CREATE INDEX "ads_diario_fecha_plataforma_idx" ON "ads_diario"("fecha", "plataforma");

-- CreateIndex
CREATE UNIQUE INDEX "ads_diario_fecha_plataforma_campania_municipio_id_key" ON "ads_diario"("fecha", "plataforma", "campania", "municipio_id");

-- CreateIndex
CREATE INDEX "lead_fecha_creacion_canal_idx" ON "lead"("fecha_creacion", "canal");

-- CreateIndex
CREATE INDEX "lead_municipio_id_servicio_idx" ON "lead"("municipio_id", "servicio");

-- CreateIndex
CREATE INDEX "lead_es_sql_fecha_sql_idx" ON "lead"("es_sql", "fecha_sql");

-- CreateIndex
CREATE INDEX "identity_map_person_id_idx" ON "identity_map"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "identity_map_source_system_source_identifier_key" ON "identity_map"("source_system", "source_identifier");

-- CreateIndex
CREATE UNIQUE INDEX "care_opportunity_lead_id_key" ON "care_opportunity"("lead_id");

-- CreateIndex
CREATE INDEX "care_opportunity_person_id_created_at_idx" ON "care_opportunity"("person_id", "created_at");

-- CreateIndex
CREATE INDEX "care_opportunity_municipio_id_servicio_status_idx" ON "care_opportunity"("municipio_id", "servicio", "status");

-- CreateIndex
CREATE INDEX "journey_event_person_id_occurred_at_idx" ON "journey_event"("person_id", "occurred_at");

-- CreateIndex
CREATE INDEX "journey_event_opportunity_id_occurred_at_idx" ON "journey_event"("opportunity_id", "occurred_at");

-- CreateIndex
CREATE INDEX "journey_event_session_id_idx" ON "journey_event"("session_id");

-- CreateIndex
CREATE INDEX "experiment_assignment_municipio_id_idx" ON "experiment_assignment"("municipio_id");

-- CreateIndex
CREATE INDEX "growth_recommendation_status_score_idx" ON "growth_recommendation"("status", "score");

-- CreateIndex
CREATE INDEX "growth_recommendation_municipio_id_servicio_idx" ON "growth_recommendation"("municipio_id", "servicio");

-- CreateIndex
CREATE INDEX "landing_workflow_status_updated_at_idx" ON "landing_workflow"("status", "updated_at");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_created_at_idx" ON "audit_log"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_request_id_idx" ON "audit_log"("request_id");

-- CreateIndex
CREATE INDEX "synthetic_scenario_subject_type_subject_id_idx" ON "synthetic_scenario"("subject_type", "subject_id");

-- AddForeignKey
ALTER TABLE "motor_demanda_busqueda" ADD CONSTRAINT "motor_demanda_busqueda_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "motor_municipio"("municipio_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motor_voz_cliente" ADD CONSTRAINT "motor_voz_cliente_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "motor_municipio"("municipio_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motor_competencia" ADD CONSTRAINT "motor_competencia_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "motor_municipio"("municipio_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing" ADD CONSTRAINT "landing_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "motor_municipio"("municipio_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gsc_diario" ADD CONSTRAINT "gsc_diario_url_fkey" FOREIGN KEY ("url") REFERENCES "landing"("url") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "web_sesiones_diarias" ADD CONSTRAINT "web_sesiones_diarias_url_entrada_fkey" FOREIGN KEY ("url_entrada") REFERENCES "landing"("url") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_diario" ADD CONSTRAINT "ads_diario_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "motor_municipio"("municipio_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "motor_municipio"("municipio_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_url_entrada_fkey" FOREIGN KEY ("url_entrada") REFERENCES "landing"("url") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_opportunity" ADD CONSTRAINT "care_opportunity_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "motor_municipio"("municipio_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_opportunity" ADD CONSTRAINT "care_opportunity_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("lead_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_event" ADD CONSTRAINT "journey_event_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "care_opportunity"("opportunity_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_event" ADD CONSTRAINT "journey_event_landing_url_fkey" FOREIGN KEY ("landing_url") REFERENCES "landing"("url") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_assignment" ADD CONSTRAINT "experiment_assignment_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "growth_experiment"("experiment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_assignment" ADD CONSTRAINT "experiment_assignment_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "motor_municipio"("municipio_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_recommendation" ADD CONSTRAINT "growth_recommendation_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "motor_municipio"("municipio_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_workflow" ADD CONSTRAINT "landing_workflow_url_fkey" FOREIGN KEY ("url") REFERENCES "landing"("url") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain invariants that should fail at the storage boundary.
ALTER TABLE "motor_municipio" ADD CONSTRAINT "motor_municipio_nonnegative_capacity" CHECK ("cuidadoras_disponibles_30d" >= 0 AND "familias_activas" >= 0 AND "meses_medios_servicio" >= 0);
ALTER TABLE "motor_demanda_busqueda" ADD CONSTRAINT "motor_demanda_nonnegative" CHECK ("busquedas" >= 0 AND "competencia_ads" >= 0 AND "competencia_ads" <= 1 AND "cpc_estimado_eur" >= 0);
ALTER TABLE "motor_voz_cliente" ADD CONSTRAINT "motor_voz_valid_counts" CHECK ("llamadas" >= 0 AND "llamadas_totales" >= "llamadas" AND "pct_qida_dijo_si" >= 0 AND "pct_qida_dijo_si" <= 1);
ALTER TABLE "gsc_diario" ADD CONSTRAINT "gsc_valid_counts" CHECK ("impresiones" >= 0 AND "clics" >= 0 AND "clics" <= "impresiones" AND "posicion_media" >= 0);
ALTER TABLE "web_sesiones_diarias" ADD CONSTRAINT "web_valid_counts" CHECK ("sesiones" >= 0 AND "formularios" >= 0 AND "formularios" <= "sesiones" AND "clics_llamar" >= 0 AND "clics_llamar" <= "sesiones");
ALTER TABLE "ads_diario" ADD CONSTRAINT "ads_valid_counts" CHECK ("impresiones" >= 0 AND "clics" >= 0 AND "clics" <= "impresiones" AND "coste_eur" >= 0 AND "conversiones_plataforma" >= 0);
ALTER TABLE "lead" ADD CONSTRAINT "lead_sql_chronology" CHECK (("es_sql" AND "fecha_sql" IS NOT NULL AND "fecha_sql" >= "fecha_creacion") OR (NOT "es_sql" AND "fecha_sql" IS NULL));
ALTER TABLE "lead" ADD CONSTRAINT "lead_alta_chronology" CHECK (("es_alta" AND "es_sql" AND "fecha_alta" IS NOT NULL AND "fecha_alta" >= "fecha_sql") OR (NOT "es_alta" AND "fecha_alta" IS NULL));
ALTER TABLE "identity_map" ADD CONSTRAINT "identity_confidence_range" CHECK ("confidence" >= 0 AND "confidence" <= 1);
ALTER TABLE "care_opportunity" ADD CONSTRAINT "opportunity_chronology" CHECK (("sql_at" IS NULL OR "sql_at" >= "created_at") AND ("alta_at" IS NULL OR ("sql_at" IS NOT NULL AND "alta_at" >= "sql_at")));
ALTER TABLE "journey_event" ADD CONSTRAINT "journey_identity_confidence_range" CHECK ("identity_confidence" IS NULL OR ("identity_confidence" >= 0 AND "identity_confidence" <= 1));
ALTER TABLE "growth_recommendation" ADD CONSTRAINT "recommendation_ranges" CHECK ("score" >= 0 AND "score" <= 100 AND "confidence" >= 0 AND "confidence" <= 1);

import type { Prisma } from "@prisma/client";

// Additive fixtures for the local demo. Existing human decisions are never replaced.
export async function seedDecisionExamples(tx: Prisma.TransactionClient) {
  const proposal = await tx.auditLog.findUnique({
    where: { auditId: "audit-decision-0001" },
  });
  if (
    proposal?.entityId === "/cuidados/zaragoza-50297" &&
    proposal.action === "landing.decision_recorded"
  ) {
    const experimentId = "pilot-zaragoza-cta";
    const [candidate] = await tx.$queryRaw<Array<{ municipio_id: string }>>`
      WITH baseline AS (
        SELECT m.municipio_id,m.provincia,count(l.lead_id) AS volume
        FROM motor_municipio m LEFT JOIN lead l ON l.municipio_id=m.municipio_id
          AND l.es_sql AND l.tipo_contacto='familia_cuidado' AND l.servicio='acompanamiento'
          AND l.fecha_sql BETWEEN ${proposal.createdAt}::timestamp - interval '12 weeks' AND ${proposal.createdAt}
        WHERE m.datos_propios AND m.tiene_cobertura AND m.cuidadoras_disponibles_30d>=8
          AND 'acompanamiento'=ANY(m.servicios_cubiertos)
        GROUP BY m.municipio_id,m.provincia
      ) SELECT b.municipio_id FROM baseline b JOIN baseline z ON z.municipio_id='50297'
        WHERE b.municipio_id<>z.municipio_id
        ORDER BY (b.provincia=z.provincia) DESC,ABS(b.volume-z.volume), b.municipio_id LIMIT 1`;
    if (candidate) {
      const start = new Date(proposal.createdAt);
      start.setUTCDate(start.getUTCDate() + 1);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 55 * 86400000);
      const experiment = await tx.growthExperiment.upsert({
        where: { experimentId },
        update: {},
        create: {
          experimentId,
          name: "Zaragoza · mensaje y botón de contacto",
          hypothesis:
            "Una llamada a la acción más directa aumenta los SQL familiares de acompañamiento.",
          startDate: start,
          endDate: end,
          status: "running",
          primaryMetric: "sql_per_municipality_week",
          methodology:
            "Piloto sintético por municipio. Control comparable por provincia y volumen previo de SQL. Comparación descriptiva.",
        },
      });
      if (!(await tx.experimentAssignment.count({ where: { experimentId } })))
        await tx.experimentAssignment.createMany({
          skipDuplicates: true,
          data: [
            {
              experimentId,
              municipioId: "50297",
              variant: "treatment",
              assignedAt: experiment.startDate,
            },
            {
              experimentId,
              municipioId: candidate.municipio_id,
              variant: "control",
              assignedAt: experiment.startDate,
            },
          ],
        });
      await tx.auditLog.createMany({
        skipDuplicates: true,
        data: [
          {
            auditId: "pilot-zaragoza-protocol",
            action: "experiment.protocol_registered",
            actorRole: "growth_manager",
            entityType: "experiment",
            entityId: experimentId,
            metadata: { service: "acompanamiento" },
            createdAt: proposal.createdAt,
          },
        ],
      });
      const change = {
        element: "Titular y botón principal",
        before: {
          title: "Más compañía. Más autonomía. Más tranquilidad.",
          cta: "Solicitar información",
        },
        after: {
          title: "Encuentra acompañamiento a domicilio en Zaragoza",
          cta: "Consultar disponibilidad",
        },
        event: "Envío del formulario de contacto",
        experimentId,
      };
      await tx.$executeRaw`UPDATE audit_log SET metadata = metadata || ${JSON.stringify({ change })}::jsonb
        WHERE audit_id=${proposal.auditId} AND NOT (metadata ? 'change')`;
    }
  }

  // Completed municipal experiment, with the hypothesis and copy registered before exposure.
  const id = "exp-landing-value-proposition";
  const example = await tx.$queryRaw<
    Array<{ url: string; nombre: string; start_date: Date }>
  >`
    SELECT l.url,m.nombre,e.start_date FROM experiment_assignment a JOIN growth_experiment e USING(experiment_id)
    JOIN motor_municipio m USING(municipio_id) JOIN landing l USING(municipio_id)
    WHERE e.experiment_id=${id} AND a.variant='treatment' AND m.datos_propios AND m.tiene_cobertura
      AND m.cuidadoras_disponibles_30d>=8 AND l.fecha_publicacion<e.start_date AND l.idioma='es'
    ORDER BY m.municipio_id,l.url LIMIT 1`;
  const market = example[0];
  if (!market) return;
  await tx.auditLog.createMany({
    skipDuplicates: true,
    data: [
      {
        auditId: "audit-local-value-change",
        entityType: "landing",
        entityId: market.url,
        action: "landing.decision_recorded",
        actorRole: "growth_manager",
        createdAt: new Date(market.start_date.getTime() - 86400000),
        metadata: {
          author: "Equipo Growth · demo",
          decision: "iterate",
          hypothesis:
            "Una propuesta local más específica aumentará los formularios por sesión sin desplazar llamadas.",
          primaryMetric: "session_to_lead",
          guardrailMetric: "lead_to_sql",
          change: {
            element: "Titular y botón principal",
            before: { title: "Cuidados a domicilio", cta: "Más información" },
            after: {
              title: `Un equipo de tu zona para cuidar en ${market.nombre}`,
              cta: "Consultar disponibilidad",
            },
            event: "Envío del formulario de contacto",
            experimentId: id,
          },
        },
      },
    ],
  });
}

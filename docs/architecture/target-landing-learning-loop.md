# Arquitectura objetivo: ciclo de aprendizaje de landings locales

Estado: borrador para revisión de Marketing, MarTech, Operaciones y Data
Fecha: 15 de noviembre de 2026

## 1. Alcance

La propuesta no sustituye el motor de datos ni la fábrica de landings. Añade una capa de decisión y aprendizaje que:

1. selecciona municipios elegibles;
2. conserva los hechos usados para generar cada landing;
3. valida y somete la versión a aprobación humana;
4. publica de forma idempotente;
5. enlaza exposición, comportamiento y resultado CRM;
6. compara tratamiento y control;
7. registra una decisión humana y la siguiente hipótesis.

## 2. Qué existe, qué demuestra la app y qué falta

| Pieza | Estado | Significado |
| --- | --- | --- |
| Motor de datos en Databricks | Existe | Jobs y tablas descritos en el caso; no forman parte del código local. |
| Fábrica de landings | Existe | Genera borradores con plantilla fija y datos del motor; todavía no publica en qida.es. |
| Dataset sintético, API y UI local | Demo construida | Permite probar contratos, métricas, reglas, auditoría y experiencia sin datos personales. |
| Validación y aprobación local | Demo construida | Simula estados y aprobación; no equivale a identidad corporativa ni revisión real de Marketing. |
| Strapi y qida.es | Propuesto | La demo no realiza llamadas remotas ni publica contenido real. |
| GA4, GSC, HubSpot, Odoo y Aircall | Propuesto | La demo reproduce sus conceptos con datos sintéticos; faltan conectores y contratos de producción. |
| Asignación experimental y weekly | Parcial | Hay tablas y lectura descriptiva; falta el protocolo aprobado, potencia y workflow operativo. |
| Asistencia IA para la weekly | Propuesto | Solo se incorporará después de tener evidencia enlazable y aprobación humana. |

## 3. Flujo objetivo

```text
[1. Fuentes propias y públicas]
              |
              v
[2. Databricks: tablas gobernadas + controles de calidad]
              |
              v
[3. Snapshot inmutable por municipio, servicio, idioma y fecha]
              |
              v
[4. Fábrica: plantilla + LLM + cifras/testimonios insertados por sistema]
              |
              v
[5. Manifiesto de hechos + validación automática]
              |
              v
[6. Revisión y aprobación de Marketing]
              |
              v
[7. Strapi -> qida.es -> recibo de publicación]
              |
              v
[8. GA4/GSC/analítica de comportamiento + HubSpot/Odoo/Aircall]
              |
              v
[9. Databricks: cohortes, calidad, asignación y lectura experimental]
              |
              v
[10. Weekly: continuar, modificar o detener]
              |
              +---------------------> nueva versión / hipótesis
```

## 4. Contratos entre etapas

Las nueve tablas originales se conservan. Los siguientes artefactos son tablas o eventos de extensión.

| Contrato | Clave idempotente | Productor | Consumidor | Contenido mínimo |
| --- | --- | --- | --- | --- |
| `landing_generation_snapshot` | `snapshot_id` | Data | Fábrica | municipio, servicio, idioma, fecha de corte, referencias a hechos, versión del codebook |
| `landing_version` | `landing_id + version` | Fábrica | Validador | bloques, texto, template, prompt/modelo, snapshot usado |
| `landing_fact_manifest` | `landing_version_id + fact_id` | Fábrica | Validador/Marketing | cifra o afirmación, tabla, clave, fecha y transformación |
| `validation_run` | `landing_version_id + policy_version` | Validador | Marketing | controles, evidencia, severidad, resultado y fecha |
| `publication_command` | `landing_version_id + target` | MarTech | Strapi | versión aprobada, canonical, hreflang, schema y aprobador |
| `publication_receipt` | `command_id` | Strapi/MarTech | Data | URL, CMS id, versión, fecha, estado e indexabilidad |
| `analytics_event` | `source + event_id` | Web/CRM/telefonía | Data | URL/landing id, municipio, servicio, sesión seudónima, evento y fecha |
| `experiment_assignment` | `experiment_id + municipio_id` | Data | Analítica/weekly | variante, fecha, semilla y versión del algoritmo |
| `landing_decision` | `decision_id` | Growth | Data/fábrica | versión, evidencia, decisión, autor, fecha y siguiente hipótesis |

## 5. Responsabilidad por etapa

| Etapa | Responsable | Accountable | Consultados | Salida aprobada por |
| --- | --- | --- | --- | --- |
| Calidad y snapshot | Data | Data Lead | Operaciones, Marketing | Data |
| Selección elegible | Growth Product | Growth Lead | Data, Operaciones | Operaciones para capacidad |
| Generación | MarTech | Marketing | Data | Marketing |
| Política automática | MarTech | Marketing | Legal/Privacidad, Data | Marketing |
| Publicación Strapi | MarTech | Marketing | Web/SEO | Dirección de Marketing |
| Instrumentación | MarTech | Data | Growth | Data |
| Asignación y análisis | Data | Data Lead | Growth | Data antes de congelar |
| Weekly y decisión | Growth Product | Growth Lead | Marketing, Data, Operaciones | responsables presentes en la weekly |

`Responsible` ejecuta el trabajo. `Accountable` responde por el resultado. La aprobación editorial y SEO nunca se delega al modelo.

## 6. Fallos, reintentos e idempotencia

### Databricks y snapshots

- Cada job registra `run_id`, fecha de corte, filas leídas/escritas y versión del esquema.
- Un snapshot publicado no se modifica; una corrección crea otro `snapshot_id`.
- Si falla frescura, integridad, cobertura o privacidad, el snapshot queda `blocked` y la fábrica no lo consume.
- Reintentar el mismo `run_id` no duplica snapshots ni eventos.

### Generación y validación

- Una misma combinación de snapshot, plantilla, idioma y configuración produce una nueva versión explícita, nunca sobrescribe la anterior.
- Timeouts del LLM se reintentan con límite y backoff. Un cambio de modelo o prompt queda registrado.
- Cifras, precios, URL, testimonios y hechos sanitarios no se aceptan desde texto libre del modelo.
- Un fallo crítico bloquea la versión; un warning requiere resolución o aceptación documentada.

### Publicación

- `publication_command` lleva una clave idempotente. Repetir el comando devuelve el mismo recibo.
- Un timeout exige consultar primero el estado en Strapi antes de reintentar.
- La publicación solo acepta una versión inmutable con validación correcta y aprobación vigente.
- El rollback restaura la versión previa en Strapi y registra un nuevo evento; no borra el historial.

### Medición

- Eventos web y CRM se deduplican por identificador de origen.
- Eventos tardíos se conservan con fecha de ocurrencia y fecha de ingesta.
- Identidades ambiguas permanecen separadas y no entran en la métrica de decisión.
- Una pérdida de trazabilidad no se imputa: aparece como guardarraíl y puede volver inconclusa la lectura.

## 7. Auditoría mínima

Cada transición registra:

- actor o sistema;
- rol verificado;
- fecha y zona horaria;
- objeto, versión anterior y nueva;
- motivo;
- versión de reglas;
- referencias a evidencia;
- identificador de correlación entre Databricks, fábrica, Strapi y analítica.

Los logs técnicos no contienen transcripciones, testimonios completos, teléfonos, correos ni nombres de familias o cuidadoras.

## 8. Controles antes y después de publicar

### Antes

- datos municipales propios y frescos;
- cobertura y capacidad;
- manifestación de cada cifra;
- privacidad, consentimiento y anonimización;
- precios y afirmaciones sanitarias;
- valor local y similitud entre landings;
- canonical, hreflang, schema y enlaces;
- revisión de Marketing;
- plan de medición y asignación congelados.

### Después

- publicación e indexabilidad;
- eventos esperados y reconciliación CRM;
- capacidad operativa;
- contaminación de tratamiento/control;
- cambios de campañas nacionales;
- trazabilidad e identidades ambiguas;
- cohortes maduras;
- decisión humana con evidencia.

## 9. Herramientas propuestas

| Necesidad | Herramienta principal | Alternativa o apoyo |
| --- | --- | --- |
| Datos, jobs y marts | Databricks | Sigma o Metabase para exploración |
| Fábrica y evaluación semántica | API de OpenAI o Bedrock, dentro de política | Claude Team para revisión interna |
| CMS | Strapi | GitHub para versionar contratos y código |
| Web e instrumentación | qida.es + Google Analytics | Hotjar; PostHog solo si Qida decide incorporarlo |
| SEO | Google Search Console | Semrush |
| CRM y operaciones | HubSpot + Odoo | Aircall para eventos de llamada |
| Ejecución | AWS + GitHub | Jira y Slack para coordinación |

## 10. Decisiones pendientes

1. Qué sistema será dueño de `landing_id` y `landing_version_id`.
2. Si Strapi admite publicación idempotente y rollback por versión.
3. Qué identificador se puede compartir entre web, HubSpot, Odoo y Aircall sin PII.
4. SLA real de capacidad y quién puede bloquear una publicación.
5. Retención y permisos de snapshots, manifiestos y evidencia de validación.
6. Si PostHog aporta valor adicional o GA4 + Hotjar cubren la medición necesaria.
7. Quién firma la decisión final de ampliar una prueba.

# Especificación de producto, datos y UI de Qida Growth Intelligence

## Para qué existe el producto

Qida Growth Intelligence ayuda al equipo de Growth a responder cuatro preguntas:

1. **¿Qué está ocurriendo?** Entender demanda, embudo, adquisición y calidad del dato.
2. **¿Dónde merece la pena investigar?** Ordenar combinaciones municipio-servicio mediante reglas explícitas.
3. **¿Qué ocurrió con una oportunidad concreta?** Reconstruir su recorrido sin ocultar identidades ambiguas.
4. **¿Qué deberíamos validar después?** Convertir la evidencia en una landing, campaña o experimento acotado y con criterio de parada.

Todo valor mostrado pertenece a una de estas cuatro clases. La UI debe indicar la clase y no sugerir certeza mediante el aspecto visual.

| Clase de evidencia | Qué significa | Lenguaje permitido | Lo que no significa |
| --- | --- | --- | --- |
| Observado | Recuento, importe o tasa calculados desde registros persistidos | observado, registrado, conciliado | impacto causal |
| Atribución | Una regla relaciona un resultado con uno o varios contactos | primer contacto, último contacto, vinculado a campaña | causado por el canal |
| Regla | Una regla de negocio versionada ordena o restringe opciones | score, elegible, restringido | probabilidad o confianza |
| Escenario | Aritmética producida con supuestos editables | escenario, supuesto, referencia de planificación | pronóstico, predicción o impacto incremental |

El conjunto de datos es sintético y determinista. Se comporta como un producto de datos real, pero sus valores no son resultados reales de Qida.

## Lenguaje de producto

| Término | Definición humana | Unidad de conteo |
| --- | --- | --- |
| Lead | Contacto de adquisición de una familia. Los contactos de empleo para cuidadoras se excluyen del embudo familiar. | `lead_id` |
| SQL | Lead que cumple la marca SQL persistida y tiene una fecha SQL válida. | lead u oportunidad enlazada |
| Alta | Lead que se convierte en una oportunidad activa de servicio de cuidados familiares. | lead u oportunidad enlazada |
| Oportunidad | Caso de una familia relacionado con una persona, un municipio y un servicio. | `opportunity_id` |
| Recorrido | Eventos observados o inferidos, ordenados y asociados a una oportunidad. | oportunidad y evento |
| Enlace de identidad | Identificador de un sistema de origen relacionado de forma determinista con una persona seudónima. | sistema e identificador de origen |
| Landing | Página local de adquisición y su estado de trabajo. | URL |
| Oportunidad de crecimiento | Combinación municipio-servicio ordenada para ser validada. | municipio y servicio |
| Experimento | Hipótesis declarada con municipios asignados y una serie de resultados observados. | `experiment_id` |

## Modelo de datos

Las primeras nueve tablas conservan el modelo fuente entregado. Las extensiones añaden identidad, recorridos, experimentos, recomendaciones, flujo editorial y auditoría sin cambiar la semántica original.

### Tablas fuente

| Tabla | Grano y clave | Qué representa | Campos importantes | Para qué se usa |
| --- | --- | --- | --- | --- |
| `motor_municipio` | Un municipio; `municipio_id` | Perfil operativo del mercado | cobertura, servicios cubiertos, cuidadoras disponibles a 30 días, familias activas, NPS | elegibilidad, capacidad y filtros |
| `motor_demanda_busqueda` | Municipio, tema y mes | Señal de demanda en buscadores | búsquedas, competencia publicitaria, CPC estimado | ranking de oportunidades y escenarios |
| `motor_voz_cliente` | Municipio, mes, tema y tipo de llamada | Señal agregada de voz del cliente | llamadas, llamadas totales, porcentaje de aceptación, expresiones | explicación del score |
| `motor_competencia` | Municipio y competidor | Presencia competitiva local | servicios, landing local, fecha de revisión | clasificación de esfuerzo |
| `landing` | Una URL | Inventario de páginas locales | municipio, idioma, origen, publicación e indexación | fábrica de landings y SEO |
| `gsc_diario` | Fecha, URL y consulta | Agregado de Google Search Console | impresiones, clics, posición media | SEO |
| `web_sesiones_diarias` | Fecha, URL de entrada, canal y dispositivo | Agregado de tráfico web | sesiones, formularios, clics de llamada | rendimiento de landings y experimentos |
| `ads_diario` | Fecha, plataforma y campaña | Agregado de plataforma publicitaria | inversión, impresiones, clics, conversiones de plataforma, municipio opcional | medios de pago |
| `lead` | Un lead de origen; `lead_id` | Contacto y resultado CRM | creación, canal, URL, tipo, SQL, alta, servicio, descarte | embudo, resultados CRM y conciliación |

### Tablas de extensión

| Tabla | Grano y clave | Qué representa | Campos importantes | Para qué se usa |
| --- | --- | --- | --- | --- |
| `identity_map` | Una identidad de origen; `identity_id` | Resolución determinista y seudonimizada | persona, sistema, identificador, método, ambigüedad | estado de identidad y duplicados |
| `care_opportunity` | Una oportunidad familiar | Caso comercial canónico | persona, municipio, servicio, estado, lead, fechas SQL y alta | recorridos y resultados conciliados |
| `journey_event` | Un evento; `event_id` | Interacción observada o inferida | oportunidad, persona, sesión, tipo, fuente, fecha, canal, campaña, landing | cronología y atribución |
| `growth_experiment` | Un experimento | Declaración del experimento | hipótesis, fechas, estado, métrica principal, metodología | registro de experimentos |
| `experiment_assignment` | Experimento y municipio | Asignación a tratamiento o control | variante y fecha de asignación | análisis experimental |
| `growth_recommendation` | Una recomendación | Resultado persistido de una regla versionada | score, impacto esperado, explicación, estado, versión | gobierno y futuro flujo de trabajo |
| `landing_workflow` | Una URL | Estado borrador-revisión-aprobación-publicación | servicio, bloques, contenido, validaciones, fechas, aprobador | fábrica de landings |
| `audit_log` | Un evento de auditoría | Quién cambió qué entidad local | acción, entidad, rol, request ID, metadatos, fecha | trazabilidad de mutaciones |
| `synthetic_scenario` | Un escenario de seed | Caso de negocio que el dataset debe reproducir | tipo de sujeto, ID y metadatos | validación determinista |
| `seed_run` | Una ejecución del generador | Reproducibilidad del dataset | semilla, fecha de simulación, versión y checksum | procedencia del dato |

El seed por defecto usa la semilla `42026`, cubre enero de 2025 a noviembre de 2026 y genera exactamente 2.000 SQL familiares al mes. Esa cifra es una condición de la simulación, no un resultado real de Qida.

## Catálogo de consultas y API

Las rutas públicas viven bajo `/api/v1`. Zod valida filtros y entradas. Las fechas usan ISO 8601, el dinero está en euros y las tasas son decimales entre 0 y 1.

### Filtros compartidos

| Filtro | Significado | Dónde se aplica |
| --- | --- | --- |
| `from`, `to` | Periodo inclusivo según la fecha documentada por cada consulta | analítica y listados compatibles |
| `province` | Provincia del municipio | analítica basada en leads o municipios |
| `municipalityId` | Municipio exacto | oportunidades, recorridos, landings, experimentos y analítica |
| `service` | Servicio familiar exacto | leads, oportunidades y landings |
| `channel` | Canal de adquisición o web | donde puede conciliarse sin inventar asignaciones |
| `language` | Idioma de landing, `es` o `ca` | landings |
| `page`, `pageSize` | Paginación desde 1; máximo 100 filas | listados |
| `search` | Búsqueda de texto acotada a los campos de cada ruta | oportunidades, recorridos, landings y experimentos |

No todos los endpoints admiten todos los filtros. La interfaz debe mostrar únicamente los filtros efectivos de cada vista o indicar cuáles fueron aplicados.

### Consultas de lectura

| ID | Endpoint | Pregunta humana | Fuentes principales | Resultado y límites |
| --- | --- | --- | --- | --- |
| `QRY-FILTERS` | `GET /filters` | ¿Qué filtros son válidos? | municipio y lead | rango, provincias, municipios, servicios, canales e idiomas |
| `QRY-OVERVIEW` | `GET /overview` | ¿Qué está ocurriendo en el ámbito seleccionado? | lead, recorridos, demanda y municipio | recuentos, cohortes mensuales, altas por municipio y oportunidades; excluye empleo de cuidadoras |
| `QRY-OPPORTUNITIES` | `GET /opportunities` | ¿Qué combinaciones deben revisarse primero? | demanda, municipio, lead, voz y competencia | score de reglas y elegibilidad; no es predicción |
| `QRY-OPPORTUNITY` | `GET /opportunities/:municipalityId/:service` | ¿Por qué ocupa esta posición? | mismas fuentes del ranking | contribuciones, restricciones, validación propuesta y versión de reglas |
| `QRY-JOURNEYS` | `GET /journeys` | ¿Qué oportunidad quiero inspeccionar? | oportunidad, municipio, eventos e identidad | índice buscable con estado de identidad |
| `QRY-JOURNEY` | `GET /journeys/:opportunityId` | ¿Qué ocurrió con esta oportunidad? | oportunidad, eventos, identidad y lead | cronología y atribución descriptiva |
| `QRY-FUNNELS` | `GET /funnels` | ¿Cómo avanzan los leads por cohorte y dimensión? | lead y municipio | recuentos, tasas y tiempos; marca cohortes inmaduras |
| `QRY-LANDINGS` | `GET /landings` | ¿Qué páginas existen y qué actividad se relaciona con ellas? | landing, workflow, web, GSC y lead | inventario y sesiones, formularios, SQL y altas relacionados por URL |
| `QRY-SEO` | `GET /seo` | ¿Qué visibilidad orgánica tienen las landings? | landing, GSC, web y lead | rendimiento por origen y estado; comparación descriptiva |
| `QRY-ADS` | `GET /ads` | ¿Qué reportó la plataforma y qué llegó al CRM? | ads, eventos, oportunidad y lead | inversión y conversiones de plataforma separadas de SQL y altas CRM |
| `QRY-EXPERIMENTS` | `GET /experiments` | ¿Qué experimentos existen y qué se observó? | experimento, asignación, landing y web | registro, tamaños de grupos y diferencias descriptivas |
| `QRY-EXPERIMENT` | `GET /experiments/:id` | ¿Cómo evolucionaron tratamiento y control? | experimento, asignación, landing y web | tasa mensual, muestra, diferencia observada y DiD descriptivo |
| `QRY-DATA-QUALITY` | `GET /data-quality` | ¿Es interpretable el dato? | lead, ads, GSC, web, eventos e identidad | frescura, enlaces, integridad, incompletitud y conciliación; sin filtros actuales |
| `QRY-STRATEGY` | `GET /strategy` | ¿Qué implican unos supuestos editables? | ranking y SQL recientes | aritmética de escenario y apuestas; no es forecast |
| `QRY-WORKBENCH` | `GET /workbench` | ¿Qué SQL sustenta preguntas seleccionadas? | SQL curado en servidor | tres consultas de solo lectura; el cliente no envía SQL libre |
| `QRY-GOVERNANCE` | `GET /governance` | ¿Qué está implementado, simulado o propuesto? | definición estática | documentación, no estado medido |
| `QRY-HEALTH` | `GET /health` | ¿Están disponibles API y base de datos? | base de datos y seed | estado y versión del seed |

### Comandos de landing

| ID | Endpoint | Transición | Condición | Evidencia persistida |
| --- | --- | --- | --- | --- |
| `CMD-LANDING-DRAFT` | `POST /landings/drafts` | crear borrador local | municipio, servicio, idioma y bloques permitidos | landing, workflow y auditoría |
| `CMD-LANDING-REVIEW` | `POST /landings/:url/review` | borrador o rechazada a revisión | validación de cobertura y contenido | incidencias y audit ID |
| `CMD-LANDING-APPROVE` | `POST /landings/:url/approve` | revisión a aprobada | rol local y aprobador identificado | aprobador, fecha y audit ID |
| `CMD-LANDING-PUBLISH` | `POST /landings/:url/publish` | aprobada a publicada | aprobación humana previa | publicación simulada y audit ID |

## Diccionario de métricas

### Embudo y CRM

| ID | Nombre humano | Definición exacta | Ventana, exclusiones e interpretación |
| --- | --- | --- | --- |
| `MET-LEADS` | Leads familiares | número de registros `lead` creados en el ámbito | excluye `cuidadora_empleo`; volumen observado |
| `MET-SQL` | SQL observados | leads del ámbito con `es_sql = true` | resultado CRM, no conversión de plataforma |
| `MET-ALTAS` | Altas observadas | leads del ámbito con `es_alta = true` | puede ocurrir después del periodo de captación |
| `MET-LEAD-SQL` | Conversión lead a SQL | SQL observados / leads familiares | debe mostrar numerador y denominador |
| `MET-SQL-ALTA-MATURE` | Conversión SQL a alta madura | altas de leads creados hace 90 días o más / SQL del mismo conjunto maduro | definición actual del Resumen |
| `MET-SQL-ALTA-RAW` | Conversión SQL a alta bruta | altas / SQL del grupo | no es equivalente a la tasa madura |
| `MET-DAYS-SQL` | Días hasta SQL | media de `fecha_sql - fecha_creacion` para transiciones completadas | solo transiciones observadas |
| `MET-DAYS-ALTA` | Días hasta alta | media de `fecha_alta - fecha_creacion` para altas completadas | los casos abiertos no contribuyen |

### Demanda, oportunidad y capacidad

| ID | Nombre humano | Definición exacta | Ventana, exclusiones e interpretación |
| --- | --- | --- | --- |
| `MET-SEARCHES` | Búsquedas mensuales medias | media mensual de `busquedas` por municipio y tema | señal de demanda, no personas ni leads |
| `MET-CAREGIVERS` | Cuidadoras disponibles | `cuidadoras_disponibles_30d` del municipio | señal de capacidad operativa |
| `MET-ELIGIBILITY` | Elegibilidad de activación | sin cobertura = no elegible; cobertura y menos de 8 cuidadoras = restringida; resto = elegible | regla dura de negocio |
| `MET-OPPORTUNITY-SCORE` | Índice de prioridad municipio-servicio | sin cobertura = 0; en otro caso: demanda hasta 35 + gap demanda-SQL hasta 25 + capacidad hasta 20 + voz hasta 10 + oportunidad de conversión hasta 10 − 20 si hay menos de 8 cuidadoras; resultado entre 0 y 100 | regla versionada; nunca probabilidad ni confianza |
| `MET-SCENARIO-SQL` | SQL del escenario | búsquedas × captura × meses × conversión lead-SQL × utilización de capacidad en apuestas elegibles | aritmética de planificación |
| `MET-SCENARIO-ALTAS` | Altas del escenario | SQL del escenario × conversión SQL-alta asumida | hereda todos los supuestos |

### Recorrido e identidad

| ID | Nombre humano | Definición exacta | Ventana, exclusiones e interpretación |
| --- | --- | --- | --- |
| `MET-LEADS-WITH-JOURNEY` | Solicitudes con recorrido registrado | leads distintos con oportunidad y al menos un evento / leads familiares | trazabilidad del Resumen |
| `MET-LINKED-EVENTS` | Eventos enlazados a persona u oportunidad | eventos con persona u oportunidad / eventos totales | trazabilidad de Calidad; denominador distinto |
| `MET-AMBIGUOUS-IDENTITIES` | Identidades ambiguas | filas de `identity_map` con `ambiguous = true` | permanecen separadas |
| `MET-EXTRA-IDENTITY-LINKS` | Identificadores adicionales vinculados | filas del mapa − personas distintas | cálculo actual; no llamarlo “enlaces confirmados” |
| `MET-FIRST-TOUCH` | Primer contacto observado | primer canal elegible del recorrido | atribución descriptiva |
| `MET-LAST-TOUCH` | Último contacto observado | último canal elegible del recorrido | atribución descriptiva |
| `MET-MULTI-TOUCH` | Contactos por canal | número de eventos elegibles por canal | sin pesos de mérito ni causalidad |

### SEO, web y medios de pago

| ID | Nombre humano | Definición exacta | Ventana, exclusiones e interpretación |
| --- | --- | --- | --- |
| `MET-GSC-IMPRESSIONS` | Impresiones orgánicas | suma de impresiones GSC | una landing no indexada no puede producir clics orgánicos |
| `MET-GSC-CLICKS` | Clics orgánicos | suma de clics GSC | agregado de Search Console |
| `MET-GSC-CTR` | CTR orgánico | clics totales / impresiones totales | no promediar CTR de filas |
| `MET-GSC-POSITION` | Posición orgánica media | media ponderada por impresiones | menor es mejor |
| `MET-WEB-FORM-RATE` | Conversión a formulario | formularios / sesiones | las sesiones no son personas |
| `MET-AD-SPEND` | Inversión pagada | suma de `coste_eur` | no repartir por municipio campañas no segmentadas |
| `MET-AD-CPC` | Coste por clic | inversión total / clics totales | calcular desde totales combinados |
| `MET-PLATFORM-CONVERSIONS` | Conversiones de plataforma | suma reportada por Google o Meta | sistema de medición distinto al CRM |
| `MET-CRM-SQL-PAID` | SQL CRM enlazados a campaña | leads distintos con SQL y evento de campaña | atribución, no incrementalidad |
| `MET-CRM-ALTAS-PAID` | Altas CRM enlazadas a campaña | leads distintos con alta y evento de campaña | atribución, no incrementalidad |
| `MET-COST-SQL` | Gasto Ads por SQL CRM enlazado | inversión / SQL CRM conciliados | nulo sin denominador o con filtros no conciliables |
| `MET-COST-ALTA` | Gasto Ads por alta CRM enlazada | inversión / altas CRM conciliadas | ratio de atribución, no coste incremental |

### Experimentos y calidad

| ID | Nombre humano | Definición exacta | Ventana, exclusiones e interpretación |
| --- | --- | --- | --- |
| `MET-EXP-OBS-DIFF` | Diferencia descriptiva tratamiento-control | tasa de tratamiento post − tasa de control post | comparación descriptiva |
| `MET-EXP-DID` | Diferencia en diferencias observada | `(tratamiento post − pre) − (control post − pre)` | sin test de significación ni tendencias paralelas validadas |
| `MET-EXP-SAMPLE` | Muestra observada | sesiones de cada variante y periodo | debe acompañar las tasas |
| `MET-FRESHNESS` | Frescura de fuente | días desde el último timestamp persistido | el estado debe usar la fecha de simulación o un SLA, no solo el reloj real |
| `MET-MISSINGNESS` | Tasa de incompletitud | registros vacíos / registros inspeccionados por campo | cada campo necesita objetivo y severidad propios |
| `MET-INTEGRITY-FAILURES` | Fallos de integridad | SQL anterior al lead, alta anterior al SQL, alta sin oportunidad y clic GSC sin indexación | el objetivo es cero |

## Biblioteca de componentes de UI

La referencia visual propone un dashboard financiero sereno: sidebar contenida, superficies blancas, bordes neutros finos, un resumen dominante, una gráfica compacta y una tabla densa. No se crea un componente nuevo cuando uno configurable puede expresar el mismo comportamiento.

| Componente | Responsabilidad | Variantes y reglas |
| --- | --- | --- |
| `AppShell` | sidebar, navegación móvil, cabecera y ancho de contenido | una marca; navegación agrupada; sin títulos ni logos duplicados |
| `PageHeader` | título y acciones principales | contexto opcional; sin subtítulo decorativo por defecto |
| `FilterDrawer` | filtros globales bajo demanda | cerrado por defecto; contador de activos; limpiar y aplicar |
| `SummaryPanel` | KPI dominante con desglose | acción, clase de evidencia y distribución opcionales |
| `MetricItem` | métrica pequeña dentro de un resumen o grid compacto | etiqueta, valor, numerador/denominador y estado; nunca tendencia inventada |
| `ChartPanel` | cabecera, contexto, controles, gráfica y vacío | renderer de línea, barras o cohortes según la semántica |
| `DataTable` | presentación tabular compartida | columnas, alineación, estados, paginación, vacío y filtros opcionales |
| `StatusPill` | estado de workflow, elegibilidad, calidad o evidencia | vocabulario semántico; el color nunca es la única señal |
| `EvidenceLabel` | observado, atribución, regla o escenario | etiqueta local; sustituye avisos repetitivos |
| `DetailList` | hechos clave o explicación de factores | contribución, fuente y evidencia desplegable opcionales |
| `Timeline` | eventos ordenados del recorrido | variantes observada e inferida, fuente y estado de identidad |
| `DecisionPanel` | hipótesis, MVP, owner y criterios continuar/modificar/parar | oportunidades y apuestas estratégicas |
| `EmptyState` | ausencia de datos o resultado | una sola implementación y acción opcional |
| `LoadingState` | skeleton de la forma de destino | presets de resumen, gráfica y tabla |
| `ErrorState` | fallo recuperable de API | mensaje, request ID si existe y reintento |

## Cómo se muestra cada concepto

Los nombres siguientes son referencias estables de producto, no nombres internos de React.

### Vistas principales

| ID UI | Nombre humano | Pregunta | Consulta y métricas | Composición |
| --- | --- | --- | --- | --- |
| `RES-SUM-01` | Resumen de rendimiento | ¿Qué ocurrió en el ámbito seleccionado? | `QRY-OVERVIEW`; leads, SQL, altas y conversión madura | `SummaryPanel` y `MetricItem` |
| `RES-GRF-01` | Evolución mensual de cohortes | ¿Cambian los volúmenes y resultados? | `QRY-OVERVIEW`; leads, SQL y altas mensuales | `ChartPanel` con tratamiento de madurez |
| `RES-TBL-01` | Oportunidades a revisar | ¿Dónde investigar después? | `QRY-OVERVIEW`; preview de oportunidades | `DataTable` con etiqueta de regla |
| `OPP-TBL-01` | Ranking de oportunidades | ¿Qué combinaciones vienen primero y por qué? | `QRY-OPPORTUNITIES` | `DataTable` |
| `OPD-SUM-01` | Evidencia de oportunidad | ¿Qué evidencia y restricciones explican la posición? | `QRY-OPPORTUNITY` | `SummaryPanel` y `DetailList` |
| `OPD-DEC-01` | Decisión de validación | ¿Qué se prueba y cuándo se detiene? | `QRY-OPPORTUNITY` | `DecisionPanel` |
| `JRN-TBL-01` | Índice de recorridos | ¿Qué oportunidad quiero inspeccionar? | `QRY-JOURNEYS` | `DataTable` |
| `JRD-TML-01` | Cronología de oportunidad | ¿Qué ocurrió, cuándo y desde qué fuente? | `QRY-JOURNEY` | `Timeline` |
| `JRD-ATT-01` | Hechos de atribución | ¿Qué canales aparecen primero, último y repetidos? | `QRY-JOURNEY` | `DetailList` con etiqueta de atribución |
| `LND-TBL-01` | Inventario de landings | ¿Qué páginas existen, en qué estado y con qué actividad? | `QRY-LANDINGS` | `DataTable` con acciones de workflow |
| `LND-FRM-01` | Constructor de borrador | ¿Qué borrador local seguro se crea? | `CMD-LANDING-DRAFT` | formulario compartido en modal o panel lateral |
| `STR-SIM-01` | Planificador de escenario | ¿Qué implican los supuestos elegidos? | `QRY-STRATEGY` | `SummaryPanel` e inputs acotados |
| `STR-TBL-01` | Apuestas priorizadas | ¿Qué apuestas elegibles encajan? | `QRY-STRATEGY` | `DataTable` y `DecisionPanel` |

### Vistas de análisis

| ID UI | Nombre humano | Pregunta | Consulta y métricas | Composición |
| --- | --- | --- | --- | --- |
| `FUN-SUM-01` | Salud del embudo | ¿Cómo avanzan las cohortes maduras? | `QRY-FUNNELS` | `SummaryPanel` |
| `FUN-TBL-01` | Cohortes del embudo | ¿Qué cohortes son comparables? | `QRY-FUNNELS` | `DataTable`; madurez como columna y estado visual |
| `SEO-SUM-01` | Resumen orgánico | ¿Cuánta visibilidad y tráfico indexado existe? | `QRY-SEO` | `SummaryPanel` |
| `SEO-TBL-01` | Rendimiento orgánico | ¿Cómo varía por origen y estado? | `QRY-SEO` | `DataTable` descriptiva |
| `PAD-SUM-01` | Resumen de pago | ¿Cuánto se invirtió y qué tráfico se registró? | `QRY-ADS` | `SummaryPanel` |
| `PAD-TBL-01` | Conciliación plataforma-CRM | ¿Qué reportó la plataforma y qué llegó al CRM? | `QRY-ADS` | `DataTable` con grupos de columnas separados |
| `EXP-TBL-01` | Registro de experimentos | ¿Qué hipótesis tienen datos? | `QRY-EXPERIMENTS` | `DataTable` |
| `EXD-GRF-01` | Serie de resultado experimental | ¿Cómo evolucionan tasa y muestra por grupo? | `QRY-EXPERIMENT` | `ChartPanel`; ausencias como huecos, nunca cero |
| `EXD-DIA-01` | Diagnósticos del experimento | ¿Qué supuestos pueden evaluarse? | `QRY-EXPERIMENT` | `DetailList` o checklist |
| `DQ-SUM-01` | Fiabilidad del dato | ¿Es interpretable el producto? | `QRY-DATA-QUALITY` | `SummaryPanel` |
| `DQ-TBL-01` | Controles de integridad | ¿Qué invariante falla? | `QRY-DATA-QUALITY` | `DataTable` |
| `DQ-TBL-02` | Controles de completitud | ¿Qué campos faltan y cuál es su objetivo? | `QRY-DATA-QUALITY` | `DataTable`, no barras decorativas |

### Vistas técnicas y de documentación

| ID UI | Nombre | Propósito | Ubicación |
| --- | --- | --- | --- |
| `WB-QRY-01` | SQL de priorización municipal | inspección de consulta y resultado | área técnica, fuera de navegación principal |
| `WB-QRY-02` | SQL de resultados de landings | inspección de resultados enlazados | área técnica, fuera de navegación principal |
| `WB-QRY-03` | SQL de calidad y pérdidas | inspección de señales de calidad | área técnica, fuera de navegación principal |
| `ARC-FLW-01` | Arquitectura operativa | explicar sistemas implementados, simulados y propuestos | documentación, no analítica |
| `CST-NAR-01` | Narrativa del caso | explicar la demostración sintética | solo modo demo |

## Reglas de presentación no negociables

- Una métrica muestra unidad y ámbito. Una tasa expone numerador y denominador.
- Ausente, cero y no aplicable son estados diferentes.
- Un mismo nombre humano no puede referirse a denominadores distintos.
- Conversiones de plataforma y resultados CRM permanecen separados.
- Las cohortes inmaduras siguen visibles, pero no se comparan como si estuvieran completas.
- El score muestra versión y contribuciones; nunca confianza.
- Los escenarios muestran supuestos editables y nunca se llaman forecast o impacto incremental.
- Atribución y evidencia causal usan etiquetas y tratamientos distintos.
- Los filtros están bajo demanda y los filtros activos siguen visibles sin ocupar un panel permanente.
- Cada patrón repetido tiene un solo componente compartido. Las páginas aportan datos, columnas y variantes semánticas; no duplican presentación.

## Correcciones obligatorias detectadas

| Problema | Corrección |
| --- | --- |
| Resumen y Calidad llaman “Trazabilidad” a denominadores distintos | usar “Solicitudes con recorrido registrado” y “Eventos enlazados” |
| Estrategia muestra 2.000 SQL/mes como si fuera observado | etiquetarlo como referencia de planificación o mostrar el dato observado de 30 días |
| La gráfica experimental convierte un grupo-periodo ausente en cero | conservar ausencia, dibujar hueco y mostrar muestra |
| Medios de pago oculta SQL y altas CRM que la API ya devuelve | añadir grupos separados de plataforma y CRM |
| Los factores de oportunidad anteponen `+` a cualquier contribución | mostrar el signo real y explicar penalizaciones |
| La tarjeta de identidad siempre dice “Enlace determinista” | reflejar confirmado, ambiguo o sin enlazar |
| “Enlaces confirmados” usa un cálculo indirecto de filas adicionales | renombrar o cambiar la consulta para contar confirmaciones explícitas |
| Las tasas SQL-alta bruta y madura parecen equivalentes | usar nombres distintos y la tasa madura en comparaciones principales |
| El schema Web de `monitoringSignals` no coincide con la API | alinear el contrato para evitar `CONTRACT_MISMATCH` |
| Existen dos motores de score con versiones y umbrales distintos | elegir una única implementación versionada y hacer que API y persistencia la compartan |
| Paid Media filtra el gasto por fecha pero no los outcomes CRM | conciliar ambas ventanas antes de calcular costes |
| La discrepancia Ads-CRM de Calidad puede multiplicar conversiones por el join | preagregar Ads antes de unir con eventos y CRM |
| Los filtros globales se envían a rutas que los ignoran | declarar filtros por endpoint y devolver `appliedFilters` |
| Los experimentos siempre calculan formularios/sesión aunque declaren otra métrica | validar la métrica soportada o implementar el cálculo declarado |

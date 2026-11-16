# Qida Growth Intelligence

Documento de producto para la prueba técnica

## 1. Índice y propósito

Este documento presenta Qida Growth Intelligence como respuesta a una pregunta concreta: una vez que Qida dispone de un motor de datos municipal y de una fábrica de landings, ¿cómo puede convertir esos activos en más aprendizaje y mejores decisiones de crecimiento?

La respuesta no consiste en reconstruir lo que ya existe. Consiste en añadir una capa de producto que conecte cada landing con los datos que justificaron su creación, con el resultado que produjo y con la decisión tomada después. El documento está pensado para leerse en unos diez minutos y sigue seis bloques de contenido: la idea, las partes del producto, la data, la medición, la planificación y los límites de la propuesta.

| Sección | Pregunta que responde |
| --- | --- |
| Presentación de la idea | ¿Qué problema falta por resolver y dónde está el valor? |
| Partes del producto | ¿Cómo trabaja una persona con la herramienta? |
| La data | ¿De dónde sale cada dato y cómo se combinan las fuentes? |
| Métricas previstas | ¿Cómo sabremos si una apuesta funciona? |
| Planificación | ¿Qué construiríamos y validaríamos durante 90 días y seis meses? |
| Límites y controles | ¿Qué no puede afirmar ni hacer el sistema? |

## 2. Presentación de la idea

Qida parte de dos activos valiosos. El motor de datos reúne, para cada municipio, oferta, capacidad, actividad comercial, demanda de búsqueda, voz del cliente y competencia. La fábrica utiliza ese contexto para generar landings locales con una estructura preparada para SEO y contenido propio de Qida.

La pieza que falta aparece después de publicar. Hoy se puede generar una página, pero todavía es difícil responder de forma conjunta a preguntas como estas: por qué se creó, qué parte del embudo está funcionando peor, si Qida puede atender la demanda, qué cambio se realizó, qué resultado se observó y qué aprendimos para la siguiente página.

Qida Growth Intelligence cierra ese ciclo. La unidad de trabajo deja de ser una gráfica aislada o un municipio abstracto y pasa a ser una landing concreta. Para cada URL, el producto reúne contexto local, tráfico, visibilidad orgánica, leads, SQL, altas, capacidad, experimentos y decisiones. El resultado no es un sistema que decide por el equipo, sino un lugar común para investigar, medir y dejar trazabilidad.

### 2.1 La primera apuesta

La primera apuesta sería mejorar landings que ya existen antes de producir nuevas páginas en masa. Esta decisión reduce el riesgo porque parte de URLs con tráfico, histórico y conexión con CRM. Además, respeta la restricción más importante del caso: atraer demanda no aporta valor si Qida no tiene cobertura o cuidadoras suficientes para atenderla.

El flujo comienza seleccionando municipios con datos propios, servicio cubierto, demanda suficiente y capacidad operativa. Dentro de ese conjunto se buscan páginas con una diferencia clara entre demanda y resultado comercial. El equipo formula una hipótesis, publica una versión controlada y mide el resultado frente a municipios comparables.

### 2.2 Prioridad y orden de magnitud

Las cifras siguientes son hipótesis de planificación, no resultados observados. Sirven para ordenar el trabajo y hacer explícitos los supuestos que después deberán validarse con el histórico real.

| Prioridad | Apuesta | Impacto orientativo en seis meses | Por qué ocupa esa posición |
| --- | --- | --- | --- |
| 1 | Mejorar landings elegibles | Entre 80 y 540 SQL adicionales en diez mercados | Utiliza activos ya creados, puede medirse por URL y combina demanda con capacidad |
| 2 | Adaptar mensaje y cualificación con voz del cliente | Entre 20 y 100 SQL adicionales | Puede mejorar la calidad del lead, pero necesita validar temas, tono y consentimiento |
| 3 | Reasignar captación hacia mercados atendibles | Entre 15 y 75 SQL adicionales sin aumentar presupuesto | Evita invertir donde no hay capacidad, aunque depende de atribución fiable entre canales |
| 4 | Mejorar trazabilidad e identidad | Cero SQL directos | No genera demanda por sí sola, pero permite medir las tres apuestas anteriores con confianza |

La horquilla de la primera apuesta sale de aplicar escenarios conservador, base y optimista a diez combinaciones de municipio y servicio durante seis meses. Antes de presentarla como forecast sería necesario recalcularla con volúmenes reales, distribución de tráfico y límites de capacidad acordados con Operaciones.

### 2.3 Qué no haríamos

No generaría cientos de landings nuevas como primera acción. Publicar contenido local sin datos propios aumenta el riesgo de páginas repetitivas y no resuelve la medición. Tampoco llevaría tráfico a municipios sin cobertura, automatizaría decisiones de publicación ni utilizaría transcripciones o testimonios sin las reglas de privacidad y consentimiento correspondientes.

La inteligencia artificial puede ayudar a resumir señales, redactar borradores y detectar incoherencias. No debe inventar cifras, precios, URLs, afirmaciones sanitarias ni sustituir la aprobación de Marketing. Las cifras y testimonios deben llegar desde fuentes estructuradas y permanecer fuera de la generación libre del modelo.

## 3. Las diferentes partes del producto

El producto está organizado alrededor de un recorrido sencillo. Una persona empieza viendo el portfolio de landings, abre una URL para comprender su rendimiento, consulta oportunidades cuando necesita priorizar, revisa medición cuando existe un cambio y utiliza el plan de 90 días para coordinar el trabajo. En cualquier momento puede abrir Modelo de datos para comprobar de dónde sale una métrica.

### 3.1 Landings

La pantalla inicial muestra una fila por URL. No intenta decidir qué hacer; permite comparar páginas equivalentes mediante sesiones, tasa de lead, tasa de SQL y tasa de alta. La comparación indica si la página está por encima, cerca o por debajo del conjunto filtrado y avisa cuando el volumen es insuficiente o existe una restricción de capacidad.

Al abrir una landing se accede a una ficha con cinco perspectivas. Resumen explica en qué parte del recorrido aparece la diferencia. Tráfico y CRM conecta las visitas con leads, SQL y altas. Datos del municipio aporta demanda, cobertura y capacidad. Experimentos enseña qué cambio se está midiendo. Cambios y decisiones conserva quién decidió, qué hipótesis utilizó y qué ocurrió después.

### 3.2 Oportunidades

Oportunidades combina municipio y servicio para localizar casos que merecen investigación. La puntuación no predice el éxito; ordena señales conocidas como demanda, brecha entre búsquedas y SQL, capacidad, voz del cliente y conversión histórica. Cada tarjeta enseña el cálculo y separa tres estados: elegible, condicionado o no elegible.

Desde la oportunidad puede abrirse una landing real de demostración. Esto permite pasar de una señal numérica a la experiencia que vería una familia y comparar distintas propuestas de contenido sin convertir la herramienta en un generador de landings.

### 3.3 Medición

Medición reúne experimentos, calidad del enlace entre web y CRM, madurez de las oportunidades y decisiones registradas. La pantalla evita presentar un cambio como ganador únicamente porque subió una cifra. Primero comprueba si tratamiento y control tienen datos, si las tendencias previas son comparables, si las cohortes han tenido tiempo de convertirse y si otros canales se han desplazado.

### 3.4 Plan de 90 días

Esta vista convierte la estrategia en operación. Presenta fases, reuniones, restricciones y actas semanales. Cada sesión tiene entradas, agenda, decisiones esperadas, responsable y próxima revisión. El calendario incluye trabajo de desarrollo, calidad de datos, capacidad operativa, aprobación de Marketing y decisiones de los días 30, 60 y 90.

### 3.5 Modelo de datos

Modelo de datos es la capa de confianza del producto. En Flujo se ve cómo llegan los sistemas. En Tablas puede abrirse cada entidad y entender qué representa una fila. En Consultas aparecen únicamente los cálculos que combinan fuentes o producen una métrica de producto. Calidad muestra frescura, integridad, trazabilidad, identidades ambiguas y oportunidades todavía inmaduras.

| Pantalla | Pregunta principal | Decisión que facilita |
| --- | --- | --- |
| Landings | ¿Dónde se rompe el recorrido de esta URL? | Investigar, mantener o proponer un cambio |
| Oportunidades | ¿Dónde coinciden demanda y capacidad? | Elegir el siguiente caso de análisis |
| Medición | ¿Qué ocurrió después del cambio? | Continuar, modificar o parar una prueba |
| Plan de 90 días | ¿Quién debe revisar qué y cuándo? | Coordinar equipos y dejar acuerdos |
| Modelo de datos | ¿De dónde sale este valor? | Validar la lectura antes de actuar |

## 4. La data

El producto no crea una nueva fuente de verdad. Organiza datos que ya viven o vivirían en Databricks, analítica web, Search Console, Strapi y CRM. La clave común es mantener el grano correcto: municipio y servicio para priorizar; URL y día para tráfico; lead u oportunidad para CRM; municipio y semana para experimentos.

El flujo objetivo es el siguiente:

```text
Motor municipal + fábrica de landings
                ↓
Landing publicada en Strapi
                ↓
Search Console + analítica web + eventos
                ↓
Identidad seudónima y oportunidad familiar
                ↓
SQL y altas reconciliados con CRM
                ↓
Métricas, experimento, decisión y aprendizaje
```

Las nueve tablas fuente de la propuesta mantienen los conceptos del anexo: municipio, demanda de búsqueda, voz del cliente, competencia, landing, Search Console, sesiones web, publicidad y lead. Las tablas adicionales no cambian esas fuentes; guardan identidad seudónima, oportunidades familiares, eventos, experimentos, asignaciones, recomendaciones versionadas, flujo de aprobación y auditoría.

### 4.1 Tres consultas que justifican el producto

La pantalla Consultas contiene seis familias, pero para la prueba técnica hay tres especialmente importantes. La primera decide dónde empezar. La segunda explica el rendimiento de una landing. La tercera permite leer el efecto de una prueba.

#### Consulta 1. Seleccionar municipios y servicios elegibles

Esta consulta combina demanda reciente, actividad comercial y capacidad. Incluye municipios con cero SQL mediante un `LEFT JOIN`, porque precisamente esos casos pueden contener una brecha de captación.

```sql
WITH demanda AS (
  SELECT municipio_id, tema AS servicio,
         AVG(busquedas)::numeric AS busquedas_mes
  FROM motor_demanda_busqueda
  WHERE mes >= CURRENT_DATE - INTERVAL '6 months'
  GROUP BY municipio_id, tema
), comercial AS (
  SELECT municipio_id, servicio,
         COUNT(*) FILTER (WHERE tipo_contacto = 'familia_cuidado') AS leads,
         COUNT(*) FILTER (WHERE es_sql AND tipo_contacto = 'familia_cuidado') AS sql
  FROM lead
  WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '180 days'
  GROUP BY municipio_id, servicio
)
SELECT m.municipio_id, m.nombre, d.servicio, d.busquedas_mes,
       COALESCE(c.leads, 0) AS leads, COALESCE(c.sql, 0) AS sql,
       m.cuidadoras_disponibles_30d,
       m.datos_propios
         AND m.tiene_cobertura
         AND d.servicio = ANY(m.servicios_cubiertos)
         AND m.cuidadoras_disponibles_30d >= 8 AS elegible
FROM motor_municipio m
JOIN demanda d USING (municipio_id)
LEFT JOIN comercial c USING (municipio_id, servicio)
ORDER BY elegible DESC, d.busquedas_mes - COALESCE(c.sql, 0) DESC;
```

Si la consulta devuelve demanda alta sin capacidad, el caso no entra en el piloto. Si devuelve demanda, cobertura y pocos SQL, se revisa la landing y la calidad de la medición antes de formular una hipótesis.

#### Consulta 2. Reconciliar una landing con el resultado comercial

La segunda consulta une sesiones, Search Console y CRM mediante URL. Su objetivo no es atribuir causalidad, sino asegurar que una cifra visible puede seguirse desde la página hasta el resultado comercial.

```sql
WITH web AS (
  SELECT url_entrada AS url, SUM(sesiones) AS sesiones,
         SUM(formularios) AS formularios
  FROM web_sesiones_diarias
  WHERE fecha BETWEEN $1 AND $2
  GROUP BY url_entrada
), crm AS (
  SELECT url_entrada AS url,
         COUNT(*) FILTER (WHERE tipo_contacto = 'familia_cuidado') AS leads,
         COUNT(*) FILTER (WHERE es_sql AND tipo_contacto = 'familia_cuidado') AS sql,
         COUNT(*) FILTER (WHERE es_alta AND tipo_contacto = 'familia_cuidado') AS altas
  FROM lead
  WHERE fecha_creacion BETWEEN $1 AND $2
  GROUP BY url_entrada
), search AS (
  SELECT url, SUM(impresiones) AS impresiones, SUM(clics) AS clics
  FROM gsc_diario
  WHERE fecha BETWEEN $1 AND $2
  GROUP BY url
)
SELECT l.url, l.municipio_id,
       COALESCE(w.sesiones, 0) AS sesiones,
       COALESCE(c.leads, 0) AS leads,
       COALESCE(c.sql, 0) AS sql,
       COALESCE(c.altas, 0) AS altas,
       COALESCE(s.impresiones, 0) AS impresiones,
       COALESCE(s.clics, 0) AS clics
FROM landing l
LEFT JOIN web w USING (url)
LEFT JOIN crm c USING (url)
LEFT JOIN search s USING (url);
```

Si existe tráfico pero no hay leads, la investigación se centra en propuesta de valor, formulario y llamada. Si hay leads pero pocos SQL, se revisan mensaje, intención y cualificación. Si la caída aparece de SQL a alta, el problema puede estar fuera de la landing y debe analizarse con Operaciones y Comercial.

#### Consulta 3. Comparar tratamiento y control

La lectura principal cuenta SQL por semana y municipio, conserva semanas con cero resultados y separa cohortes maduras. Después compara el cambio del tratamiento con el cambio del control.

```sql
WITH semanas AS (
  SELECT generate_series(-12, 7) AS semana
), base AS (
  SELECT s.semana, a.variant,
         COUNT(DISTINCT a.municipio_id) AS municipios,
         COUNT(l.lead_id) FILTER (WHERE l.es_sql) AS sql
  FROM semanas s
  CROSS JOIN experiment_assignment a
  LEFT JOIN lead l
    ON l.municipio_id = a.municipio_id
   AND l.fecha_sql >= $2 + (s.semana * INTERVAL '7 days')
   AND l.fecha_sql <  $2 + ((s.semana + 1) * INTERVAL '7 days')
   AND l.tipo_contacto = 'familia_cuidado'
  WHERE a.experiment_id = $1
  GROUP BY s.semana, a.variant
)
SELECT semana, variant,
       sql::numeric / NULLIF(municipios, 0) AS sql_por_municipio
FROM base
ORDER BY semana, variant;
```

La aplicación calcula después una diferencia de diferencias: cambio del tratamiento menos cambio del control. El resultado se marca como inconcluso cuando faltan semanas maduras, la muestra es pequeña o las tendencias previas ya eran diferentes.

### 4.2 Arquitectura y control de la IA

En producción, Databricks prepararía tablas certificadas y métricas versionadas. La API expondría contratos validados; la aplicación mostraría el mismo dato en portfolio, ficha y medición. Strapi conservaría las versiones publicables y CRM seguiría siendo la fuente de SQL y altas.

Antes de publicar, una validación automática debe comprobar cobertura, capacidad, datos propios, consentimiento, originalidad local, SEO técnico y expresiones prohibidas. Marketing revisa tono y posicionamiento; Operaciones confirma que la demanda se puede atender. Después de publicar se vigilan indexación, trazabilidad, integridad y guardarraíles.

El fragmento delicado puede resumirse así:

```text
si no hay datos propios, cobertura o capacidad:
    bloquear publicación y explicar la causa

generar solo el texto permitido a partir de fuentes aprobadas
insertar cifras y testimonios desde datos estructurados

si aparecen precios, afirmaciones sanitarias, datos personales
o contenido sin evidencia local:
    rechazar la versión

solicitar aprobación de Marketing y Operaciones
publicar una versión identificable y registrar la auditoría
```

## 5. Métricas previstas

La métrica que decide la primera apuesta es SQL familiares maduros por municipio y semana. Se elige porque está más cerca del valor comercial que una sesión o un formulario, pero madura antes que el alta. Las altas se mantienen como resultado final y se leen cuando la cohorte ha tenido tiempo suficiente para contratar.

El árbol de métricas evita optimizar una sola cifra. La visibilidad explica si Google muestra la página. La captación mide si la visita se convierte en contacto. La calidad indica si ese contacto llega a SQL. El resultado comercial observa altas. La operabilidad comprueba si Qida puede atender el incremento.

| Nivel | Métricas | Función en la decisión |
| --- | --- | --- |
| Resultado | SQL maduros por municipio-semana; altas maduras | Determinan si merece la pena continuar |
| Embudo | Sesión a lead; lead a SQL; SQL a alta | Localizan dónde aparece la diferencia |
| Visibilidad | Impresiones, clics, CTR y posición | Explican si la página está consiguiendo exposición orgánica |
| Guardarraíles | Capacidad, NPS cuando sea publicable, descartes y canibalización | Evitan mejorar captación a costa de servicio o de otro canal |
| Calidad | Trazabilidad, frescura, integridad, identidades ambiguas y madurez | Indican si la lectura es suficientemente fiable |

### 5.1 Cómo separar señal y causalidad

Relacionar un SQL con una URL es atribución observada, no demuestra que el contenido haya causado el resultado. Para aproximarnos al efecto se seleccionan municipios comparables, se asignan tratamiento y control antes de publicar y se observan las mismas fechas. La diferencia de diferencias reduce el efecto de estacionalidad y cambios generales, pero no elimina todos los sesgos.

Antes de decidir se revisan tendencias previas, tamaño de muestra, exposición real a la versión, cambios simultáneos, desplazamiento desde pago o teléfono y tiempo de maduración. En producción añadiríamos intervalos de confianza, análisis de potencia y sensibilidad. Si el grupo tratado mejora pero también lo hace el control, no se atribuye toda la subida a la landing.

### 5.2 Problemas de datos que debemos controlar

Las fechas de creación, SQL y alta deben respetar el orden temporal. Los contactos de empleo de cuidadoras no pueden entrar en el embudo familiar. Una landing no indexada no debe producir clics orgánicos. Las URLs modificadas necesitan una relación de versiones para evitar partir el histórico. Los municipios sin datos propios deben identificarse como agregados provinciales y no mezclarse silenciosamente con datos municipales.

También es importante conservar los ceros. Si un municipio asignado no produce SQL durante una semana, esa semana no puede desaparecer del denominador. Las identidades ambiguas permanecen separadas y las cohortes recientes no se utilizan para calcular altas maduras.

## 6. Planificación del proyecto

Los primeros 90 días buscan responder una pregunta, no construir toda la plataforma: ¿podemos mejorar landings locales elegibles y medir el cambio con suficiente confianza para escalar?

| Periodo | Trabajo principal | Resultado esperado |
| --- | --- | --- |
| Días 1 a 14 | Validar tracking, capacidad, URLs, métricas y selección de municipios | Protocolo aprobado y línea base reproducible |
| Días 15 a 28 | Preparar versiones, controles editoriales y publicación limitada | Tratamiento y control activos sin incumplir restricciones |
| Días 29 a 56 | Vigilar exposición, indexación, integridad y capacidad | Confirmación de que la prueba se está ejecutando como fue diseñada |
| Días 57 a 90 | Cerrar cohortes, calcular resultado y revisar guardarraíles | Decisión documentada: continuar, modificar o parar |

La primera versión incluye el portfolio de landings, la ficha por URL, la selección de oportunidades, la lectura de experimentos, el linaje de métricas y el registro de decisiones. Quedan fuera la publicación automática, las recomendaciones autónomas, el análisis estadístico avanzado y la expansión masiva a nuevos municipios.

Al final de los 90 días continuaríamos si existe una mejora consistente en SQL maduros, la trazabilidad es suficiente y capacidad o calidad no empeoran. Modificaríamos el enfoque si aparece una señal positiva con problemas de exposición, muestra o mensaje. Pararíamos si no hay mejora relevante, se degrada la calidad comercial o la demanda adicional no puede atenderse.

### 6.1 Equipos y reuniones

Growth mantiene hipótesis y prioridades. Marketing aprueba tono, marca y SEO. Data certifica fuentes, consultas y calidad. MarTech instrumenta, versiona y publica. Operaciones valida cobertura y capacidad. Comercial ayuda a interpretar SQL, descartes y altas.

El ritmo de trabajo combina una sesión semanal de desarrollo para avances y bloqueos, una revisión semanal de datos y capacidad, una demostración quincenal y una aprobación por versión. Los días 30, 60 y 90 se reservan para decisiones de cartera. Cada reunión deja responsable, fecha, evidencia utilizada y próxima revisión.

### 6.2 Horizonte de seis meses

Tras validar el primer piloto, el segundo trimestre ampliaría la muestra y convertiría las reglas aceptadas en capacidades reutilizables. El tercer trimestre incorporaría alertas, permisos, integración real con Strapi y una biblioteca de aprendizajes por servicio y municipio. Solo después tendría sentido automatizar partes de la recomendación o generar nuevas páginas a mayor escala.

## 7. Límites, restricciones y conclusión

La demostración prueba que se puede representar un ciclo coherente desde el dato hasta la decisión. Utiliza datos sintéticos reproducibles y landings de ejemplo. No demuestra que una página real de Qida haya generado más SQL ni que los umbrales elegidos sean correctos para producción.

La versión real no publicaría precios ni afirmaciones sanitarias. Ninguna familia o cuidadora puede identificarse. Las transcripciones y testimonios necesitan privacidad y consentimiento. Marketing aprueba todo lo que afecte a marca o posicionamiento. Los municipios sin capacidad quedan fuera aunque tengan demanda. La IA redacta o resume dentro de límites, pero no decide qué publicar ni puede inventar evidencias.

Para pasar a producción faltaría conectar Databricks, Strapi y CRM, añadir autenticación y permisos, calibrar reglas con históricos reales, completar inferencia estadística y convertir los controles de publicación en verificaciones auditables.

La idea final es sencilla: el motor explica el contexto, la fábrica produce la landing y Qida Growth Intelligence conecta esa landing con su resultado y con el aprendizaje siguiente. El valor no está en mostrar más datos, sino en hacer que cada cambio pueda entenderse, medirse y convertirse en una decisión responsable.

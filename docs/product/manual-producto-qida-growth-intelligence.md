# Qida Growth Intelligence

Documento de producto para la prueba técnica

## 1. Índice y propósito

Este documento presenta Qida Growth Intelligence como respuesta a una pregunta concreta: una vez que Qida dispone de un motor de datos municipal y de una fábrica de landings, ¿cómo puede convertir esos activos en más aprendizaje y mejores decisiones de crecimiento?

La respuesta no consiste en reconstruir lo que ya existe. Consiste en añadir una capa de producto que conecte cada landing con los datos que justificaron su creación, con el resultado que produjo y con la decisión tomada después.

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

Qida Growth Intelligence cierra ese ciclo. La unidad de trabajo deja de ser una gráfica aislada o un municipio abstracto y pasa a ser una landing concreta. Para cada URL, el producto reúne contexto local, tráfico orgánico y de pago, leads, SQL, altas, capacidad, experimentos y decisiones. El resultado no es un sistema que decide por el equipo, sino un lugar común para investigar, medir y dejar trazabilidad.

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

Una persona empieza viendo el conjunto de landings, abre una URL para comprender su rendimiento, consulta Oportunidades cuando necesita priorizar y revisa Medición cuando existe un cambio. Estas tres pantallas forman la navegación principal. El plan de 90 días y el modelo de datos se conservan como material de apoyo para las reuniones y la presentación técnica, accesible por enlace directo pero fuera del menú cotidiano.

### 3.1 Landings

La pantalla inicial muestra una fila por URL. No intenta decidir qué hacer; permite comparar páginas equivalentes mediante sesiones, tasa de lead, tasa de SQL y tasa de alta. La comparación indica si la página está por encima, cerca o por debajo del conjunto filtrado y avisa cuando el volumen es insuficiente o existe una restricción de capacidad.

Al abrir una landing se accede a una ficha con seis perspectivas. Resumen explica en qué parte del recorrido aparece la diferencia. Tráfico y CRM conecta las visitas con leads, SQL y altas. Campañas de pago muestra qué campañas llevaron tráfico a esa URL, cuánto se invirtió y qué resultados pudieron enlazarse después con el CRM. Datos del municipio aporta demanda, cobertura y capacidad. Experimentos enseña qué cambio se está midiendo. Cambios y decisiones conserva quién decidió, qué hipótesis utilizó y qué ocurrió después.

### 3.2 Oportunidades

Oportunidades combina municipio y servicio para localizar casos que merecen investigación. La puntuación no predice el éxito; ordena señales conocidas como demanda, brecha entre búsquedas y SQL, capacidad, voz del cliente y conversión histórica. Cada tarjeta enseña el cálculo y separa tres estados: elegible, condicionado o no elegible.

Desde la oportunidad puede abrirse una landing real de demostración. Esto permite pasar de una señal numérica a la experiencia que vería una familia y comparar distintas propuestas de contenido sin convertir la herramienta en un generador de landings.

### 3.3 Medición

Medición reúne las comparaciones entre versiones, la calidad del enlace entre web y CRM, el tiempo de seguimiento de los SQL y las decisiones registradas. La pantalla evita presentar una landing como ganadora únicamente porque subió una cifra. Primero comprueba si hay datos de la nueva landing y de la versión anterior, si ambos grupos evolucionaban de forma parecida antes del cambio, si las semanas están completas y si otros canales explican parte de la variación.

### 3.4 Plan de 90 días

Esta vista de apoyo presenta fases, reuniones, restricciones y actas semanales. Cada sesión tiene entradas, agenda, decisiones esperadas, responsable y próxima revisión. El calendario incluye trabajo de desarrollo, calidad de datos, capacidad operativa, aprobación de Marketing y decisiones de los días 30, 60 y 90.

### 3.5 Modelo de datos

Esta vista técnica de apoyo explica cómo se obtiene cada valor. En Flujo se ve cómo llegan los sistemas. En Tablas puede abrirse cada entidad y entender qué representa una fila. En Lógica se explica qué datos se combinan y qué reglas producen cada métrica; el SQL puede consultarse cuando se necesita revisar la implementación. Calidad muestra actualización de fuentes, coherencia de fechas, eventos conectados con CRM, identidades sin confirmar y SQL que aún no han completado 90 días de seguimiento.

| Pantalla | Pregunta principal | Decisión que facilita |
| --- | --- | --- |
| Landings | ¿Dónde se rompe el recorrido de esta URL? | Investigar, mantener o proponer un cambio |
| Oportunidades | ¿Dónde coinciden demanda y capacidad? | Elegir el siguiente caso de análisis |
| Medición | ¿Qué ocurrió después del cambio? | Continuar, modificar o parar una prueba |
| Plan de 90 días (apoyo) | ¿Quién debe revisar qué y cuándo? | Coordinar equipos y dejar acuerdos |
| Modelo de datos (apoyo) | ¿De dónde sale este valor? | Validar la lectura antes de actuar |

## 4. La data

El producto no crea una nueva fuente de verdad. Organiza datos que ya viven o vivirían en Databricks, analítica web, Search Console, Strapi y CRM. La clave común es mantener el grano correcto: municipio y servicio para priorizar; URL y día para tráfico; lead u oportunidad para CRM; municipio y semana para experimentos.

El flujo objetivo es el siguiente:

```text
Motor municipal + fábrica de landings
                ↓
Landing publicada en Strapi
                ↓
Search Console + ads_diario + analítica web + eventos
                ↓
Identidad seudónima y oportunidad familiar
                ↓
SQL y altas reconciliados con CRM
                ↓
Métricas, experimento, decisión y aprendizaje
```

Las nueve tablas fuente de la propuesta mantienen los conceptos del anexo: municipio, demanda de búsqueda, voz del cliente, competencia, landing, Search Console, sesiones web, publicidad diaria (`ads_diario`) y lead. Las tablas adicionales no cambian esas fuentes; guardan identidad seudónima, oportunidades familiares, eventos, experimentos, asignaciones, recomendaciones versionadas, flujo de aprobación y auditoría.

### 4.1 Lógica de las tres lecturas principales

Hay tres lecturas especialmente importantes: seleccionar dónde investigar, explicar el rendimiento de una landing y medir un cambio.

#### Seleccionar municipios y servicios que merece la pena investigar

Primero se toman las búsquedas recientes de cada municipio y servicio. Después se añaden los leads y SQL de familias generados en el mismo periodo. Finalmente se comprueba que Qida presta ese servicio en la zona, que existen datos propios suficientes y que hay cuidadoras disponibles para atender nueva demanda. Los municipios sin resultados comerciales se mantienen en la lectura; un cero puede señalar una oportunidad real y no debe desaparecer.

El resultado separa los casos elegibles de los que están bloqueados por cobertura, capacidad o falta de datos. Dentro de los elegibles, la aplicación sitúa primero las combinaciones con demanda relevante y pocos resultados comerciales. Esto no ordena automáticamente el trabajo: permite a Growth revisar la landing, comprobar la medición y formular una hipótesis con contexto suficiente.

#### Explicar el rendimiento de una landing

Para cada landing se reúnen tres recorridos usando la URL como referencia común. Search Console aporta impresiones y clics; la analítica web aporta sesiones, formularios y clics en teléfono; el CRM aporta leads de familias, SQL y altas. Todos los datos se leen en el mismo intervalo temporal y las ausencias se muestran como cero, no como filas eliminadas.

La secuencia permite localizar dónde aparece la diferencia. Muchas impresiones y pocos clics apuntan a visibilidad o mensaje en Google. Sesiones sin leads llevan a revisar propuesta de valor, formulario o llamada. Leads sin suficientes SQL llevan a revisar intención y cualificación. Una caída posterior, entre SQL y alta, puede estar fuera de la landing y requiere una lectura conjunta con Comercial y Operaciones.

#### Relacionar campañas de pago con una landing

Cuando una sesión conserva la URL de la landing y el identificador de campaña, la aplicación enlaza esa campaña con `ads_diario` por campaña y fecha. De esta unión salen la inversión, impresiones, clics, coste por clic y conversiones declaradas por la plataforma publicitaria. El mismo identificador permite contar las sesiones que llegaron a la landing y, cuando el recorrido queda conectado con CRM, los leads, SQL y altas asociados después.

La ficha mantiene separados el resultado de la plataforma publicitaria y el resultado comercial. Una conversión declarada por Google Ads no equivale necesariamente a un SQL confirmado en HubSpot u Odoo. Por eso se muestran ambas cifras y se calculan el coste por SQL y el coste por alta únicamente con resultados reconciliados con CRM.

La tabla disponible tiene grano de campaña y día. La demo puede responder qué campañas llevaron tráfico a una landing y qué resultados comerciales quedaron enlazados, pero no puede atribuirlos a un anuncio o creatividad concretos. Para llegar a ese nivel en producción habría que conservar también los identificadores de grupo de anuncios, anuncio y creatividad en la sesión y en la tabla publicitaria.

#### Medir el efecto de un cambio

Antes de publicar un cambio se asignan municipios comparables a un grupo que recibe la nueva landing y a otro que mantiene la versión anterior. La aplicación cuenta los SQL de familias por municipio y semana y conserva también las semanas con cero resultados. Una semana entra en la comparación cuando ha terminado; no necesita esperar 90 días porque la métrica semanal es el número de SQL, no el número de altas.

La lectura compara cuánto cambia la nueva landing y descuenta el cambio observado en la versión anterior durante las mismas fechas. Así se reduce el efecto de la estacionalidad y de movimientos generales del canal. El resultado se presenta como inconcluso cuando faltan semanas completas, hay pocos municipios o ambos grupos ya evolucionaban de forma diferente antes del cambio.

### 4.2 Arquitectura y control de la IA

En producción, Databricks prepararía tablas certificadas y métricas versionadas. La API expondría contratos validados; la aplicación mostraría el mismo dato en portfolio, ficha y medición. Strapi conservaría las versiones publicables y CRM seguiría siendo la fuente de SQL y altas.

Antes de publicar, una validación automática debe comprobar cobertura, capacidad, datos propios, consentimiento, originalidad local, SEO técnico y expresiones prohibidas. Marketing revisa tono y posicionamiento; Operaciones confirma que la demanda se puede atender. Después de publicar se vigilan indexación, trazabilidad, coherencia de los datos y controles que no deben empeorar, como calidad comercial o capacidad.

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

La métrica que decide la primera apuesta es SQL familiares elegibles por municipio y semana completa. Se elige porque está más cerca del valor comercial que una sesión o un formulario y puede leerse antes que el alta. Una semana completa significa que ya han terminado sus siete días y se han recibido los datos previstos.

La conversión SQL → alta utiliza una condición distinta: cada SQL necesita 90 días de seguimiento antes de entrar en ese cálculo. El plazo evita contar como pérdida una oportunidad que todavía puede contratar. Los 90 días son una hipótesis inicial que debe calibrarse con el histórico real de Qida; no se presentan como una regla universal.

| Nivel | Métricas | Función en la decisión |
| --- | --- | --- |
| Resultado | SQL elegibles por municipio y semana completa; altas de SQL con 90 días de seguimiento | Determinan si merece la pena continuar |
| Embudo | Sesión a lead; lead a SQL; SQL a alta | Localizan dónde aparece la diferencia |
| Visibilidad | Impresiones, clics, CTR y posición | Explican si la página está consiguiendo exposición orgánica |
| Captación de pago | Inversión, clics, coste por clic, coste por SQL y coste por alta | Explican qué campañas llevaron tráfico a cada landing y con qué eficiencia se enlazaron resultados en CRM |
| Controles que no deben empeorar | Capacidad, NPS cuando sea publicable, descartes y desplazamiento desde otros canales | Evitan mejorar captación a costa del servicio o de otro canal |
| Calidad | Eventos conectados con CRM, actualización de fuentes, coherencia de fechas, identidades sin confirmar y SQL aún en seguimiento | Indican si la lectura es suficientemente fiable |

### 5.1 Cómo separar señal y causalidad

Relacionar un SQL con una URL permite saber qué landing aparece en su recorrido, pero no demuestra que el contenido haya causado el resultado. Para aproximarnos al efecto se seleccionan municipios comparables, se decide antes de publicar cuáles reciben la nueva landing y cuáles mantienen la versión anterior, y se observan las mismas fechas. Después se descuenta de la mejora de la nueva landing el cambio que también aparece en la versión anterior. Esta comparación reduce el efecto de la estacionalidad y de cambios generales, pero no elimina todas las diferencias entre municipios.

Antes de decidir se revisa cómo evolucionaban ambos grupos antes del cambio, cuántos municipios participan, qué versión vio realmente cada persona, qué otros cambios coincidieron en el tiempo y si parte del resultado procede de pago o teléfono. En producción añadiríamos un rango de incertidumbre y cálculos para saber si la muestra es suficiente. Si la nueva landing mejora pero también lo hace la versión anterior, no se atribuye toda la subida a la landing.

### 5.2 Problemas de datos que debemos controlar

Las fechas de creación, SQL y alta deben respetar el orden temporal. Los contactos de empleo de cuidadoras no pueden entrar en el embudo familiar. Una landing no indexada no debe producir clics orgánicos. Las URLs modificadas necesitan una relación de versiones para evitar partir el histórico. Los municipios sin datos propios deben identificarse como agregados provinciales y no mezclarse silenciosamente con datos municipales.

También es importante conservar los ceros. Si un municipio asignado no produce SQL durante una semana, esa semana no puede desaparecer del denominador. Las identidades sin confirmación permanecen separadas y los SQL con menos de 90 días no se utilizan todavía para calcular la conversión a alta.

## 6. Planificación del proyecto

Los primeros 90 días buscan responder una pregunta, no construir toda la plataforma: ¿podemos mejorar landings locales elegibles y medir el cambio con suficiente confianza para escalar?

| Periodo | Trabajo principal | Resultado esperado |
| --- | --- | --- |
| Días 1 a 14 | Validar tracking, capacidad, URLs, métricas y selección de municipios | Protocolo aprobado y línea base reproducible |
| Días 15 a 28 | Preparar versiones, controles editoriales y publicación limitada | Nueva landing y versión anterior activas sin incumplir restricciones |
| Días 29 a 56 | Vigilar exposición, indexación, integridad y capacidad | Confirmación de que la prueba se está ejecutando como fue diseñada |
| Días 57 a 90 | Completar el seguimiento, calcular el resultado y revisar los controles | Decisión documentada: continuar, modificar o parar |

La primera versión incluye el portfolio de landings, la ficha por URL, la lectura de campañas de pago por landing, la selección de oportunidades, la lectura de experimentos, el linaje de métricas y el registro de decisiones. Quedan fuera la atribución por creatividad, la publicación automática, las recomendaciones autónomas, el análisis estadístico avanzado y la expansión masiva a nuevos municipios.

Al final de los 90 días continuaríamos si existe una mejora consistente en SQL elegibles, la conexión entre web y CRM es suficiente y la capacidad o la calidad no empeoran. Modificaríamos el enfoque si aparece una señal positiva con problemas de exposición, muestra o mensaje. Pararíamos si no hay mejora relevante, se degrada la calidad comercial o la demanda adicional no puede atenderse.

### 6.1 Equipos y reuniones

Growth mantiene hipótesis y prioridades. Marketing aprueba tono, marca y SEO. Data certifica fuentes, consultas y calidad. MarTech instrumenta, versiona y publica. Operaciones valida cobertura y capacidad. Comercial ayuda a interpretar SQL, descartes y altas.

El ritmo de trabajo combina una sesión semanal de desarrollo para avances y bloqueos, una revisión semanal de datos y capacidad, una demostración quincenal y una aprobación por versión. Los días 30, 60 y 90 se reservan para decisiones de cartera. Cada reunión deja responsable, fecha, evidencia utilizada y próxima revisión.

### 6.2 Horizonte de seis meses

Tras validar el primer piloto, el segundo trimestre ampliaría la muestra y convertiría las reglas aceptadas en capacidades reutilizables. El tercer trimestre incorporaría alertas, permisos, integración real con Strapi y una biblioteca de aprendizajes por servicio y municipio. Solo después tendría sentido automatizar partes de la recomendación o generar nuevas páginas a mayor escala.

## 7. Límites, restricciones y conclusión

Los valores mostrados sirven para explicar el funcionamiento del producto. No representan resultados reales de Qida ni validan los umbrales propuestos.

La versión real no publicaría precios ni afirmaciones sanitarias. Ninguna familia o cuidadora puede identificarse. Las transcripciones y testimonios necesitan privacidad y consentimiento. Marketing aprueba todo lo que afecte a marca o posicionamiento. Los municipios sin capacidad quedan fuera aunque tengan demanda. La IA redacta o resume dentro de límites, pero no decide qué publicar ni puede inventar evidencias.

Para pasar a producción faltaría conectar Databricks, Strapi y CRM, añadir autenticación y permisos, calibrar reglas con históricos reales, completar inferencia estadística y convertir los controles de publicación en verificaciones auditables.

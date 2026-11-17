# Guion de presentación de Qida Growth Intelligence

Duración prevista: 11 minutos, aproximadamente un minuto por diapositiva.

Este texto está preparado como apoyo oral. Conviene explicar las ideas con naturalidad en lugar de leer cada frase literalmente. Los datos de la demostración son sintéticos y las cifras de impacto son hipótesis de planificación.

## Diapositiva 1. Qida Growth Intelligence

**Objetivo:** presentar la propuesta y situarla sobre los activos que Qida ya tiene.

**Qué explicar:**

Qida ya dispone de dos activos importantes: un motor que reúne información por municipio y una fábrica que utiliza esos datos para crear landings locales. Mi propuesta parte de ese trabajo y se centra en lo que ocurre después de publicar. Qida Growth Intelligence es una capa de medición y decisión que conecta cada landing con los datos que justificaron su creación, con el resultado que produce y con las decisiones que toma el equipo. La aplicación que voy a enseñar no pretende sustituir al motor ni volver a construir la fábrica. Su función es cerrar el ciclo para que Marketing, Growth, Data y Operaciones puedan saber qué páginas funcionan, cuáles necesitan revisión y qué aprendizajes deben volver a los sistemas existentes.

**Idea que debe quedar clara:** la propuesta amplía los dos productos existentes y cubre la fase posterior a la publicación.

**Transición:** primero voy a explicar dónde encaja esta tercera pieza.

## Diapositiva 2. Qida Growth Intelligence cierra el ciclo

**Objetivo:** diferenciar claramente los tres productos.

**Qué explicar:**

El motor de datos reúne demanda local, capacidad disponible, actividad comercial y voz del cliente. La fábrica de landings transforma esas señales en páginas locales que Marketing puede revisar y publicar. Ambos productos generan valor, pero todavía queda una pregunta abierta: qué ha ocurrido después con cada página. Growth Intelligence relaciona la versión publicada con el tráfico, el CRM y la capacidad operativa. Esto permite registrar una decisión basada en datos: mantener la landing, modificarla, pausarla o ampliar su uso. El aprendizaje no termina en un dashboard. Vuelve al motor y a la fábrica para mejorar la siguiente decisión. Así, una landing deja de ser solo una URL publicada y pasa a ser una unidad de aprendizaje con contexto, resultado e historial.

**Idea que debe quedar clara:** el nuevo producto convierte el resultado de las landings en aprendizaje reutilizable.

**Transición:** para conseguirlo, todas las páginas siguen el mismo recorrido trazable.

## Diapositiva 3. Cuatro etapas con una misma trazabilidad

**Objetivo:** explicar el recorrido completo desde los datos hasta la decisión.

**Qué explicar:**

El flujo tiene cuatro etapas. Primero aparecen las señales: demanda de búsqueda, capacidad, actividad comercial y necesidades expresadas por las familias. Después, la fábrica genera una versión concreta de la landing, identificada por municipio, servicio e idioma. La tercera etapa mide lo que ocurre tras la publicación, enlazando tráfico, formularios, leads cualificados por Comercial, o SQL, y altas. Finalmente, el equipo revisa el resultado y registra una decisión. Lo importante es que las cuatro etapas comparten identificadores y fechas. Podemos saber qué versión estaba publicada, qué municipio cubría, qué servicio ofrecía y qué evidencia se utilizó para decidir. Esa trazabilidad evita mezclar versiones o atribuir resultados a una página que todavía no estaba activa.

**Idea que debe quedar clara:** cada decisión conserva el origen de los datos y la versión de landing evaluada.

**Transición:** ahora podemos ver cómo llegan esas fuentes al producto sin perder su significado.

## Diapositiva 4. Del origen al componente visible

**Objetivo:** explicar la arquitectura y las responsabilidades de los equipos.

**Qué explicar:**

El producto no crea una nueva fuente de verdad. Databricks mantiene los procesos y controles, y las nueve tablas fuente conservan su definición original. Search Console aporta visibilidad orgánica. La web aporta sesiones y eventos. HubSpot y Odoo aportan leads, SQL y altas. Aircall, los datos públicos y la capacidad operativa completan el contexto. La tabla `ads_diario` conecta cada campaña de pago con una landing y una fecha, para comparar inversión y clics con resultados enlazados al CRM. Sobre estas fuentes se construye una capa semántica con métricas y reglas comunes, y la aplicación las muestra de forma entendible. Además, hay revisiones humanas: Marketing valida contenido y SEO, Operaciones confirma cobertura y Data controla calidad e identidad.

**Idea que debe quedar clara:** la aplicación organiza fuentes existentes y mantiene controles humanos antes de actuar.

**Transición:** con esa base podemos leer el rendimiento completo de una landing.

## Diapositiva 5. Cómo leer el rendimiento de una landing

**Objetivo:** explicar la pantalla principal y la nueva lectura de campañas de pago.

**Qué explicar:**

La unidad principal del producto es una landing concreta. En el listado se comparan páginas equivalentes y, al abrir una, se ve su recorrido completo. La primera lectura es el origen y el volumen: qué tráfico llegó desde buscadores o campañas y cuántas sesiones terminaron enlazadas con leads, SQL y altas. En campañas de pago se separan los datos de la plataforma publicitaria de los resultados confirmados en CRM, porque una conversión de Google Ads no equivale necesariamente a un SQL comercial. La segunda lectura es la conversión y permite localizar en qué paso se pierde demanda. La tercera compara la página con otras landings durante la misma ventana temporal. La pantalla aporta el contexto necesario para investigar, pero no decide automáticamente qué cambiar.

**Idea que debe quedar clara:** la ficha conecta tráfico orgánico, pago, comportamiento web y resultado comercial por URL.

**Transición:** cuando hay muchas páginas, necesitamos ordenar cuáles merece la pena investigar primero.

## Diapositiva 6. Qué significa una oportunidad

**Objetivo:** explicar la puntuación y evitar interpretarla como una predicción.

**Qué explicar:**

Oportunidades combina municipio y servicio para ordenar los casos que merece la pena revisar. La puntuación reúne demanda, brecha de captación, capacidad, voz del cliente y conversión histórica. Cada factor se normaliza, se multiplica por su peso y aporta puntos al total. Esta puntuación no predice que una landing vaya a funcionar. Solo organiza señales conocidas. Después aparece la elegibilidad, que comprueba si existen datos propios suficientes, cobertura del servicio, histórico y cuidadoras disponibles. Un municipio puede tener mucha demanda y aun así no ser apto para una prueba si Qida no puede atenderla. Finalmente, la trazabilidad permite abrir la landing y ver las evidencias y reglas que originaron la puntuación.

**Idea que debe quedar clara:** prioridad y capacidad para actuar son dos preguntas diferentes.

**Transición:** una oportunidad selecciona dónde investigar, pero la medición determina si el cambio produjo una mejora.

## Diapositiva 7. Cómo interpretar un resultado

**Objetivo:** distinguir un cambio observado de una evidencia razonable de efecto.

**Qué explicar:**

Que una métrica suba después de modificar una landing no demuestra por sí solo que el cambio sea la causa. La propuesta compara municipios que reciben la nueva versión con municipios equivalentes que mantienen la anterior. Después calcula cuánto cambió cada grupo durante las mismas fechas y resta ambos cambios. Esta comparación ayuda a controlar estacionalidad y movimientos generales del canal. La demo permite enseñar formularios por sesión, pero la métrica que decide el plan es el número de SQL familiares elegibles por municipio y semana completa. Antes de interpretar el resultado también se comprueba la trazabilidad, que el periodo de observación esté completo y que no existan fallos de integridad. Si faltan datos o los grupos ya evolucionaban de forma distinta, el resultado se presenta como inconcluso.

**Idea que debe quedar clara:** la plataforma muestra cuándo existe evidencia suficiente y cuándo todavía no se puede decidir.

**Transición:** esa metodología se aplica mediante una primera ejecución limitada a 90 días.

## Diapositiva 8. La prueba avanza por hitos

**Objetivo:** presentar la primera apuesta como un proyecto controlado.

**Qué explicar:**

Los primeros 90 días sirven para comprobar si podemos mejorar landings elegibles y medir el resultado con confianza. Durante los primeros 14 días se acuerdan la hipótesis, el tracking, la métrica y los municipios aptos. Entre los días 15 y 28 se publica una primera ola pequeña, aprobada y trazable. Entre los días 29 y 56 se vigila que la exposición sea estable, que los eventos lleguen y que la capacidad no empeore. En la última fase se completa la ventana de observación y se prepara la decisión. Cada etapa termina con una salida verificable antes de continuar. Los hitos de los días 30, 60 y 90 permiten corregir el experimento sin esperar al final si aparece un problema de datos, publicación o capacidad.

**Idea que debe quedar clara:** el plan reduce riesgo mediante fases, criterios de salida y revisiones intermedias.

**Transición:** para que el plan funcione, cada equipo necesita una reunión con un propósito específico.

## Diapositiva 9. Un ciclo de trabajo con decisiones registradas

**Objetivo:** explicar cómo se coordina el trabajo entre equipos.

**Qué explicar:**

La cadencia evita que el análisis dependa de conversaciones aisladas. Desarrollo revisa semanalmente avances, incidencias técnicas y bloqueos. Data y Operaciones revisan también cada semana la calidad, la cobertura y la capacidad para atender nueva demanda. Cada dos semanas se hace una demo del producto con resultados visibles. Marketing aprueba cada versión antes de publicarla, y en los días 30, 60 y 90 se toman las decisiones de cartera. Todas las reuniones escriben sobre un registro común: tareas, incidencias, acuerdos, responsable y próxima revisión. Jira y Slack ayudan a coordinar el trabajo, pero la decisión debe quedar vinculada a la landing y a la evidencia dentro del producto. Así se puede reconstruir qué se decidió y por qué.

**Idea que debe quedar clara:** las reuniones producen decisiones y responsables, no solo actualizaciones de estado.

**Transición:** si el piloto funciona, esta disciplina permite ampliar el producto durante los seis meses siguientes.

## Diapositiva 10. Seis meses para validar y escalar

**Objetivo:** presentar el horizonte completo sin tratar las estimaciones como resultados reales.

**Qué explicar:**

El primer mes establece definiciones y calidad. El segundo publica la primera ola controlada. El tercero permite leer cohortes con suficiente seguimiento. En el cuarto mes se aplican los cambios que hayan mostrado una señal útil. El quinto busca patrones que puedan repetirse y el sexto decide qué capacidades pasan a producción. Las cifras inferiores son hipótesis de impacto para ordenar apuestas, no resultados de Qida: estiman posibles mejoras en SQL procedentes de landings elegibles, en conversión de SQL a alta y en reasignación de captación. Antes de convertirlas en un forecast habría que recalcularlas con tráfico real, tiempos comerciales y límites operativos. Solo se escala un aprendizaje cuando supera los criterios de medición, calidad y capacidad.

**Idea que debe quedar clara:** el crecimiento se apoya en aprendizajes validados, no en publicar más páginas por defecto.

**Transición:** cierro resumiendo qué demuestra la entrega y qué quedaría para producción.

## Diapositiva 11. Producto, método y plan de ejecución

**Objetivo:** cerrar la presentación y conectar los entregables.

**Qué explicar:**

La entrega combina tres niveles. La aplicación funcional demuestra cómo una landing queda vinculada con datos, campañas, resultados, experimentos y decisiones. El manual explica el producto con más profundidad, incluyendo las métricas, los límites y la planificación. La presentación resume el relato para discutirlo con los equipos. El repositorio conserva además la API, el modelo de datos, las reglas analíticas y las pruebas, aunque GitHub Pages utilice datos locales para que la demo sea accesible. Para llevarlo a producción habría que conectar las fuentes reales, añadir permisos, calibrar las reglas con históricos de Qida y convertir los controles en validaciones auditables. La aportación principal es un método para decidir qué mantener, qué modificar y qué escalar después de publicar una landing.

**Idea que debe quedar clara:** la propuesta incluye un producto demostrable y un camino concreto hacia producción.

**Cierre sugerido:** esta es la base de Qida Growth Intelligence. A partir de aquí puedo enseñar la demo o profundizar en la medición, la arquitectura o el plan de ejecución.

## Recordatorios para la presentación

- No presentes los datos de la demo como resultados reales de Qida.
- Cuando aparezca SQL, aclara que significa un lead familiar cualificado por el equipo comercial.
- Explica que la puntuación de oportunidad ordena señales y no predice el resultado.
- Separa las conversiones declaradas por la plataforma publicitaria de los SQL y altas confirmados en CRM.
- Presenta las cifras de seis meses como hipótesis que deben recalcularse con datos reales.
- Si falta tiempo, conserva las diapositivas 2, 5, 7, 8 y 11, porque contienen el argumento principal.

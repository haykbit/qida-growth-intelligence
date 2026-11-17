# Guion de presentación de Qida Growth Intelligence

Duración prevista: 11 minutos, aproximadamente un minuto por diapositiva.

Este guion acompaña a `qida-growth-intelligence.pptx`. Cada diapositiva enlaza con una parte concreta del manual de producto. No hace falta leer el texto literalmente: sirve para mantener el argumento, explicar las cifras con precisión y pasar de una idea a la siguiente.

## Diapositiva 1. Qida Growth Intelligence

**Referencia en el manual:** secciones 1 y 2, «Índice y propósito» y «Presentación de la idea».

Qida ya dispone de un motor que reúne datos por municipio y de una fábrica que utiliza esa información para crear landings locales. La propuesta comienza después de publicar. Qida Growth Intelligence conecta cada landing con los datos que justificaron su creación, con el tráfico y los resultados comerciales que produjo y con las decisiones tomadas por el equipo. No sustituye al motor ni reconstruye la fábrica. Añade la parte que falta para poder investigar el rendimiento, medir los cambios y conservar lo aprendido. La unidad de trabajo es una URL concreta, con su municipio, servicio, versión e historial.

**Transición:** primero voy a situar esta tercera pieza junto a los dos productos existentes.

## Diapositiva 2. Qida Growth Intelligence cierra el ciclo

**Referencia en el manual:** sección 2, «Presentación de la idea».

El motor de datos reúne demanda, capacidad, actividad comercial y voz del cliente. La fábrica transforma esas señales en páginas locales que Marketing revisa antes de publicar. Growth Intelligence utiliza lo que ocurre después: relaciona la versión publicada con tráfico, CRM y capacidad operativa. Así el equipo puede registrar si mantiene una landing, la modifica, la pausa o amplía su uso. La decisión queda vinculada a la evidencia que la originó y el aprendizaje puede volver al motor y a la fábrica. El objetivo no es añadir otro dashboard, sino cerrar el recorrido entre datos, publicación, resultado y siguiente decisión.

**Transición:** ese ciclo se puede entender como cuatro etapas que comparten los mismos identificadores.

## Diapositiva 3. Cuatro etapas con una misma trazabilidad

**Referencia en el manual:** secciones 2.1 y 4, «La primera apuesta» y «La data».

La primera etapa reúne las señales: demanda de búsqueda, capacidad, actividad comercial y necesidades expresadas por las familias. La segunda identifica la landing generada por municipio, servicio, idioma y versión. La tercera mide lo que ocurre tras publicarla: visitas, formularios, leads, SQL y altas. Un SQL es un contacto familiar que Comercial considera cualificado. La cuarta etapa compara el resultado, revisa las restricciones y registra una decisión. Las cuatro etapas conservan URL, versión, municipio, servicio y fecha. Esto evita mezclar periodos o atribuir resultados a una página que todavía no estaba publicada.

**Transición:** la siguiente diapositiva muestra cómo se organizan técnicamente esas fuentes.

## Diapositiva 4. Arquitectura de datos

**Referencia en el manual:** secciones 4 y 4.2, «La data» y «Arquitectura y control de la IA».

La arquitectura tiene cuatro pasos. Primero llegan las fuentes: motor municipal, demanda de búsqueda, voz del cliente, competencia, landings, Search Console, sesiones web, publicidad y CRM. Después Databricks unifica y valida los datos, y los organiza por municipio, servicio, URL y fecha. En el tercer paso esas tablas se transforman en métricas comunes: embudo, oportunidad, resultados de experimentos y trazabilidad entre web y CRM. La aplicación consume esas métricas en tres pantallas principales: Landings, Oportunidades y Medición. La idea importante es que el producto no inventa cifras ni crea una fuente paralela; muestra transformaciones definidas y reproducibles sobre los sistemas existentes.

**Transición:** con esa arquitectura podemos leer una landing completa sin saltar entre herramientas.

## Diapositiva 5. Cómo leer el rendimiento de una landing

**Referencia en el manual:** secciones 3.1, 4.1 y 5, «Landings», «Lógica de las métricas» y «Métricas previstas».

La ficha comienza por el origen y el volumen. Reúne la visibilidad orgánica de Search Console, las campañas que llevaron tráfico, las sesiones de la web y los resultados confirmados en CRM. Después presenta el embudo para localizar la diferencia: impresiones a clic, sesión a lead, lead a SQL y SQL a alta. Finalmente compara la URL con páginas equivalentes durante la misma ventana. La conversión declarada por una plataforma publicitaria se mantiene separada de los SQL y altas del CRM. Esto permite distinguir una señal de campaña de un resultado comercial confirmado y evita sumar como si fueran la misma cosa.

**Transición:** cuando existen muchas páginas, necesitamos ordenar cuáles merece la pena investigar primero.

## Diapositiva 6. Qué significa una oportunidad

**Referencia en el manual:** secciones 3.2 y 4.1, «Oportunidades» y «Seleccionar municipios y servicios».

Oportunidades analiza cada combinación de municipio y servicio. La prioridad reúne demanda de búsqueda, brecha de captación, capacidad, voz del cliente y conversión histórica. Cada factor aporta una parte de la puntuación. La elegibilidad responde a otra pregunta: si existen datos propios, cobertura del servicio, histórico suficiente y al menos ocho cuidadoras disponibles. Una puntuación alta no predice el éxito de una landing y tampoco autoriza automáticamente una prueba. Sirve para ordenar la investigación. Desde la oportunidad se puede abrir el desglose del cálculo y la landing que vería una familia, de modo que la señal numérica siempre conserva su contexto.

**Transición:** seleccionar una oportunidad indica dónde probar; Medición indica qué ocurrió después.

## Diapositiva 7. Cómo interpretar un resultado

**Referencia en el manual:** secciones 3.3, 4.1 y 5.1, «Medición», «Medir el efecto de un cambio» y «Cómo separar señal y causalidad».

Una subida después de modificar una landing no demuestra por sí sola que el cambio la haya causado. El plan compara municipios que reciben la nueva versión con municipios equivalentes que conservan la anterior. Se calcula el cambio de cada grupo durante las mismas fechas y se descuenta el cambio del grupo de comparación. La métrica comercial principal son los SQL familiares elegibles por municipio y semana completa. Antes de decidir se revisan la trazabilidad web–CRM, las semanas disponibles, el tamaño de la muestra, la evolución previa y posibles desplazamientos desde teléfono o campañas. Si esos controles no son suficientes, la aplicación muestra el resultado como inconcluso.

**Transición:** esta metodología se prueba primero mediante un plan limitado de 90 días.

## Diapositiva 8. La prueba avanza por hitos

**Referencia en el manual:** secciones 3.4 y 6, «Plan de 90 días» y «Planificación del proyecto».

Los primeros 14 días sirven para acordar la hipótesis, validar el tracking, confirmar la capacidad y establecer una línea base reproducible. Entre los días 15 y 28 se preparan las versiones y se publica una primera ola limitada. Entre los días 29 y 56 se vigilan exposición, indexación, integridad de los eventos y capacidad operativa. Entre los días 57 y 90 se completa el seguimiento y se calcula el resultado. Los hitos de los días 30, 60 y 90 permiten revisar el avance y registrar una decisión. Continuar, modificar o parar depende de la métrica y de los controles, no solo de que un número haya subido.

**Transición:** para ejecutar ese plan, cada equipo necesita una cadencia y una responsabilidad claras.

## Diapositiva 9. Un ciclo de trabajo con decisiones registradas

**Referencia en el manual:** sección 6.1, «Equipos y reuniones».

Growth mantiene las hipótesis y prioridades. Marketing aprueba el mensaje, la marca y el SEO. Data certifica las fuentes, los cálculos y la calidad. MarTech instrumenta, versiona y publica. Operaciones confirma cobertura y capacidad, y Comercial ayuda a interpretar SQL, descartes y altas. Desarrollo y la revisión de datos se realizan semanalmente; la demo de producto, cada dos semanas; y cada versión necesita aprobación antes de publicarse. Los días 30, 60 y 90 se revisa la decisión de cartera. Cada reunión deja responsables, incidencias, acuerdos y una próxima revisión vinculados con la landing correspondiente.

**Transición:** el manual también cuantifica qué impacto podrían tener las primeras apuestas durante seis meses.

## Diapositiva 10. Impacto estimado a seis meses

**Referencia en el manual:** sección 2.2, «Prioridad y orden de magnitud».

Estas cifras son escenarios de planificación calculados con datos sintéticos; no representan resultados reales de Qida. Para landings locales elegibles, el manual estima 83,2 SQL en el escenario conservador, 232,8 en el base y 538,6 en el optimista. El punto de partida son 5.280 búsquedas mensuales en diez municipios. Para mejorar la conversión de SQL a alta, los escenarios son 120,7, 241,3 y 362 altas, usando como referencia 2.011 SQL familiares en los últimos 30 días. Para reasignar inversión de pago, se estiman 191,4, 382,8 y 574,2 SQL adicionales, a partir de 638 SQL mensuales enlazados con campañas. La trazabilidad se valora con cero resultados directos porque mejora la medición sin crear SQL ni altas nuevos.

**Transición:** termino conectando la aplicación, el manual y el camino necesario para llegar a producción.

## Diapositiva 11. Producto, método y plan de ejecución

**Referencia en el manual:** secciones 6 y 7, «Planificación del proyecto» y «Límites, restricciones y conclusión».

La aplicación demuestra el recorrido completo: seleccionar una oportunidad, abrir una landing, revisar su embudo, relacionarla con campañas y CRM, medir un cambio y registrar una decisión. El manual documenta el producto, la lógica de los datos, las métricas, las estimaciones y la planificación. La presentación resume ese contenido para discutirlo en una entrevista. Para llevar la propuesta a producción todavía habría que conectar Databricks, Strapi y CRM, añadir autenticación y permisos, calibrar las reglas con históricos reales y convertir los controles en verificaciones auditables. La entrega demuestra un producto y también una forma concreta de trabajar durante los primeros seis meses.

**Cierre sugerido:** a partir de aquí puedo enseñar la demo o profundizar en la medición, la arquitectura y el plan de ejecución.

## Recordatorios antes de presentar

- Las cifras de la demostración son sintéticas y las estimaciones de seis meses son hipótesis de planificación.
- SQL significa contacto familiar cualificado por el equipo comercial.
- La puntuación de Oportunidades ordena señales; no predice el resultado ni decide por el equipo.
- Las conversiones publicitarias y los resultados confirmados en CRM se muestran por separado.
- La capacidad local, la privacidad, el consentimiento y la aprobación de Marketing limitan qué se publica y dónde se prueba.

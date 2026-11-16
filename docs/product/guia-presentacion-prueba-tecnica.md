# Guía para presentar Qida Growth Intelligence

Estado: guion de presentación y demostración
Fecha: 16 de noviembre de 2026
Presentación: 12 diapositivas, portada sin numeración
Datos: sintéticos, deterministas y persistidos

## 1. Función de este documento

Esta guía explica qué decir, en qué orden y qué conviene enseñar durante la presentación.

No contiene la explicación completa del producto. Para estudiar conceptos, pantallas, datos, métricas, consultas y arquitectura utiliza el [manual de producto](./manual-producto-qida-growth-intelligence.md).

La [auditoría del caso](./case-audit-and-delivery-backlog.md) registra el cumplimiento de requisitos y el trabajo pendiente.

## 2. El mensaje principal

Qida ya dispone de un motor de datos y una fábrica de landings. La propuesta añade la capa que relaciona cada landing con tráfico, CRM, capacidad, experimentos y decisiones.

La frase que debe recordar la audiencia es:

> Qida Growth Intelligence conecta cada landing con sus datos de origen, su resultado medido y la decisión que se tomó después.

## 3. Aclaraciones que deben hacerse al principio

- Los datos de la demostración son sintéticos.
- Las cifras de impacto son supuestos de planificación, no resultados reales.
- La publicación está simulada y exige aprobación humana.
- La puntuación de oportunidad ordena casos; no predice éxito.
- La atribución por URL no demuestra causalidad.
- La primera prueba debe excluir municipios sin capacidad.

## 4. Guion de la presentación

## Portada — Qida Growth Intelligence

Tiempo aproximado: 40 segundos.

### Qué muestra

El nombre de la propuesta y un recurso visual que representa datos moviéndose entre sistemas, métricas y decisiones.

### Qué decir

> Qida ya ha construido dos activos valiosos: un motor que entiende cada municipio y una fábrica que puede crear landings locales. Mi propuesta cubre el paso posterior: medir, comparar y convertir el resultado en una decisión reutilizable.

### Qué evitar

No describir todavía todas las pantallas ni la arquitectura.

## Diapositiva 2 — Qida Growth Intelligence cierra el ciclo

Tiempo aproximado: 1 minuto y 20 segundos.

### Qué muestra

Tres bloques:

1. Motor de datos, ya existente.
2. Fábrica de landings, ya existente.
3. Growth Intelligence, nueva propuesta.

### Qué decir

> El motor aporta demanda, capacidad, actividad comercial y voz del cliente. La fábrica convierte esas señales en páginas revisadas por Marketing. Growth Intelligence añade la tercera pieza: relaciona cada versión publicada con tráfico, CRM y capacidad, y devuelve el aprendizaje al siguiente ciclo.

### Mensaje importante

Los dos primeros bloques ya existen. La propuesta no pretende reconstruirlos.

## Diapositiva 3 — Cuatro etapas con una misma trazabilidad

Tiempo aproximado: 1 minuto.

### Qué muestra

Señales, Landing, Medición y Decisión.

### Qué decir

> Para que el aprendizaje sea reutilizable, conservamos la misma trazabilidad desde la señal inicial hasta la decisión. Sabemos qué municipio, servicio, versión y periodo originaron cada resultado.

### Cómo recorrerla

- Señales: demanda, capacidad y necesidades.
- Landing: versión concreta de la página.
- Medición: tráfico, formularios y CRM.
- Decisión: mantener, modificar o parar.

## Diapositiva 4 — Del origen al componente visible

Tiempo aproximado: 1 minuto y 15 segundos.

### Qué muestra

El recorrido desde las fuentes hasta el producto.

### Qué decir

> Los datos nacen en Google, la web, CRM, telefonía, fuentes públicas y capacidad. Databricks los procesa y conserva en tablas con definiciones estables. Las consultas construyen métricas y la API las entrega al producto. Marketing, Operaciones y Data mantienen controles humanos en los puntos de riesgo.

### Si preguntan por “capa semántica”

> Es el conjunto de definiciones y reglas que garantiza que un concepto, por ejemplo SQL familiar elegible, signifique lo mismo en la consulta, la API y la pantalla.

## Diapositiva 5 — Cómo leer el rendimiento de una landing

Tiempo aproximado: 1 minuto y 30 segundos.

### Qué muestra

Capturas de Landings y tres formas de leerlas: volumen, conversión y comparación.

### Qué decir

> La primera lectura separa tres preguntas. Volumen: cuánto recorrido se atribuye a la página. Conversión: en qué paso se pierde o conserva la demanda. Comparación: si el comportamiento es diferente al de páginas equivalentes durante la misma ventana.

### Qué evitar

No presentar una cifra de la captura como resultado real de Qida.

## Diapositiva 6 — Qué significa una oportunidad

Tiempo aproximado: 1 minuto y 15 segundos.

### Qué muestra

La pantalla de Oportunidades y tres conceptos: prioridad, elegibilidad y trazabilidad.

### Qué decir

> La pantalla no ordena únicamente por búsquedas. Combina demanda, brecha de captación, capacidad, voz del cliente y conversión. Después aplica una puerta de elegibilidad. Una zona con demanda alta sigue fuera si no tenemos datos propios, cobertura o cuidadoras suficientes.

### Frase clave

> La puntuación ordena; una persona decide.

## Diapositiva 7 — Cómo interpretar un resultado

Tiempo aproximado: 1 minuto y 30 segundos.

### Qué muestra

Comparación, métrica y controles de calidad.

### Qué decir

> Observar una mejora no basta. Comparamos tratamiento y control durante las mismas fechas, declaramos antes la métrica y mostramos al lado del resultado tres tipos de control: trazabilidad, madurez e integridad.

### Explicación breve

- Trazabilidad: podemos conectar el recorrido.
- Integridad: los datos respetan las reglas.
- Madurez: ha pasado tiempo suficiente.

## Diapositiva 8 — De la tabla al dato visible

Tiempo aproximado: 1 minuto y 30 segundos.

### Qué muestra

Tablas, consulta SQL, métrica, API y componente visible.

### Qué decir

> Esta vista permite escoger un dato importante y recorrerlo hacia atrás. No enseñamos todos los SELECT del software; enseñamos las consultas que combinan fuentes o controlan una decisión.

### Ejemplos que conviene nombrar

- Puntuación de oportunidad para decidir por dónde empezar.
- Cambio de experimento para leer un resultado.

## Diapositiva 9 — La prueba avanza por hitos

Tiempo aproximado: 1 minuto y 30 segundos.

### Qué muestra

Cuatro fases durante 90 días y la cadencia de trabajo.

### Qué decir

> La primera apuesta se divide en preparar, publicar, medir y decidir. Cada fase termina con un hito verificable. La métrica final son SQL familiares elegibles por municipio y semana; publicar páginas no es por sí mismo un resultado.

### Qué señalar

Desarrollo y Datos trabajan semanalmente. Las demostraciones presentan incrementos. Los hitos controlan el paso de fase.

## Diapositiva 10 — Un ciclo de trabajo con decisiones registradas

Tiempo aproximado: 1 minuto y 15 segundos.

### Qué muestra

Desarrollo, Datos y capacidad, Demo, Aprobación y Decisión.

### Qué decir

> Las reuniones cumplen funciones diferentes y todas dejan un registro común. Desarrollo resuelve bloqueos, Datos revisa calidad y capacidad, la demo recoge comentarios, Marketing aprueba versiones y los foros de decisión revisan la evidencia acumulada.

### Qué evitar

No presentar la reunión como entregable. El entregable es la decisión, incidencia o evidencia que deja.

## Diapositiva 11 — Seis meses para validar y escalar

Tiempo aproximado: 1 minuto y 15 segundos.

### Qué muestra

La progresión desde una base fiable hasta una cartera de iniciativas.

### Qué decir

> Los primeros meses construyen una base fiable y lanzan una primera ola gobernada. Después esperamos cohortes maduras, aplicamos cambios y solo ampliamos patrones que se repiten. Los rangos de impacto son hipótesis para priorizar, no resultados prometidos.

## Diapositiva 12 — Producto, método y plan de ejecución

Tiempo aproximado: 1 minuto.

### Qué muestra

- aplicación funcional;
- consultas y métricas;
- plan de 90 días;
- guía de demostración;
- auditoría de requisitos.

### Qué decir

> La entrega combina producto, método y ejecución. La idea final es que cada landing quede vinculada a datos, una medición y una decisión registrada.

## 5. Demostración de la aplicación

Si después de la presentación hay entre cinco y siete minutos, utiliza este recorrido.

### Paso 1. Landings

1. Abre una landing con volumen.
2. Explica sesiones, leads, SQL y altas.
3. Compara las tres tasas.
4. Abre la ficha.

Frase útil:

> La ficha muestra el recorrido atribuido a la URL. Todavía no afirma que la landing haya causado el resultado.

### Paso 2. Ficha de landing

1. Recorre el embudo.
2. Enseña las puntuaciones comparables.
3. Abre Datos del municipio.
4. Abre la landing demo.
5. Muestra Cambios y decisiones.

### Paso 3. Oportunidades

1. Abre una oportunidad elegible.
2. Despliega el cálculo.
3. Explica cada factor.
4. Muestra una oportunidad restringida por capacidad.

### Paso 4. Medición

1. Identifica la métrica principal.
2. Explica tratamiento y control.
3. Revisa eventos enlazados, madurez e integridad.
4. Lee los avisos del resultado comercial.

Frase de transición:

> Para estimar si el cambio aportó algo adicional necesito comparar tratamiento y control y revisar la calidad de la evidencia.

### Paso 5. Modelo de datos

1. Abre Consultas.
2. Selecciona Rendimiento por landing.
3. Enseña fórmula, SQL y resultado.
4. Selecciona Cambio de experimento.

### Paso 6. Plan de 90 días

1. Selecciona una reunión de Desarrollo.
2. Enseña entradas, decisiones y salidas.
3. Abre el acta semanal.
4. Muestra Restricciones y evidencia.

## 6. Preguntas previsibles

### ¿Por qué no construir otra fábrica de landings?

Porque la fábrica ya existe. El valor adicional está en seleccionar, medir y conservar el aprendizaje.

### ¿Por qué no usar un modelo predictivo?

No existe todavía suficiente historia de intervenciones comparables ni una etiqueta causal de éxito. Una regla versionada es más fácil de auditar.

### ¿Qué hace la IA?

Clasifica temas agregados de llamadas y puede redactar texto o resumir patrones. No crea cifras, no decide causalidad y no publica sin una persona.

### ¿Por qué utilizar municipio como unidad?

Porque demanda, cobertura, capacidad y landing son locales. Dividir usuarios dentro del mismo municipio puede contaminar la comparación.

### ¿Por qué esperar 90 días?

La indexación necesita tiempo y un SQL reciente todavía puede terminar en alta. La ventana evita comparar cohortes con distinta oportunidad de madurar.

### ¿Esto demuestra causalidad?

No por sí solo. La aplicación implementa atribución y una comparación descriptiva con control. Producción necesita tamaño de muestra, intervalos y diagnósticos.

### ¿Qué falta para producción?

- conectar Databricks, Strapi y CRM;
- añadir autenticación y permisos;
- validar umbrales con los equipos;
- completar inferencia estadística;
- verificar seguimiento con datos reales;
- reemplazar la publicación simulada.

## 7. Frases que conviene evitar

| Evitar | Utilizar |
| --- | --- |
| “La IA ha decidido” | “La regla ordena y una persona decide” |
| “Esta landing causó las altas” | “Estas altas están atribuidas a la URL” |
| “Estos son datos reales de Qida” | “La demo utiliza datos sintéticos” |
| “Este municipio es el mejor” | “Aparece primero bajo esta versión de reglas” |
| “Google la posicionará” | “La página cumple controles; la posición se observa después” |
| “Publicamos automáticamente” | “La publicación exige aprobación humana” |
| “El experimento es positivo” | “Observamos una señal; faltan controles y diagnósticos” |

## 8. Checklist antes de presentar

- Abrir la presentación y comprobar sus 12 diapositivas.
- Comprobar que la portada no tiene número.
- Abrir la aplicación y confirmar que responde.
- Limpiar filtros.
- Elegir una landing con volumen.
- Elegir una landing restringida por capacidad.
- Elegir una oportunidad elegible.
- Preparar un experimento con tratamiento y control.
- Abrir las consultas Rendimiento por landing y Cambio de experimento.
- Tener abierto el [manual de producto](./manual-producto-qida-growth-intelligence.md).
- Indicar al principio que los datos son sintéticos.
- Reservar el cierre para límites y siguiente paso.

## 9. Archivos de la entrega

- [Manual de producto](./manual-producto-qida-growth-intelligence.md)
- [Auditoría del caso](./case-audit-and-delivery-backlog.md)
- [Presentación](./qida-growth-intelligence.pptx)

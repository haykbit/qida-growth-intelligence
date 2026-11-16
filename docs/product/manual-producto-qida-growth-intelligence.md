# Manual de producto de Qida Growth Intelligence

Estado: documento canónico para aprender el producto
Fecha: 16 de noviembre de 2026
Audiencia: personas junior de Producto, Growth, Data, Marketing y Tecnología
Datos de la demostración: sintéticos, deterministas y persistidos

## 1. Para qué sirve este manual

Este documento explica el producto desde cero. No es un guion de presentación ni un listado de tickets. Su objetivo es que una persona que no conoce el proyecto pueda responder estas preguntas:

1. ¿Qué problema resuelve Qida Growth Intelligence?
2. ¿Qué existía antes y qué añade la propuesta?
3. ¿Qué significa cada pantalla?
4. ¿De dónde sale cada dato?
5. ¿Cómo se calculan las métricas?
6. ¿Qué decisiones permite tomar el producto?
7. ¿Qué puede afirmar la aplicación y qué no puede afirmar?
8. ¿Cómo se ejecutaría la primera prueba durante 90 días?
9. ¿Qué partes son reales en la demostración y qué falta para producción?

La lectura recomendada para una persona junior es:

- capítulos 2 a 6 para comprender el producto;
- capítulos 7 a 10 para comprender las métricas y los datos;
- capítulos 11 a 15 para comprender la ejecución, el gobierno y los límites;
- capítulos 16 y 17 para practicar y resolver dudas.

## 2. El problema que queremos resolver

Qida ya dispone de dos activos importantes.

### 2.1 Motor de datos

El motor reúne información por municipio y servicio:

- cobertura y disponibilidad de cuidadoras;
- leads, oportunidades comerciales cualificadas y altas;
- búsquedas en Google;
- necesidades expresadas por las familias en llamadas;
- servicios comunicados por competidores;
- datos públicos y contexto territorial.

El motor responde preguntas como:

- ¿Existe demanda de ayuda a domicilio en este municipio?
- ¿Qida presta este servicio en la zona?
- ¿Hay cuidadoras disponibles?
- ¿Qué necesidades mencionan las familias?
- ¿Cuántas oportunidades y altas se han observado?

### 2.2 Fábrica de landings

La fábrica utiliza los datos autorizados para preparar páginas locales. Marketing elige municipio, servicio, idioma y bloques. Un modelo de lenguaje puede redactar texto, pero no puede inventar cifras, precios, URLs ni afirmaciones sanitarias.

La fábrica responde:

- ¿Podemos crear una página local con información propia de Qida?
- ¿Qué bloques debe incluir?
- ¿Qué versión debe revisar Marketing?

### 2.3 Lo que faltaba

Crear una página no explica si funciona. Después de publicarla necesitamos saber:

- si Google la indexó y la mostró;
- si recibió visitas;
- si las visitas dejaron un formulario o llamaron;
- si esos contactos se convirtieron en oportunidades reales;
- si las oportunidades terminaron en altas;
- si Qida tenía capacidad para prestar el servicio;
- si la mejora coincide con la landing o con otro cambio;
- qué decisión tomó el equipo y sobre qué versión.

Qida Growth Intelligence cubre este espacio. Conecta el motor de datos y las landings con medición, calidad y decisiones.

## 3. La idea central del producto

El producto convierte un proceso lineal en un ciclo de aprendizaje.

```text
Motor de datos
    aporta demanda, capacidad, actividad y necesidades
            ↓
Fábrica de landings
    crea una versión local revisada
            ↓
Publicación e instrumentación
    conserva URL, versión, fechas y eventos
            ↓
Growth Intelligence
    relaciona web, Google, CRM y capacidad
            ↓
Medición
    compara resultado, calidad y grupo de control
            ↓
Decisión humana
    mantener, modificar, parar o ampliar la prueba
            ↓
El aprendizaje se utiliza en la siguiente versión
```

### 3.1 Qué significa cerrar el ciclo

Cerrar el ciclo significa que cada decisión puede rastrearse hacia atrás.

Ejemplo:

1. Marketing modifica el titular de una landing.
2. La aplicación guarda el titular anterior y el nuevo.
3. La versión se relaciona con un experimento.
4. El experimento tiene una métrica declarada antes de empezar.
5. La aplicación muestra el resultado y sus controles de calidad.
6. Una persona registra si mantiene, modifica o para el cambio.
7. La decisión conserva el motivo, la fecha, el responsable y una copia del resultado disponible.

Sin estos pasos solo tendríamos páginas y números. Con ellos tenemos aprendizaje reutilizable.

### 3.2 Qué no es el producto

Qida Growth Intelligence no es:

- otro generador de landings;
- un panel que mezcla todos los números posibles;
- un sistema que publica sin aprobación;
- un modelo que predice automáticamente dónde crecer;
- una prueba causal completa;
- una integración productiva ya conectada con todos los sistemas reales.

## 4. Quién utiliza el producto

### Growth

Growth formula hipótesis, prioriza oportunidades y coordina las decisiones. Utiliza el producto para elegir dónde investigar, qué cambio probar y qué resultado justificaría continuar.

### Marketing

Marketing revisa contenido, tono de marca, SEO y publicación. Decide si una versión aporta valor local y cumple las restricciones.

### Operaciones

Operaciones confirma cobertura y capacidad. Puede bloquear o pausar una iniciativa aunque exista demanda.

### Data

Data define métricas, consultas, reglas de identidad, calidad y lectura experimental. Garantiza que el mismo concepto tenga la misma definición en toda la aplicación.

### MarTech

MarTech conecta la web, la analítica, el CMS y el CRM. Comprueba que los eventos y la URL de entrada viajen correctamente entre sistemas.

### Equipo comercial

El equipo comercial explica la calidad de los leads y el recorrido desde oportunidad hasta alta. Ayuda a separar problemas de captación, cualificación y operación.

## 5. Conceptos básicos del dominio

### 5.1 Landing

Una landing es una página web creada para una necesidad concreta. En este producto suele estar asociada a:

- un municipio;
- un servicio;
- un idioma;
- una URL;
- una versión de contenido;
- un estado de publicación.

Ejemplo: una landing de ayuda a domicilio en Valladolid, en castellano.

### 5.2 Sesión

Una sesión es una visita a la web. Una misma persona puede generar varias sesiones. Por eso 1.000 sesiones no significan 1.000 personas diferentes.

### 5.3 Lead

Un lead es un contacto de una familia que ha mostrado interés. Puede proceder de un formulario, una llamada u otro canal. El embudo familiar excluye a las cuidadoras que buscan empleo.

### 5.4 SQL

SQL significa *Sales Qualified Lead*. En este producto se traduce como oportunidad comercial cualificada. Es un lead que el equipo comercial considera una oportunidad real.

No debe confundirse con SQL, el lenguaje utilizado para consultar bases de datos. El contexto permite saber a cuál nos referimos.

### 5.5 Alta

Una alta es una oportunidad familiar que termina contratando un servicio. No significa registrarse en la web.

### 5.6 Embudo

El embudo representa el recorrido:

```text
sesiones → leads → SQL → altas
```

El volumen suele disminuir en cada paso. El producto muestra los totales y las tasas entre pasos para localizar dónde cambia el comportamiento.

### 5.7 Capacidad

La capacidad indica si Qida puede atender la demanda. En la demostración se comprueban:

- cobertura del municipio;
- servicio cubierto;
- cuidadoras disponibles durante los próximos 30 días.

La demanda sin capacidad no se considera una oportunidad accionable.

### 5.8 Atribución y causalidad

La atribución relaciona un resultado con un origen observado. Si un lead conserva la URL de entrada, podemos atribuirlo a esa landing.

La causalidad responde una pregunta más exigente: ¿el cambio en la landing produjo un resultado adicional que no habría ocurrido sin el cambio?

La ficha de landing muestra atribución. La pantalla de Medición añade tratamiento y control para acercarse a una estimación de impacto.

## 6. Recorrido completo con un ejemplo

Imaginemos una combinación sintética de municipio y servicio.

### Paso 1. El motor detecta señales

El motor observa búsquedas mensuales, SQL históricos, altas, cobertura, cuidadoras y temas de llamadas.

La aplicación puede detectar esta situación:

- existe demanda de búsqueda;
- Qida capta pocos SQL comparado con esa demanda;
- existe cobertura;
- hay capacidad suficiente;
- las familias mencionan la necesidad en llamadas.

Esto crea una oportunidad para investigar. Todavía no autoriza a publicar.

### Paso 2. Se comprueba la elegibilidad

La combinación debe cumplir condiciones mínimas:

- datos municipales propios;
- cobertura del servicio;
- al menos seis meses de demanda;
- mínimo operativo de cuidadoras disponibles;
- identidad y actividad comercial utilizables.

Si falla una condición, la oportunidad puede seguir visible, pero aparece como restringida o no elegible.

### Paso 3. Se abre una landing real de demostración

Desde Oportunidades se puede abrir una de las tres versiones visuales de landing. La página utiliza municipio, servicio y capacidad sintética. El formulario simula una conversión, pero no envía datos personales.

### Paso 4. Se publica una versión controlada

En producción, Marketing revisaría el contenido y aprobaría la publicación en Strapi. En la demostración la transición es local y queda registrada.

### Paso 5. Se observa el recorrido

La ficha de landing reúne:

- sesiones;
- formularios y clics para llamar;
- leads;
- SQL;
- altas;
- impresiones y clics de Google;
- capacidad del municipio;
- experimentos relacionados.

### Paso 6. Se compara

La landing se compara con el conjunto filtrado de páginas durante el mismo periodo. La comparación permite localizar si la diferencia aparece en visibilidad, captación, calidad o capacidad.

### Paso 7. Se mide una prueba

Los municipios con el cambio forman el tratamiento. Municipios comparables sin el cambio forman el control. La pantalla calcula la diferencia entre la evolución de ambos grupos.

### Paso 8. Una persona decide

La decisión queda registrada por versión:

- mantener;
- modificar;
- parar.

Ampliar la prueba es una decisión posterior de cartera. No aparece como decisión automática dentro de una landing.

## 7. Pantallas del producto

La navegación principal tiene cinco opciones:

1. Landings;
2. Oportunidades;
3. Medición;
4. Plan de 90 días;
5. Modelo de datos.

Los filtros globales permiten seleccionar fechas, provincia, municipio, servicio, canal e idioma. La vista se actualiza al cambiar cada filtro. Los filtros se guardan en el navegador para mantener el contexto entre pantallas.

## 7.1 Landings

### Qué pregunta responde

¿Cómo está funcionando cada landing y en qué paso del recorrido aparece la diferencia?

### Qué muestra la cabecera

- número de landings;
- sesiones;
- leads familiares;
- SQL;
- altas reconciliadas con CRM.

Los totales respetan los filtros activos.

### Qué representa cada fila

Una fila representa una URL de landing. Muestra:

- municipio, servicio e idioma;
- estado de publicación;
- comparación con páginas equivalentes;
- sesiones;
- tasa sesión a lead;
- tasa lead a SQL;
- tasa SQL a alta.

### Cómo debe interpretarse

Primero se mira el volumen. Después las tasas. Finalmente la comparación.

Una tasa alta con muy pocas sesiones puede ser inestable. Una tasa menor con mucho volumen puede aportar más SQL. Ninguna columna debe interpretarse aislada.

### Búsqueda y paginación

La tabla permite buscar por municipio, servicio o URL. Los resultados están paginados para no cargar todas las landings a la vez.

## 7.2 Ficha de landing

La ficha se abre al seleccionar una fila. Tiene cinco pestañas.

### Resumen

Muestra el embudo y tres tasas comparadas con el conjunto filtrado:

- sesión a lead;
- lead a SQL;
- SQL a alta.

También presenta cuatro puntuaciones comparables entre 0 y 100:

- visibilidad;
- captación;
- calidad;
- operabilidad.

La puntuación resume reglas conocidas. No es una predicción.

### Tráfico y CRM

Separa dos tipos de series:

- sesiones por mes;
- leads, SQL y altas por mes.

También enseña impresiones, clics, porcentaje de clics orgánicos y posición media en Google.

Las series están separadas porque miles de sesiones harían invisibles los valores pequeños de SQL y altas en una misma escala.

### Datos del municipio

Relaciona la landing con el motor de datos mediante municipio y servicio. Muestra:

- cobertura;
- cuidadoras disponibles;
- cumplimiento de capacidad mínima;
- puntuación de oportunidad;
- búsquedas mensuales;
- menciones agregadas en llamadas;
- competidores registrados.

Cada valor muestra su tabla de origen.

### Experimentos

Lista los experimentos en los que participa el municipio. Enseña hipótesis, periodo, método y resultado disponible.

La ficha recuerda que enlazar por URL permite atribuir resultados, pero no demuestra causalidad.

### Cambios y decisiones

Permite comparar el titular y el botón anterior con la versión nueva. La persona registra:

- decisión;
- hipótesis o motivo;
- responsable;
- siguiente revisión;
- versión del registro;
- copia del resultado comercial disponible.

El historial evita evaluar una versión utilizando contenido que todavía no estaba publicado.

### Abrir la landing

La ficha ofrece un enlace a la landing de demostración. En producción sería la URL publicada en qida.es.

## 7.3 Oportunidades

### Qué pregunta responde

¿Qué combinaciones de municipio y servicio merece la pena revisar primero?

### Qué representa una tarjeta

Una tarjeta representa un municipio y un servicio. Incluye:

- elegibilidad;
- procedencia municipal o provincial;
- puntuación;
- búsquedas mensuales;
- SQL;
- altas;
- cuidadoras disponibles;
- meses de demanda;
- señales agregadas de voz del cliente.

### Prioridad y elegibilidad

La prioridad ordena la revisión. La elegibilidad decide si el caso cumple condiciones mínimas para entrar en la prueba.

Una puntuación alta no concede permiso para publicar.

### Ver cálculo

La tarjeta puede desplegarse para mostrar cada factor, su evidencia y su contribución. Esto permite explicar por qué una oportunidad sube o baja.

### Detalle de oportunidad

La página de detalle muestra:

- evidencia de cada regla;
- restricciones;
- versión de reglas;
- estado de elegibilidad;
- versiones disponibles de la landing.

Desde esta página se puede abrir la landing real de demostración.

## 7.4 Medición

### Qué pregunta responde

¿Qué cambio se observó, con qué método y con qué calidad de datos?

### Resumen superior

La pantalla muestra:

- número de experimentos;
- porcentaje de eventos enlazados;
- SQL pendientes de madurar;
- fallos de integridad.

Estos controles aparecen antes del resultado porque determinan si el resultado puede interpretarse.

### Resultado del experimento

Para el experimento seleccionado se muestra:

- cambio estimado;
- municipios tratados;
- municipios de control;
- métrica principal;
- método;
- periodo;
- estado.

### Resultado comercial

La lectura comercial utiliza SQL familiares por municipio y semana. Conserva semanas con cero SQL y revisa:

- diferencia estimada;
- divergencia previa;
- madurez de la ventana;
- tamaño de muestra;
- posible desplazamiento de teléfono o pago.

### Calidad del dato

La tabla distingue:

- eventos enlazados;
- identidades ambiguas;
- SQL pendientes de madurar;
- fallos de integridad.

### Decisiones registradas

Muestra la decisión humana, la landing, el motivo y la versión. Desde la fila se puede volver a la ficha y revisar el cambio exacto.

## 7.5 Plan de 90 días

### Qué pregunta responde

¿Cómo se convierte la primera apuesta en trabajo coordinado?

### Fases

El plan tiene cuatro fases:

1. preparar;
2. publicar;
3. medir exposición;
4. madurar y decidir.

### Calendario

El calendario utiliza un icono de reunión. Al seleccionar una reunión muestra:

- propósito;
- fechas;
- asistentes;
- forma de presentarla;
- decisiones que deben salir;
- información necesaria antes;
- evidencia que debe quedar después;
- restricciones revisadas.

### Acta semanal

La reunión semanal permite guardar:

- estado;
- resumen;
- decisiones;
- acciones;
- responsable;
- fecha de próxima revisión;
- versión del acta.

La API rechaza una edición que intenta sobrescribir una versión más reciente.

### Restricciones y evidencia

La segunda pestaña muestra las seis restricciones del caso, el responsable y la evidencia necesaria para darlas por revisadas.

## 7.6 Modelo de datos

### Flujo

Explica las etapas de la arquitectura y qué llega a cada pantalla. Distingue lo existente, lo simulado y lo propuesto.

### Tablas

Muestra el catálogo de tablas. Cada fila puede desplegarse para ver campos, tipos y definiciones.

### Consultas

Muestra seis consultas de producto. Cada consulta contiene:

- pregunta;
- grano;
- nivel de evidencia;
- endpoint;
- tablas utilizadas;
- uniones;
- métricas y fórmulas;
- SQL;
- resultado ejecutado;
- exclusiones;
- límites;
- componentes donde se muestra.

### Calidad

Muestra actualización por fuente y reglas de integridad. La frescura indica cuánto tiempo ha pasado desde el último dato disponible.

## 7.7 Landing de demostración

La landing se abre fuera del marco del dashboard para que se comporte como una página pública. Existen tres variantes visuales.

La página incluye:

- cabecera y propuesta principal;
- datos locales;
- explicación del servicio;
- pasos de contratación;
- preguntas frecuentes;
- formulario simulado;
- enlace de regreso a la evaluación.

El formulario no almacena ni envía nombre o teléfono. Después de enviarlo aparece una confirmación simulada.

## 8. Métricas del producto

## 8.1 Métricas de volumen

### Sesiones

Visitas cuya URL de entrada es una landing del inventario.

### Leads

Contactos de familias atribuidos a esas landings. Se excluye empleo de cuidadoras.

### SQL

Leads familiares que alcanzan la condición de oportunidad cualificada en CRM.

### Altas

SQL que terminan en un alta reconciliada con CRM.

## 8.2 Tasas del embudo

### Sesión a lead

```text
leads atribuidos / sesiones
```

Ejemplo: 50 leads sobre 1.000 sesiones equivalen a un 5 %.

Ayuda a estudiar la capacidad de captación de la página. No identifica por sí sola si el problema está en contenido, formulario o tráfico.

### Lead a SQL

```text
SQL / leads atribuidos
```

Ejemplo: 20 SQL sobre 50 leads equivalen a un 40 %.

Ayuda a estudiar la calidad comercial de la captación.

### SQL a alta

```text
altas / SQL maduros
```

Ejemplo: 4 altas sobre 20 SQL maduros equivalen a un 20 %.

Solo deben incluirse SQL que hayan tenido tiempo suficiente para convertirse.

## 8.3 Visibilidad orgánica

### Impresiones

Veces que Google muestra una página en resultados. Una impresión no implica un clic.

### Clics orgánicos

Clics recibidos desde resultados no pagados de Google.

### Porcentaje de clics orgánicos

```text
clics / impresiones
```

Ayuda a evaluar si el resultado mostrado por Google atrae clics.

### Posición media

Promedio ponderado de la posición de una página para las búsquedas observadas. Un valor menor suele indicar una posición más alta.

## 8.4 Puntuación de landing

La evaluación utiliza cuatro dimensiones entre 0 y 100.

### Visibilidad

Combina indexación, clics orgánicos y posición media.

### Captación

Compara sesión a lead con el conjunto filtrado.

### Calidad

Compara lead a SQL y SQL a alta con el conjunto filtrado.

### Operabilidad

Comprueba cobertura y cuidadoras disponibles.

La puntuación global resume las cuatro dimensiones con reglas deterministas. Sirve para localizar dónde investigar.

## 8.5 Puntuación de oportunidad

La puntuación combina:

- demanda;
- brecha entre demanda y SQL;
- capacidad;
- voz del cliente;
- margen de conversión.

Una penalización reduce la puntuación cuando hay pocas cuidadoras. Sin cobertura, la puntuación no convierte el caso en elegible.

La versión de reglas queda visible para poder reproducir el resultado.

## 9. Medición de experimentos

## 9.1 Tratamiento y control

El tratamiento contiene municipios que reciben la landing o cambio evaluado. El control contiene municipios comparables que mantienen la experiencia anterior.

Ambos grupos se observan durante las mismas fechas para reducir la confusión con estacionalidad y cambios generales.

## 9.2 Diferencia de diferencias

La aplicación utiliza esta estructura:

```text
(tratamiento después - tratamiento antes)
- (control después - control antes)
```

Ejemplo:

| Grupo | Antes | Después | Cambio |
| --- | ---: | ---: | ---: |
| Tratamiento | 4 | 6 | +2 |
| Control | 5 | 6 | +1 |

El cambio estimado es `+2 - +1 = +1`.

La lectura correcta es: el tratamiento mejoró una unidad más que el control. Para afirmar causalidad todavía necesitamos comparabilidad, muestra suficiente y diagnósticos.

## 9.3 Métrica principal

La primera apuesta utiliza SQL familiares elegibles por municipio y semana.

Un SQL entra si:

- pertenece a una familia;
- su municipio está asignado;
- existe cobertura;
- el servicio está cubierto;
- hay al menos ocho cuidadoras disponibles en la regla actual;
- la identidad no es ambigua;
- no se duplica el mismo lead.

Cada municipio asignado entra en el denominador, incluso durante semanas con cero SQL.

## 9.4 Periodo previo y madurez

La consulta conserva hasta doce semanas previas. Esto permite revisar si tratamiento y control evolucionaban de forma parecida.

Los SQL necesitan 90 días para entrar en SQL a alta. La ventana es una regla explícita de la demostración y debe validarse con el ciclo real de Qida.

## 9.5 Avisos que pueden volver inconcluso un resultado

- faltan semanas previas comunes;
- la ventana posterior todavía no está madura;
- hay pocos municipios;
- la divergencia previa es tan grande como el cambio observado;
- un grupo no tiene SQL maduros;
- disminuyen SQL de teléfono o pago y puede existir desplazamiento entre canales.

Inconcluso no significa fracaso. Significa que la evidencia no permite tomar una decisión fiable.

## 10. Calidad, identidad y privacidad

## 10.1 Evento

Un evento es una acción registrada. Ejemplos:

- sesión;
- formulario;
- clic para llamar;
- creación de lead;
- cualificación como SQL;
- alta.

## 10.2 Evento enlazado

Un evento está enlazado cuando se conecta de forma segura con una persona seudónima o una oportunidad familiar.

```text
eventos enlazados / eventos que deberían poder enlazarse
```

Una cobertura alta indica que el recorrido observado está bien conectado. No demuestra causalidad.

## 10.3 Persona seudónima

Es un identificador técnico sin nombre, teléfono o correo visible. Permite relacionar eventos sin mostrar datos personales directos.

La seudonimización no equivale a anonimización completa. La relación protegida podría volver a identificar a la persona y requiere controles de acceso.

## 10.4 Oportunidad familiar

Representa la necesidad comercial de una familia. Permite reunir varias interacciones y excluir contactos de cuidadoras que buscan empleo.

## 10.5 Identidad ambigua

Dos registros pueden parecer de la misma persona sin existir una coincidencia segura. La regla del producto es conservarlos separados.

Es preferible perder parte de la atribución antes que mezclar recorridos de personas diferentes.

## 10.6 Integridad

La integridad comprueba que los datos respeten las reglas del proceso.

Ejemplos de fallo:

- fecha SQL anterior a creación;
- fecha de alta anterior a SQL;
- alta sin oportunidad familiar válida;
- clic orgánico para una landing no indexada;
- contacto de cuidadora dentro del embudo familiar.

## 10.7 Frescura

La frescura indica cuánto tiempo ha pasado desde la última actualización de cada fuente. Una fuente puede ser correcta pero demasiado antigua para decidir.

## 11. Modelo de datos

## 11.1 Las nueve tablas fuente

| Tabla | Una fila representa | Uso |
| --- | --- | --- |
| `motor_municipio` | Un municipio | Cobertura, capacidad y actividad propia |
| `motor_demanda_busqueda` | Municipio, tema y mes | Demanda estimada en Google |
| `motor_voz_cliente` | Municipio, mes, tema y tipo | Necesidades agregadas de llamadas |
| `motor_competencia` | Municipio y competidor | Servicios y presencia local |
| `landing` | Una URL | Publicación, idioma e indexación |
| `gsc_diario` | Fecha, URL y consulta | Impresiones, clics y posición |
| `web_sesiones_diarias` | Fecha, URL, canal y dispositivo | Sesiones, formularios y llamadas |
| `ads_diario` | Fecha, plataforma y campaña | Inversión y conversiones de plataforma |
| `lead` | Un lead | Recorrido comercial y URL de entrada |

El significado de una fila se llama grano. Comprender el grano evita duplicar datos al unir tablas.

## 11.2 Tablas de extensión

| Tabla | Función |
| --- | --- |
| `identity_map` | Relacionar identificadores de forma determinista |
| `care_opportunity` | Representar la oportunidad familiar común |
| `journey_event` | Conservar eventos web y CRM enlazados |
| `growth_experiment` | Guardar hipótesis, métrica, fechas y método |
| `experiment_assignment` | Persistir tratamiento y control |
| `growth_recommendation` | Guardar puntuación, explicación y versión de reglas |
| `landing_workflow` | Versionar revisión, aprobación y publicación |
| `audit_log` | Registrar acciones y decisiones humanas |
| `synthetic_scenario` | Identificar escenarios de la demostración |
| `seed_run` | Guardar semilla, fecha y huella del conjunto sintético |

Las extensiones no cambian el significado de las nueve tablas originales.

## 11.3 Claves importantes

- La URL relaciona landing, sesiones web, Google y lead de entrada.
- `municipio_id` relaciona motor, oportunidades, leads y experimentos.
- El servicio evita mezclar necesidades diferentes dentro del mismo municipio.
- `experiment_id` relaciona hipótesis, asignaciones y resultados.
- `person_id` y `opportunity_id` relacionan eventos sin mostrar datos personales.

## 12. Las seis consultas de producto

La pantalla Consultas no enseña cada lectura sencilla. Documenta cálculos que combinan fuentes o controlan decisiones.

## 12.1 Puntuación de oportunidad

Pregunta: ¿dónde coinciden demanda, brecha de captación y capacidad?

Produce una fila por municipio y servicio. Se muestra en Oportunidades.

## 12.2 Rendimiento por landing

Pregunta: ¿qué recorrido se atribuye a cada URL y cómo se compara?

Combina landing, web, Google, CRM y capacidad. Se muestra en Landings y su ficha.

## 12.3 Evolución mensual

Pregunta: ¿cómo cambian tráfico y resultados con el tiempo?

Agrupa sesiones, leads, SQL y altas por mes. Se muestra en las gráficas de la ficha.

## 12.4 Cambio de experimento

Pregunta: ¿el tratamiento evolucionó de forma diferente al control?

Combina asignaciones, periodos y métrica. Se muestra en Medición.

## 12.5 Cobertura de trazabilidad

Pregunta: ¿qué parte del recorrido se puede enlazar de forma segura?

Combina identidades, eventos y oportunidades. Se muestra en Medición y Calidad.

## 12.6 Integridad y maduración

Pregunta: ¿los datos son coherentes y han tenido tiempo suficiente?

Combina fechas, relaciones e indexación. Se muestra en Medición y Calidad.

## 13. Arquitectura de la demostración

```text
PostgreSQL
    datos sintéticos persistidos
            ↓
API Express
    consultas y comandos de producto
            ↓
Contratos Zod
    validación de entradas y respuestas
            ↓
React y TanStack Query
    interfaz, estados de carga y caché
```

### PostgreSQL y Prisma

PostgreSQL conserva los datos. Prisma define el esquema y ejecuta migraciones. Las consultas analíticas relevantes se ejecutan como SQL real.

### Express

La API separa módulos de landings, oportunidades, experimentos, recorridos, analítica y sistema.

### Zod

Zod valida los filtros, comandos y respuestas. Si la API devuelve una forma inesperada, la web muestra un error de contrato en vez de utilizar datos incorrectos silenciosamente.

### React

React compone las pantallas. TanStack Query gestiona peticiones, caché, recarga y estados de error.

### Componentes

La interfaz utiliza componentes compartidos para tablas, tarjetas, pestañas, botones, avisos y tooltips. Las métricas importantes incluyen una definición accesible.

## 13.1 Arquitectura objetivo de producción

En producción, Databricks alimentaría las tablas gobernadas. Strapi publicaría landings. HubSpot y Odoo aportarían estados comerciales. Google Search Console, Ads y la analítica web aportarían tráfico y campañas.

La demostración representa esos límites, pero no contiene las conexiones reales.

## 14. Flujo de decisión y gobierno

## 14.1 Decisiones por landing

### Mantener

Conservar la versión y continuar observando.

### Modificar

Preparar una nueva versión basada en una hipótesis concreta.

### Parar

Detener el cambio por resultado, capacidad, calidad o incumplimiento.

La decisión guarda una copia del resultado disponible para evitar que cambie cuando se actualicen datos posteriores.

## 14.2 Ampliar una prueba

Ampliar significa aplicar un patrón a una nueva ola de municipios elegibles. Requiere otra decisión de cartera. No debe ocurrir automáticamente desde una puntuación.

## 14.3 Aprobación de publicación

Una landing pasa por estados:

```text
borrador → pendiente de revisión → aprobada → publicada
```

También puede rechazarse. Publicar exige aprobación humana y deja un registro de auditoría.

## 14.4 Restricciones

El producto debe respetar:

- no publicar precios;
- aportar valor local propio;
- proteger datos personales y consentimiento;
- exigir aprobación de Marketing;
- bloquear afirmaciones sanitarias;
- no captar demanda sin capacidad.

## 15. Plan de 90 días

## Días 1 a 14: preparar

- escribir hipótesis;
- acordar métrica;
- seleccionar municipios;
- asignar tratamiento y control;
- validar seguimiento de eventos;
- registrar el protocolo.

## Días 15 a 28: publicar

- aprobar la primera ola;
- publicar de forma escalonada;
- comprobar indexación;
- comprobar llegada de eventos al CRM;
- vigilar capacidad.

## Días 29 a 56: medir exposición

- revisar tratamiento y control;
- investigar anomalías;
- controlar contaminación;
- presentar avances sin declarar ganador.

## Días 57 a 90: madurar y decidir

- cerrar cohortes;
- ejecutar lectura principal;
- revisar sensibilidad y guardarraíles;
- registrar la decisión.

## 15.1 Reuniones

### Desarrollo semanal

Revisa avance, bloqueos y dudas de implementación.

### Datos y capacidad semanal

Revisa calidad, cobertura y disponibilidad operativa.

### Demostración quincenal

Presenta el incremento de producto y recoge comentarios.

### Aprobación por versión

Marketing decide si una versión puede publicarse.

### Decisiones de los días 30, 60 y 90

Revisan evidencia, restricciones y siguiente paso.

Todas las reuniones deben dejar responsable, acuerdos y próxima revisión.

## 16. Qué demuestra la aplicación y qué no

### La aplicación demuestra

- una interfaz funcional;
- datos sintéticos persistidos;
- métricas procedentes de API;
- consultas SQL ejecutables;
- landings reales de demostración;
- puntuaciones explicables;
- tratamiento y control;
- decisiones versionadas;
- actas semanales persistidas;
- validación de contratos;
- controles de calidad visibles.

### La aplicación no demuestra todavía

- impacto real en SQL o altas de Qida;
- publicación en qida.es;
- integración real con Databricks, Strapi, HubSpot u Odoo;
- significación estadística completa;
- autenticación y permisos productivos;
- control semántico completo de todo texto generado;
- funcionamiento de las landings bajo tráfico real.

## 17. Cómo estudiar el producto como junior

### Ejercicio 1. Leer una landing

1. Abre Landings.
2. Elige una página con sesiones.
3. Identifica el paso con mayor diferencia frente al conjunto comparable.
4. Revisa si existe capacidad.
5. Escribe una hipótesis sin afirmar causalidad.

### Ejercicio 2. Revisar una oportunidad

1. Abre Oportunidades.
2. Despliega el cálculo.
3. Diferencia los factores que aportan y los que penalizan.
4. Comprueba elegibilidad.
5. Abre la landing demo.

### Ejercicio 3. Interpretar un experimento

1. Abre Medición.
2. Identifica métrica y método.
3. Comprueba tratamiento y control.
4. Revisa trazabilidad, madurez e integridad.
5. Lee los avisos antes de decidir.

### Ejercicio 4. Seguir un dato hasta su origen

1. Elige una métrica visible.
2. Abre Modelo de datos y Consultas.
3. Localiza la familia correspondiente.
4. Lee grano, tablas, uniones y fórmula.
5. Comprueba el componente donde se muestra.

### Ejercicio 5. Preparar una reunión

1. Abre Plan de 90 días.
2. Selecciona una reunión.
3. Revisa entradas, agenda y decisiones.
4. Identifica qué restricción valida.
5. Completa un acta semanal sin datos personales.

## 18. Glosario

| Término | Definición |
| --- | --- |
| Alta | Oportunidad que termina contratando un servicio |
| API | Interfaz mediante la que la web solicita datos al servidor |
| Atribución | Relación de un resultado con un origen observado |
| Causalidad | Evidencia de que un cambio produjo un efecto |
| Cohorte | Grupo que comparte fecha o condición |
| Cohorte madura | Grupo que ha tenido tiempo suficiente para producir el resultado |
| Control | Grupo comparable que no recibe el cambio |
| Conversión | Paso de un estado a otro |
| CRM | Sistema que gestiona leads, oportunidades y clientes |
| CTR orgánico | Clics orgánicos divididos por impresiones |
| Dato sintético | Dato inventado de forma controlada para la demostración |
| Determinista | Mismos datos y reglas producen el mismo resultado |
| Elegibilidad | Condiciones mínimas para entrar en una prueba |
| Evento | Acción registrada por un sistema |
| Frescura | Tiempo desde la última actualización |
| Grano | Significado de una fila |
| Guardarraíl | Regla o métrica que no debe empeorar |
| Identidad ambigua | Registros que no pueden unirse con seguridad |
| Indexación | Inclusión de una página en el índice de Google |
| Integridad | Coherencia del dato con las reglas del proceso |
| Landing | Página para una necesidad, servicio o municipio concreto |
| Lead | Contacto de una familia interesada |
| Linaje | Recorrido desde el dato visible hasta su origen |
| Madurez | Tiempo suficiente para observar el resultado |
| Métrica principal | Medida que determina la decisión de la prueba |
| Oportunidad familiar | Caso comercial de una familia que busca cuidados |
| Persona seudónima | Identificador técnico sin datos personales visibles |
| Prioridad | Orden de revisión |
| Sesión | Visita a la web |
| SQL comercial | Lead cualificado como oportunidad real |
| Tratamiento | Grupo que recibe el cambio |
| Trazabilidad | Capacidad de conectar y seguir el recorrido |
| Versión | Estado concreto de contenido o reglas en un momento |

## 19. Documentos relacionados

- [Guía de presentación](./guia-presentacion-prueba-tecnica.md)
- [Auditoría del caso](./case-audit-and-delivery-backlog.md)
- [Presentación](./qida-growth-intelligence.pptx)

La guía de presentación explica cómo contar el producto. La auditoría registra cobertura y trabajo pendiente. Este manual es la fuente principal para comprender cómo funciona.

## 20. Cobertura de los requisitos de la prueba

Esta sección permite comprobar que la propuesta no es solamente una interfaz. Relaciona lo solicitado en el enunciado con la respuesta de producto, la pantalla donde se representa y el límite que todavía debe validarse con datos reales.

### 20.1 Dónde está el valor

| Requisito de la prueba | Respuesta de la propuesta | Dónde se ve | Qué falta validar |
| --- | --- | --- | --- |
| Ordenar las apuestas | Primero se propone mejorar landings ya creadas en municipios donde existe demanda, servicio y capacidad. Después se amplían contenidos o municipios. | Oportunidades y ficha de landing | Validar con Marketing y Operaciones los pesos y umbrales de elegibilidad |
| Estimar impacto en SQL o altas | Cada iniciativa tiene escenarios explícitos. La aplicación separa la estimación del resultado observado para no presentarla como un hecho. | Oportunidades, Medición y auditoría del caso | Sustituir supuestos sintéticos por históricos reales y calcular incertidumbre |
| Explicar dependencias | Marketing aprueba contenido y marca; MarTech instrumenta y publica; Data prepara y valida métricas; Operaciones confirma capacidad. | Plan de 90 días | Nombrar responsables concretos y acordar tiempos de respuesta |
| Explicar qué no se haría | No se escala donde no hay capacidad, no se publican precios ni afirmaciones sanitarias, no se usa información personal y no se automatiza la publicación sin aprobación. | Oportunidades, Plan de 90 días y controles de landing | Validar las reglas con Legal, Marketing y Operaciones |
| Bajar la primera apuesta a 90 días | El plan separa preparación, publicación controlada, lectura temprana y decisión con cohortes maduras. | Plan de 90 días | Ajustar calendario a los ciclos reales de indexación, CRM y equipo |

### 20.2 Cómo se mediría

| Requisito de la prueba | Respuesta de la propuesta | Dónde se ve | Qué falta validar |
| --- | --- | --- | --- |
| Árbol de métricas | Métrica principal: SQL atribuibles y maduros. Métricas intermedias: impresiones, clics, sesiones y leads. Guardarraíles: capacidad, integridad, trazabilidad, consentimiento y canibalización. | Medición y este manual, capítulos 8 a 10 | Acordar una única métrica decisoria por experimento |
| Separar efecto de estacionalidad y otros canales | Se compara el cambio del grupo tratado con el cambio del control mediante diferencia de diferencias y se revisa la evolución previa. | Medición y consulta Cambio de experimento | Añadir intervalos de confianza, potencia y diagnósticos con datos reales |
| Consultas reales | Se documentan seis familias de consultas que combinan demanda, CRM, capacidad, tráfico, experimentos e identidad. | Modelo de datos → Consultas y capítulo 12 | Adaptar nombres y tipos al catálogo real de Databricks |
| Problemas de datos | Se controlan frescura, integridad, madurez, trazabilidad, identidad ambigua, falta de ceros, cambios de URL y poco volumen. | Modelo de datos → Calidad y capítulo 10 | Definir acuerdos de nivel de servicio y alertas operativas |

### 20.3 Cómo se construiría

| Requisito de la prueba | Respuesta de la propuesta | Dónde se ve | Qué falta validar |
| --- | --- | --- | --- |
| Arquitectura de la primera apuesta | El flujo objetivo conecta Databricks, fábrica de landings/Strapi, analítica web, Search Console y CRM con una capa de métricas y decisión. | Modelo de datos → Flujo y capítulo 13 | Implementar conectores, autenticación, permisos y observabilidad |
| Revisión humana | Marketing revisa contenido y marca; Operaciones confirma capacidad; Data valida datos y medición antes de escalar. | Plan de 90 días y ficha de landing | Convertir la matriz de responsabilidad en permisos del sistema |
| Control antes de publicar | Se comprueban capacidad, datos propios, privacidad, consentimiento, expresiones prohibidas, SEO técnico, originalidad local y aprobación. | Ficha de landing, landing demo y capítulo 14 | Conectar los controles al CMS real y conservar evidencias de cada aprobación |
| Vigilancia después de publicar | Se revisan indexación, tráfico, trazabilidad, integridad, embudo, cohortes maduras y guardarraíles. | Medición y reuniones del Plan de 90 días | Crear alertas y umbrales calibrados con el histórico real |
| Parte delicada del sistema | La parte más sensible es decidir si una landing es elegible, publicar una versión controlada y atribuir resultados sin exponer datos personales ni afirmar causalidad antes de tiempo. | Consultas, Calidad y auditoría del caso | Completar las comprobaciones semánticas y estadísticas de producción |

### 20.4 Respuesta resumida al reto

La propuesta explota los activos existentes sin volver a construirlos. El motor de datos sigue siendo la fuente de contexto local y la fábrica sigue generando las páginas. Qida Growth Intelligence añade cuatro capacidades que faltaban:

1. relacionar cada landing con su demanda, cobertura, capacidad y resultado comercial;
2. priorizar únicamente oportunidades que Qida puede atender;
3. medir cambios con trazabilidad, grupo de comparación y tiempo de maduración;
4. registrar la decisión, sus responsables y el aprendizaje reutilizable.

La demostración prueba que ese flujo puede representarse en un producto coherente. No prueba todavía que una landing concreta genere impacto real: esa conclusión exige conectar los sistemas de producción y ejecutar el plan de medición.

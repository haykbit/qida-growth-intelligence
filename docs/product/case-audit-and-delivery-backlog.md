# Auditoría de entrega del caso Qida

**Revisión del 16 de noviembre de 2026.** La entrega responde a las tres preguntas del reto sobre inversión, medición y construcción de la primera apuesta. La demo permite elegir un municipio, abrir un cambio de landing, comparar sus SQL con un control y guardar la decisión y su seguimiento semanal. Los datos son sintéticos y la publicación es simulada.

## Requisitos y evidencia

| CASE | Requisito | Qué se puede comprobar |
| --- | --- | --- |
| 000 | Auditoría del reto | Esta revisión cubre los 13 tickets. El [manual de producto](manual-producto-qida-growth-intelligence.md#20-cobertura-de-los-requisitos-de-la-prueba) relaciona la propuesta con los requisitos y restricciones del enunciado. |
| 001–002 | Prioridad e impacto | La primera apuesta son las landings locales elegibles. El modelo calcula tres escenarios para cuatro iniciativas. Con diez municipios y seis meses estima **83,2–538,6 SQL** para landings y **0 SQL directos** para trazabilidad. Son supuestos recalculables. [Modelo y escenarios](http://localhost:3000/api/v1/strategy) |
| 003–004 | Experimento y selección | El manual fija hipótesis, unidad municipio-semana, madurez y criterios para seguir, modificar o parar. La selección excluye empleo de cuidadoras y comprueba datos propios, cobertura del servicio, seis meses de demanda y ocho cuidadoras disponibles. [Medición de experimentos](manual-producto-qida-growth-intelligence.md#9-medición-de-experimentos) · [Consultas de la aplicación](http://localhost:5173/data-model) |
| 005 | Medición frente al control | La consulta cuenta SQL por fecha de cualificación, conserva municipios con cero SQL y calcula altas sobre cohortes maduras. Muestra doce semanas previas, tratamiento y control, divergencia previa y posible canibalización entre canales. [Consulta ejecutada](../../apps/api/src/repositories/experiment-sql.ts) · [Medición](http://localhost:5173/measurement) |
| 006–007 | Arquitectura y publicación | Están definidos contratos, responsables y revisión humana. La API comprueba datos propios, cobertura, capacidad y expresiones prohibidas antes de aprobar. La publicación simulada exige aprobación y deja registro. [Arquitectura y gobierno](manual-producto-qida-growth-intelligence.md#13-arquitectura-de-la-demostración) · [Implementación](../../apps/api/src/repositories/prisma-growth-repository.ts) |
| 008 | Revisión semanal | Cada sesión admite actas versionadas y acciones con responsable, estado, próxima revisión y decisión relacionada. Se verificaron la persistencia tras recarga y el rechazo de ediciones simultáneas incompatibles. [Plan de 90 días → Revisión semanal](http://localhost:5173/planning) |
| 009–010 | Recorrido de landing a decisión | Desde Medición se abren el titular y el botón anteriores y nuevos, la hipótesis y el experimento. Al registrar la siguiente decisión se guardan responsable, fecha, motivo y una copia de la lectura disponible. [Abrir el cambio de Zaragoza](http://localhost:5173/landing?url=%2Fcuidados%2Fzaragoza-50297&decision=audit-decision-0001) |
| 011 | Asistente IA con citas | **Pendiente.** El acta se redacta manualmente. Faltan el borrador generado, la comprobación de cifras y citas y su aprobación editorial. |
| 012 | Entrega y presentación | El manual consolida la explicación profunda del producto y la guía contiene únicamente el orden, el discurso y la demostración. [Manual](manual-producto-qida-growth-intelligence.md) · [Guía de presentación](guia-presentacion-prueba-tecnica.md) · [Presentación](qida-growth-intelligence.pptx) |

## Resultado demostrado

**Zaragoza queda inconcluso.** En el corte sintético del 30 de noviembre hay un municipio tratado, uno de control y ninguna semana posterior madura. En el experimento de propuesta de valor local sí se calcula **+0,071 SQL por municipio-semana**. La divergencia previa supera o iguala ese cambio y hay señales de desplazamiento en teléfono y pago. Ninguno de los dos resultados justifica escalar. [Piloto de Zaragoza](http://localhost:5173/measurement?experiment=pilot-zaragoza-cta) · [Propuesta de valor local](http://localhost:5173/measurement?experiment=exp-landing-value-proposition)

El 16 de noviembre pasaron **51 pruebas automatizadas y 3 de navegador**. Estas últimas recorren versiones y evidencia comercial, el acta semanal en móvil y las consultas del modelo. [Pruebas de navegador](../../tests/e2e/smoke.spec.ts) · [Pruebas de madurez y cálculo](../../apps/api/test/experiment-sql.test.ts)

## Qué queda para el cierre completo

- **Validación humana.** Aprobar responsabilidades, límites de exposición y diseño de pantallas, conciliar el rango ilustrativo del resumen con el modelo y documentar el ensayo de presentación.
- **Medición y seguimiento.** Validar potencia e instrumentación por versión antes del lanzamiento real. El seguimiento semanal asigna responsables por acción. Queda exigirlo para cada cambio y permitir bajar de cada cifra a sus registros.
- **Producción.** Conectar Databricks, Strapi y CRM. Completar controles semánticos de precios y afirmaciones sanitarias, procedencia de cifras, consentimiento, datos personales, originalidad local y SEO técnico. [Gobierno y restricciones](manual-producto-qida-growth-intelligence.md#14-flujo-de-decisión-y-gobierno)

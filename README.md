# Qida Growth Intelligence

[![Calidad](https://github.com/haykbit/qida-growth-intelligence/actions/workflows/ci.yml/badge.svg)](https://github.com/haykbit/qida-growth-intelligence/actions/workflows/ci.yml)
[![Demo](https://github.com/haykbit/qida-growth-intelligence/actions/workflows/pages.yml/badge.svg)](https://haykbit.github.io/qida-growth-intelligence/)

Qida Growth Intelligence es una propuesta para explotar conjuntamente dos activos que Qida ya ha construido: el motor de datos municipal y la fábrica de landings. El producto relaciona cada landing con su contexto local, su rendimiento web y comercial, los cambios realizados y las decisiones tomadas después.

## Ver la demostración

**[Abrir Qida Growth Intelligence](https://haykbit.github.io/qida-growth-intelligence/)**

La demostración de GitHub Pages funciona con una captura reproducible de datos sintéticos guardada en JSON. No contiene información real de familias ni cuidadoras. Las decisiones y actas creadas durante la visita se conservan únicamente en el navegador.

## Qué permite revisar

- El rendimiento de cada landing desde sesiones hasta SQL y altas.
- La demanda, cobertura y capacidad del municipio asociado.
- Las combinaciones de municipio y servicio que merece la pena analizar.
- Los experimentos, su trazabilidad y su grado de madurez.
- El plan de trabajo, las reuniones y los controles de los primeros 90 días.
- Las tablas, uniones y consultas que producen las métricas relevantes.

La aplicación diferencia siempre entre descripción, atribución y evidencia causal. Las puntuaciones sirven para ordenar revisiones; no son predicciones estadísticas.

## Documento de producto

El [documento de producto](docs/product/manual-producto-qida-growth-intelligence.md) explica la propuesta de forma ejecutiva: idea, partes del producto, datos, métricas, consultas, planificación y límites.

## Cómo está construido

```text
Navegador
   ├─ GitHub Pages: React + JSON sintético versionado
   └─ Producto completo: React → API Express → PostgreSQL
                                      ├─ Prisma
                                      ├─ contratos Zod
                                      └─ lógica analítica versionada
```

GitHub Pages publica solamente la demostración estática. El repositorio conserva la API, el modelo relacional, las migraciones, la generación determinista de datos, las consultas SQL y las pruebas para mostrar cómo se construiría el producto completo.

## Estructura del repositorio

| Ruta | Responsabilidad |
| --- | --- |
| `apps/web` | Interfaz React, componentes y adaptación para la demo estática |
| `apps/api` | API Express, OpenAPI y repositorios de acceso a datos |
| `packages/contracts` | Contratos compartidos y validación con Zod |
| `packages/analytics` | Métricas, puntuaciones y modelo de impacto |
| `prisma` | Esquema PostgreSQL, migraciones y datos sintéticos deterministas |
| `scripts` | Validación del dataset y exportación de la captura estática |
| `infra` | Docker, Kubernetes local y configuración de infraestructura |
| `docs` | Documento de producto y anexos técnicos ordenados por función |

## Calidad y seguridad

Cada cambio en `main` ejecuta:

- lint;
- comprobación estricta de tipos;
- pruebas unitarias y de integración;
- validación de los datos sintéticos;
- compilación de la aplicación completa;
- compilación independiente del modo GitHub Pages.

El repositorio no contiene datos personales reales ni secretos. La identidad es seudónima y determinista, las identidades ambiguas permanecen separadas y la publicación de landings está simulada y exige una transición de aprobación humana.

## Límites de la demostración

- Los datos y resultados son sintéticos; no representan el rendimiento real de Qida.
- Las estimaciones de impacto son supuestos de planificación.
- GitHub Pages no ejecuta el servidor ni PostgreSQL.
- Las operaciones de escritura de la demo son locales y se pueden perder al limpiar el navegador.
- La versión de producción necesitaría SSO, permisos, secretos gestionados, monitorización e integraciones reales con Databricks, Strapi y CRM.

## Documentación

El índice completo está en [`docs/README.md`](docs/README.md).

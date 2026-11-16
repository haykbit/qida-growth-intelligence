# Qida Landing Intelligence — contrato de diseño

Este documento define el sistema visual aplicado a la aplicación. Su objetivo es evitar que nuevas pantallas vuelvan al patrón de dashboard genérico o a decisiones visuales improvisadas.

## Dirección

La interfaz es un observatorio de rendimiento, no una herramienta que ordena qué debe hacer el equipo. Debe sentirse sobria, precisa y permitir que Marketing, Growth, Operaciones y Data lean la misma evidencia.

- Fondo gris frío y superficies blancas.
- Azul tinta para estructura y acciones principales.
- Verde para acciones que pueden activarse, ámbar para investigación y rojo para bloqueos.
- Una sola familia tipográfica: Manrope.
- Una única pieza dominante por pantalla; el resto ordena evidencia.
- Bordes de 10 px, sombras mínimas y densidad media.

## Escala y espaciado

| Uso | Tamaño | Peso |
| --- | ---: | ---: |
| Hero | 48 px escritorio / 36 px móvil | 600 |
| Título de página | 36 px | 600 |
| Título de sección | 20 px | 600 |
| Título de componente | 16–18 px | 600 |
| Cuerpo | 16 px | 400 |
| UI / tabla | 14 px | 400–600 |
| Contexto | 12 px | 400–600 |

La unidad de espacio es 4 px. Los saltos normales son 8, 12, 16, 20, 24 y 32 px. Una sección principal usa 32 px; una card usa 24 px; elementos relacionados usan 8–12 px.

## Números

- Todos los números usan `Intl.NumberFormat("es-ES")`.
- Las cifras en columnas usan numerales tabulares.
- Porcentajes: una cifra decimal como máximo.
- Un rango de escenario se muestra como `+12–+24 SQL`, nunca como un punto exacto.
- Toda cifra debe indicar periodo, denominador o base de comparación.
- “Atribuido” y “causal” nunca se usan como sinónimos.

## Componentes

Se siguen las composiciones de Shadcn/Radix presentes en `@qida/ui`:

- `Card` siempre usa `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` y, si procede, `CardFooter`.
- `Tabs` separa diagnóstico, activación y medición; no oculta acciones equivalentes.
- `Table` se usa para comparar entidades; las cards no reemplazan tablas por decoración.
- `Alert` reserva una decisión, restricción o límite de lectura.
- `Progress` solo representa escalas reales de 0 a 100.
- `Badge` expresa estado o evidencia, nunca texto ornamental.
- Los filtros viven en una hoja flotante derecha y no alteran el ancho del contenido.

## Jerarquía de las pantallas

1. Entidad y estado de los datos.
2. Lectura descriptiva del patrón.
3. Evidencia cuantitativa.
4. Origen y comparación.
5. Limitación de interpretación.

No se usan textos promocionales, llamadas a la acción que prescriben una decisión, mayúsculas decorativas, cards idénticas para cada fragmento, iconos sin significado ni scores sin explicación.

## Accesibilidad y responsive

- Estados de foco visibles y contraste AA.
- Botones con nombre accesible; estados no dependen solo del color.
- Tablas permiten desplazamiento horizontal.
- A partir de móvil, las columnas se apilan conservando primero decisión y después evidencia.
- Las animaciones respetan el movimiento reducido; la interfaz no necesita movimiento para entenderse.

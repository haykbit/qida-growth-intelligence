export const integer = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
export const decimal = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
export const percent = new Intl.NumberFormat("es-ES", { style: "percent", maximumFractionDigits: 1 });
export const currency = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
export const shortDate = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" });
export const dateTime = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function formatDate(value: string): string {
  return shortDate.format(new Date(value));
}

export function formatDateTime(value: string): string {
  return dateTime.format(new Date(value));
}

export function titleCase(value: string): string {
  const labels: Record<string, string> = { ambiguous: "Ambigua", confirmed: "Confirmada", high: "Alto", low: "Bajo", medium: "Medio", unlinked: "Sin enlazar" };
  if (labels[value]) return labels[value];
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

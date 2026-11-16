const localeInteger = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
export const integer = {
  format(value: number): string {
    const rounded = Math.round(value);
    const absolute = Math.abs(rounded);
    if (absolute >= 1000 && absolute < 10_000) {
      const sign = rounded < 0 ? "−" : "";
      return `${sign}${Math.floor(absolute / 1000)}.${String(absolute % 1000).padStart(3, "0")}`;
    }
    return localeInteger.format(rounded);
  },
};
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
  const labels: Record<string, string> = {
    acompanamiento: "Acompañamiento",
    ayuda_domicilio: "Ayuda a domicilio",
    cuidado_personas_mayores: "Cuidado de personas mayores",
    ambiguous: "Ambigua",
    confirmed: "Confirmada",
    discarded: "Descartada",
    high: "Alto",
    low: "Bajo",
    medium: "Medio",
    open: "Abierta",
    unlinked: "Sin enlazar",
  };
  if (labels[value]) return labels[value];
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

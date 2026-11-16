import snapshotJson from "../demo/static-snapshot.json";

type JsonObject = Record<string, unknown>;
type ListSnapshot = {
  items: JsonObject[];
  page: number;
  pageSize: number;
  total: number;
};
type FilterSnapshot = {
  municipalities: Array<{ id: string; name: string; province?: string }>;
};
type LandingTotals = {
  landings: number;
  published: number;
  sessions: number;
  leads: number;
  sql: number;
  altas: number;
};
type StaticSnapshot = {
  filters: FilterSnapshot & JsonObject;
  landings: ListSnapshot;
  landingDetails: Record<string, JsonObject>;
  opportunities: ListSnapshot;
  opportunityDetails: Record<string, JsonObject>;
  learning: JsonObject;
  dataQuality: JsonObject;
  workbench: JsonObject;
  governance: JsonObject;
  planning: JsonObject;
  experimentDetails: Record<string, JsonObject>;
  experimentSql: Record<string, JsonObject>;
};

const snapshot = snapshotJson as unknown as StaticSnapshot;
const decisionStorageKey = "qida-static-demo-decisions";
const weeklyStorageKey = "qida-static-demo-weekly-notes";

function value(object: JsonObject, key: string): string {
  const candidate = object[key];
  return typeof candidate === "string" ? candidate : "";
}

function storedObjects(key: string): JsonObject[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is JsonObject => typeof item === "object" && item !== null)
      : [];
  } catch {
    return [];
  }
}

function saveObjects(key: string, items: JsonObject[]): void {
  window.localStorage.setItem(key, JSON.stringify(items));
}

function parseBody(init?: RequestInit): JsonObject {
  if (typeof init?.body !== "string") return {};
  const parsed: unknown = JSON.parse(init.body);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("El cuerpo de la petición no es válido.");
  }
  return parsed as JsonObject;
}

function paginate(items: JsonObject[], search: URLSearchParams): ListSnapshot {
  const page = Math.max(1, Number(search.get("page") ?? 1));
  const pageSize = Math.max(1, Number(search.get("pageSize") ?? 12));
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length };
}

function numberValue(object: JsonObject, key: string): number {
  const candidate = object[key];
  return typeof candidate === "number" ? candidate : 0;
}

function landingList(search: URLSearchParams): ListSnapshot & { totals: LandingTotals } {
  const items = filterLandings(search);
  const totals = items.reduce<LandingTotals>(
    (result, item) => ({
      landings: result.landings + 1,
      published: result.published + (value(item, "status") === "published" ? 1 : 0),
      sessions: result.sessions + numberValue(item, "sessions"),
      leads: result.leads + numberValue(item, "leads"),
      sql: result.sql + numberValue(item, "sql"),
      altas: result.altas + numberValue(item, "altas"),
    }),
    { landings: 0, published: 0, sessions: 0, leads: 0, sql: 0, altas: 0 },
  );
  return { ...paginate(items, search), totals };
}

function municipalityProvince(municipalityId: string): string {
  return snapshot.filters.municipalities.find((item) => item.id === municipalityId)?.province ?? "";
}

function filterLandings(search: URLSearchParams): JsonObject[] {
  const query = (search.get("search") ?? "").trim().toLocaleLowerCase("es");
  return snapshot.landings.items.filter((item) => {
    const municipalityId = value(item, "municipalityId");
    const haystack = [value(item, "url"), value(item, "municipality"), value(item, "service")]
      .join(" ")
      .toLocaleLowerCase("es");
    return (
      (!search.get("province") || municipalityProvince(municipalityId) === search.get("province")) &&
      (!search.get("municipality") || municipalityId === search.get("municipality")) &&
      (!search.get("service") || value(item, "service") === search.get("service")) &&
      (!search.get("language") || value(item, "language") === search.get("language")) &&
      (!query || haystack.includes(query))
    );
  });
}

function filterOpportunities(search: URLSearchParams): JsonObject[] {
  const query = (search.get("search") ?? "").trim().toLocaleLowerCase("es");
  return snapshot.opportunities.items.filter((item) => {
    const haystack = [value(item, "municipality"), value(item, "province"), value(item, "service")]
      .join(" ")
      .toLocaleLowerCase("es");
    return (
      (!search.get("province") || value(item, "province") === search.get("province")) &&
      (!search.get("municipality") || value(item, "municipalityId") === search.get("municipality")) &&
      (!search.get("service") || value(item, "service") === search.get("service")) &&
      (!query || haystack.includes(query))
    );
  });
}

function decodeSegment(segment: string | undefined): string {
  return decodeURIComponent(segment ?? "");
}

function normalizeService(service: string): string {
  return service
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function opportunityDetail(municipalityId: string, service: string): JsonObject {
  const requestedService = normalizeService(service);
  const entry = Object.entries(snapshot.opportunityDetails).find(([key]) => {
    const separator = key.indexOf("::");
    const keyMunicipality = key.slice(0, separator);
    const keyService = key.slice(separator + 2);
    return keyMunicipality === municipalityId && normalizeService(keyService) === requestedService;
  });
  if (!entry) throw new Error(`No existe la oportunidad ${municipalityId}::${service} en la captura estática.`);
  return entry[1];
}

function landingDetail(url: string): JsonObject {
  const detail = snapshot.landingDetails[url];
  if (!detail) throw new Error(`No existe la landing ${url} en la captura estática.`);
  const localDecisions = storedObjects(decisionStorageKey).filter((item) => value(item, "url") === url);
  const decisions = Array.isArray(detail.decisions) ? detail.decisions : [];
  return { ...detail, decisions: [...decisions, ...localDecisions] };
}

function learning(): JsonObject {
  const localDecisions = storedObjects(decisionStorageKey);
  const decisions = Array.isArray(snapshot.learning.decisions) ? snapshot.learning.decisions : [];
  const totals =
    typeof snapshot.learning.totals === "object" && snapshot.learning.totals !== null
      ? (snapshot.learning.totals as JsonObject)
      : {};
  return {
    ...snapshot.learning,
    decisions: [...decisions, ...localDecisions],
    totals: { ...totals, decisions: Number(totals.decisions ?? decisions.length) + localDecisions.length },
  };
}

function recordDecision(url: string, init?: RequestInit): JsonObject {
  const input = parseBody(init);
  const existing = storedObjects(decisionStorageKey);
  const record = {
    ...input,
    url,
    id: `demo-decision-${Date.now()}`,
    version: existing.filter((item) => value(item, "url") === url).length + 1,
    actorRole: "growth_manager",
    createdAt: new Date().toISOString(),
  };
  saveObjects(decisionStorageKey, [...existing, record]);
  return record;
}

function weeklyHistory(date: string): JsonObject[] {
  return storedObjects(weeklyStorageKey).filter((item) => value(item, "date") === date);
}

function saveWeekly(init?: RequestInit): JsonObject {
  const note = parseBody(init);
  const existing = storedObjects(weeklyStorageKey);
  const withoutRevision = existing.filter(
    (item) => !(value(item, "date") === value(note, "date") && item.revision === note.revision),
  );
  saveObjects(weeklyStorageKey, [...withoutRevision, note]);
  return note;
}

export async function staticDemoRequest(path: string, init?: RequestInit): Promise<unknown> {
  const url = new URL(path, "https://demo.qida.local");
  const segments = url.pathname.split("/").filter(Boolean);
  const method = init?.method ?? "GET";

  if (url.pathname === "/filters") return snapshot.filters;
  if (url.pathname === "/landing-insights") return landingList(url.searchParams);
  if (url.pathname === "/opportunities") return paginate(filterOpportunities(url.searchParams), url.searchParams);
  if (url.pathname === "/learning") return learning();
  if (url.pathname === "/data-quality") return snapshot.dataQuality;
  if (url.pathname === "/workbench") return snapshot.workbench;
  if (url.pathname === "/governance") return snapshot.governance;
  if (url.pathname === "/planning") return snapshot.planning;

  if (segments[0] === "landing-insights" && segments[1]) {
    const landingUrl = decodeSegment(segments[1]);
    if (segments[2] === "decisions" && method === "POST") return recordDecision(landingUrl, init);
    return landingDetail(landingUrl);
  }

  if (segments[0] === "opportunities" && segments[1] && segments[2]) {
    return opportunityDetail(decodeSegment(segments[1]), decodeSegment(segments[2]));
  }

  if (segments[0] === "experiments" && segments[1]) {
    const id = decodeSegment(segments[1]);
    const result = segments[2] === "sql" ? snapshot.experimentSql[id] : snapshot.experimentDetails[id];
    if (!result) throw new Error(`No existe el experimento ${id} en la captura estática.`);
    return result;
  }

  if (segments[0] === "planning" && segments[1] === "weekly" && segments[2]) {
    return method === "POST" ? saveWeekly(init) : weeklyHistory(decodeSegment(segments[2]));
  }

  throw new Error(`La captura estática no implementa ${method} ${url.pathname}.`);
}

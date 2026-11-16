import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = process.env.QIDA_API_URL ?? "http://localhost:3000/api/v1";
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(CURRENT_DIR, "../apps/web/src/demo/static-snapshot.json");

async function get(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`GET ${path} returned ${response.status}`);
  }
  return response.json();
}

async function collect(path, pageSize = 100) {
  const first = await get(`${path}?page=1&pageSize=${pageSize}`);
  const items = [...first.items];
  const pages = Math.ceil(first.total / pageSize);
  for (let page = 2; page <= pages; page += 1) {
    const next = await get(`${path}?page=${page}&pageSize=${pageSize}`);
    items.push(...next.items);
  }
  return { items, page: 1, pageSize, total: first.total };
}

async function mapConcurrent(items, worker, concurrency = 16) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

const [filters, landings, opportunities, learning, dataQuality, workbench, governance, planning] =
  await Promise.all([
    get("/filters"),
    collect("/landing-insights"),
    collect("/opportunities"),
    get("/learning"),
    get("/data-quality"),
    get("/workbench"),
    get("/governance"),
    get("/planning"),
  ]);

const landingDetails = Object.fromEntries(
  await mapConcurrent(landings.items, async (landing) => [
    landing.url,
    await get(`/landing-insights/${encodeURIComponent(landing.url)}`),
  ]),
);

const opportunityDetails = Object.fromEntries(
  await mapConcurrent(opportunities.items, async (opportunity) => [
    `${opportunity.municipalityId}::${opportunity.service}`,
    await get(
      `/opportunities/${encodeURIComponent(opportunity.municipalityId)}/${encodeURIComponent(opportunity.service)}`,
    ),
  ]),
);

const experimentDetails = Object.fromEntries(
  await mapConcurrent(learning.experiments, async (experiment) => [
    experiment.id,
    await get(`/experiments/${encodeURIComponent(experiment.id)}`),
  ]),
);

const experimentSql = Object.fromEntries(
  await mapConcurrent(learning.experiments, async (experiment) => [
    experiment.id,
    await get(`/experiments/${encodeURIComponent(experiment.id)}/sql`),
  ]),
);

const snapshot = {
  metadata: {
    mode: "static_demo",
    source: "qida-synthetic-v2",
    exportedAt: new Date().toISOString(),
    notice:
      "Captura reproducible con datos sintéticos. Las escrituras de la demo se conservan únicamente en el navegador.",
  },
  filters,
  landings,
  landingDetails,
  opportunities,
  opportunityDetails,
  learning,
  dataQuality,
  workbench,
  governance,
  planning,
  experimentDetails,
  experimentSql,
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(snapshot)}\n`, "utf8");
console.log(
  `Static demo exported to ${OUTPUT}: ${landings.total} landings, ${opportunities.total} opportunities and ${learning.experiments.length} experiments.`,
);

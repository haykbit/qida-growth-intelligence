export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Qida Growth Intelligence API",
    version: "0.1.0",
    description: "Persisted synthetic growth intelligence. Attribution is descriptive unless an experiment explicitly passes diagnostics.",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { LocalRole: { type: "apiKey", in: "header", name: "x-local-role" } },
    schemas: {
      Error: {
        type: "object", required: ["error"], properties: { error: { type: "object", required: ["code", "message", "requestId"], properties: {
          code: { type: "string" }, message: { type: "string" }, details: {}, requestId: { type: "string" },
        } } },
      },
      AuditMutation: { type: "object", required: ["landing", "auditId"], properties: { landing: { type: "object" }, auditId: { type: "string", format: "uuid" } } },
    },
    parameters: {
      From: { name: "from", in: "query", schema: { type: "string", format: "date" } },
      To: { name: "to", in: "query", schema: { type: "string", format: "date" } },
      Province: { name: "province", in: "query", schema: { type: "string", maxLength: 100 } },
      Municipality: { name: "municipalityId", in: "query", schema: { type: "string", maxLength: 32 } },
      Service: { name: "service", in: "query", schema: { type: "string", maxLength: 100 } },
      Channel: { name: "channel", in: "query", schema: { type: "string", maxLength: 100 } },
      Language: { name: "language", in: "query", schema: { type: "string", enum: ["es", "ca"] } },
      Page: { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
      PageSize: { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
    },
  },
  paths: {
    "/health": { get: { summary: "Liveness and database status", responses: { "200": { description: "Healthy" }, "503": { description: "Database unavailable" } } } },
    "/filters": { get: { summary: "Global filter options", responses: { "200": { description: "Filter options" } } } },
    "/overview": { get: { summary: "Executive KPIs and breakdowns", parameters: commonFilters(), responses: ok() } },
    "/opportunities": { get: { summary: "Ranked municipality/service opportunities", parameters: pagedFilters(), responses: ok() } },
    "/opportunities/{municipalityId}/{service}": { get: { summary: "Explain one opportunity", parameters: [path("municipalityId"), path("service")], responses: ok() } },
    "/journeys": { get: { summary: "Search synthetic journeys", parameters: [...pagedFilters(), { name: "search", in: "query", schema: { type: "string", maxLength: 100 } }], responses: ok() } },
    "/journeys/{opportunityId}": { get: { summary: "Journey timeline and attribution views", parameters: [path("opportunityId")], responses: ok() } },
    "/funnels": { get: { summary: "Mature cohort funnel analytics", parameters: commonFilters(), responses: ok() } },
    "/landings": { get: { summary: "Landing inventory and performance", parameters: pagedFilters(), responses: ok() } },
    "/landing-insights": { get: { summary: "Landing performance portfolio with attributed funnel and diagnosis", parameters: pagedFilters(), responses: ok() } },
    "/landing-insights/{url}": { get: { summary: "One landing learning loop with monthly outcomes, experiments and decisions", parameters: [path("url"), ...commonFilters()], responses: ok() } },
    "/landing-insights/{url}/decisions": { post: { summary: "Record a human landing decision in the audit trail", parameters: [path("url")], requestBody: jsonBody(), responses: mutationResponses() } },
    "/landings/drafts": { post: { summary: "Generate deterministic local draft", requestBody: jsonBody(), responses: mutationResponses() } },
    "/landings/{url}/review": { post: { summary: "Validate and enter review", parameters: [path("url")], requestBody: jsonBody(), responses: mutationResponses() } },
    "/landings/{url}/approve": { post: { summary: "Human approval", security: [{ LocalRole: [] }], parameters: [path("url")], requestBody: jsonBody(), responses: mutationResponses() } },
    "/landings/{url}/publish": { post: { summary: "Simulated publication after approval", security: [{ LocalRole: [] }], parameters: [path("url")], responses: mutationResponses() } },
    "/seo": { get: { summary: "SEO and landing performance", parameters: commonFilters(), responses: ok() } },
    "/ads": { get: { summary: "Platform and CRM-reconciled paid media", parameters: commonFilters(), responses: ok() } },
    "/experiments": { get: { summary: "Experiment registry and evaluated results", parameters: pagedFilters(), responses: ok() } },
    "/experiments/{id}": { get: { summary: "Experiment assignments, series and DiD diagnostics", parameters: [path("id")], responses: ok() } },
    "/experiments/{id}/sql": { get: { summary: "Eligible family SQL by assigned municipality and week", parameters: [path("id")], responses: ok() } },
    "/planning/weekly/{date}": { get: { summary: "Weekly meeting revision history", parameters: [path("date")], responses: ok() }, post: { summary: "Append a weekly meeting revision with assigned actions", parameters: [path("date")], requestBody: jsonBody(), responses: { "201": { description: "Saved" }, "409": { description: "Revision conflict" } } } },
    "/learning": { get: { summary: "Accumulated experiment and landing-decision learning", responses: ok() } },
    "/data-quality": { get: { summary: "Quality, traceability, integrity and discrepancy checks", responses: ok() } },
    "/strategy": { get: { summary: "Synthetic scenario planning with editable bounded assumptions", parameters: [
      { name: "scenario", in: "query", schema: { type: "string", enum: ["conservative", "base", "optimistic"], default: "base" } },
      { name: "demandCaptureRate", in: "query", schema: { type: "number", minimum: 0, maximum: 0.2 } },
      { name: "leadToSqlRate", in: "query", schema: { type: "number", minimum: 0, maximum: 1 } },
      { name: "sqlToAltaRate", in: "query", schema: { type: "number", minimum: 0, maximum: 1 } },
      { name: "capacityUtilization", in: "query", schema: { type: "number", minimum: 0, maximum: 1 } },
      { name: "months", in: "query", schema: { type: "integer", minimum: 1, maximum: 24, default: 6 } },
      { name: "marketLimit", in: "query", schema: { type: "integer", minimum: 1, maximum: 30, default: 10 } },
    ], responses: ok() } },
    "/workbench": { get: { summary: "Metric-producing SQL used by the product, with formulas, consumers and sample results", responses: ok() } },
    "/governance": { get: { summary: "Architecture stages, ownership, integration modes and controls", responses: ok() } },
    "/planning": { get: { summary: "Versioned 90-day operating calendar, meeting formats and policy controls", responses: ok() } },
    "/openapi.json": { get: { summary: "This OpenAPI document", responses: ok() } },
  },
} as const;

function ref(name: string): { $ref: string } { return { $ref: `#/components/parameters/${name}` }; }
function commonFilters(): Array<{ $ref: string }> { return ["From", "To", "Province", "Municipality", "Service", "Channel", "Language"].map(ref); }
function pagedFilters(): Array<{ $ref: string }> { return [...commonFilters(), ref("Page"), ref("PageSize")]; }
function path(name: string) { return { name, in: "path", required: true, schema: { type: "string", maxLength: 500 } }; }
function ok() { return { "200": { description: "Successful response" }, "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } } }; }
function jsonBody() { return { required: false, content: { "application/json": { schema: { type: "object" } } } }; }
function mutationResponses() { return { "200": { description: "Audited transition", content: { "application/json": { schema: { $ref: "#/components/schemas/AuditMutation" } } } }, "403": { description: "Role forbidden" }, "409": { description: "Invalid transition" }, "422": { description: "Policy failed" } }; }

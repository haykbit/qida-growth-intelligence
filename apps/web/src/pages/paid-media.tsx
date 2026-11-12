import { useQuery } from "@tanstack/react-query";
import { Caveats, MetricStrip, PageTitle, Panel } from "../components/data-display";
import { DataTable, type DataColumn } from "../components/data-table";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback";
import { api, type AdsData } from "../lib/api";
import { currency, integer } from "../lib/format";
import { useFilters } from "../state/filters";

type AdRow = AdsData["rows"][number];
const columns: Array<DataColumn<AdRow>> = [
  { id: "campaign", header: "Campaña", cell: (row) => <div><p className="font-medium text-slate-950 dark:text-white">{row.campaign}</p>{row.allocationWarning ? <p className="mt-1 max-w-64 text-xs text-amber-600">{row.allocationWarning}</p> : null}</div> },
  { id: "platform", header: "Plataforma", cell: (row) => row.platform },
  { id: "municipality", header: "Municipio", cell: (row) => row.municipalityId ?? "No segmentada", hideBelow: "lg" },
  { id: "spend", header: "Inversión", cell: (row) => currency.format(row.spend), align: "right" },
  { id: "clicks", header: "Clics", cell: (row) => integer.format(row.clicks), align: "right", hideBelow: "sm" },
  { id: "platform-conversions", header: "Conv. plataforma", cell: (row) => integer.format(row.platformConversions), align: "right", hideBelow: "md" },
  { id: "crm-sql", header: "SQL CRM", cell: (row) => integer.format(row.crmSql), align: "right" },
  { id: "crm-altas", header: "Altas CRM", cell: (row) => integer.format(row.crmAltas), align: "right" },
];

export function PaidMediaPage() {
  const { filters } = useFilters();
  const query = useQuery({ queryKey: ["ads", filters], queryFn: () => api.ads(filters) });
  if (query.isLoading) return <LoadingState cards={3} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <EmptyState />;
  const { rows, caveats } = query.data;
  const summary = rows.reduce((total, row) => ({ spend: total.spend + row.spend, impressions: total.impressions + row.impressions, clicks: total.clicks + row.clicks, crmSql: total.crmSql + row.crmSql, crmAltas: total.crmAltas + row.crmAltas }), { spend: 0, impressions: 0, clicks: 0, crmSql: 0, crmAltas: 0 });

  return <div className="page-grid"><PageTitle title="Medios de pago" /><MetricStrip columns={5} items={[
    { id: "paid-spend", label: "Inversión", value: currency.format(summary.spend) },
    { id: "paid-impressions", label: "Impresiones", value: integer.format(summary.impressions) },
    { id: "paid-clicks", label: "Clics", value: integer.format(summary.clicks), detail: summary.clicks ? `CPC ${currency.format(summary.spend / summary.clicks)}` : undefined },
    { id: "paid-crm-sql", label: "SQL en CRM", value: integer.format(summary.crmSql) },
    { id: "paid-crm-altas", label: "Altas en CRM", value: integer.format(summary.crmAltas) },
  ]} /><Panel title="Campañas" componentId="paid-media-campaigns"><DataTable rows={rows} columns={columns} rowKey={(row) => `${row.platform}-${row.campaign}-${row.municipalityId ?? "all"}`} minWidth="min-w-[820px]" /></Panel><Caveats items={caveats} /></div>;
}

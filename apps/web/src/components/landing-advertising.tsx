import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@qida/ui";
import { Info, Link2 } from "lucide-react";
import type { LandingInsightDetailData } from "../lib/api";
import { currency, formatDate, integer } from "../lib/format";
import { EmptyState } from "./feedback";

type CampaignRow = LandingInsightDetailData["advertising"]["rows"][number];

function ColumnHeading({
  label,
  definition,
  align = "left",
}: {
  label: string;
  definition: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${align === "right" ? "justify-end" : ""}`}
    >
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label={`Definición de ${label}`}
            className="text-muted-foreground/70 transition-colors hover:text-foreground"
            type="button"
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{definition}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4 first:pl-0 last:pr-0 sm:px-6">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function CostValue({ value }: { value: number | null }) {
  return value === null ? (
    <span className="text-muted-foreground">Sin resultado</span>
  ) : (
    <span className="tabular font-medium">{currency.format(value)}</span>
  );
}

function CampaignTable({ rows }: { rows: CampaignRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por campaña</CardTitle>
        <CardDescription>
          Inversión publicitaria y resultados del CRM vinculados mediante la
          campaña observada en la landing.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="pl-6">Campaña</TableHead>
              <TableHead className="text-right">
                <ColumnHeading
                  align="right"
                  definition="Coste registrado en ads_diario para esta campaña y municipio."
                  label="Inversión"
                />
              </TableHead>
              <TableHead>
                <ColumnHeading
                  definition="Impresiones, clics y coste medio por clic registrados por la plataforma publicitaria."
                  label="Tráfico de pago"
                />
              </TableHead>
              <TableHead>
                <ColumnHeading
                  definition="Leads, SQL y altas reconciliados con el CRM a partir de eventos que conservan esta landing y campaña."
                  label="Resultado en CRM"
                />
              </TableHead>
              <TableHead className="pr-6">
                <ColumnHeading
                  definition="Inversión dividida entre los SQL o las altas enlazadas. Si no hay resultado, el coste no se calcula."
                  label="Eficiencia"
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.platform}-${row.campaign}`}>
                <TableCell className="min-w-64 pl-6 align-top">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{row.campaign}</p>
                    <Badge tone="info">{row.platform}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(row.firstSeen)} – {formatDate(row.lastSeen)}
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="mt-3 flex w-fit items-center gap-1.5 text-xs font-medium text-primary"
                        type="button"
                      >
                        <Link2 className="size-3.5" />
                        {integer.format(row.trackedSessions)} sesiones enlazadas
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      La URL de esta landing y el identificador de campaña
                      aparecen juntos en {integer.format(row.trackedEvents)}
                      {" "}eventos.
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="tabular text-right align-top font-semibold">
                  {currency.format(row.spend)}
                </TableCell>
                <TableCell className="min-w-52 align-top">
                  <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Impresiones</dt>
                    <dd className="tabular text-right font-medium">
                      {integer.format(row.impressions)}
                    </dd>
                    <dt className="text-muted-foreground">Clics</dt>
                    <dd className="tabular text-right font-medium">
                      {integer.format(row.clicks)}
                    </dd>
                    <dt className="text-muted-foreground">Coste por clic</dt>
                    <dd className="tabular text-right font-medium">
                      {currency.format(row.cpc)}
                    </dd>
                    <dt className="text-muted-foreground">
                      Conversiones plataforma
                    </dt>
                    <dd className="tabular text-right font-medium">
                      {integer.format(row.platformConversions)}
                    </dd>
                  </dl>
                </TableCell>
                <TableCell className="min-w-44 align-top">
                  <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Leads</dt>
                    <dd className="tabular text-right font-medium">
                      {integer.format(row.leads)}
                    </dd>
                    <dt className="text-muted-foreground">SQL</dt>
                    <dd className="tabular text-right font-medium">
                      {integer.format(row.crmSql)}
                    </dd>
                    <dt className="text-muted-foreground">Altas</dt>
                    <dd className="tabular text-right font-medium">
                      {integer.format(row.crmAltas)}
                    </dd>
                  </dl>
                </TableCell>
                <TableCell className="min-w-52 pr-6 align-top">
                  <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Coste por SQL</dt>
                    <dd className="text-right">
                      <CostValue value={row.costPerSql} />
                    </dd>
                    <dt className="text-muted-foreground">Coste por alta</dt>
                    <dd className="text-right">
                      <CostValue value={row.costPerAlta} />
                    </dd>
                  </dl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function LandingAdvertising({
  advertising,
}: {
  advertising: LandingInsightDetailData["advertising"];
}) {
  if (!advertising.rows.length) {
    return (
      <Card>
        <EmptyState
          description="No hay eventos que conserven a la vez la URL de esta landing y una campaña presente en ads_diario para el municipio."
          title="No hay campañas enlazadas"
        />
      </Card>
    );
  }

  const totals = advertising.rows.reduce(
    (result, row) => ({
      spend: result.spend + row.spend,
      clicks: result.clicks + row.clicks,
      sql: result.sql + row.crmSql,
      altas: result.altas + row.crmAltas,
    }),
    { spend: 0, clicks: 0, sql: 0, altas: 0 },
  );

  return (
    <section aria-labelledby="paid-campaigns-heading" className="space-y-5">
      <div>
        <h2
          className="text-xl font-semibold tracking-tight"
          id="paid-campaigns-heading"
        >
          Campañas de pago
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          Campañas que llevaron tráfico a esta landing y resultados que después
          pudieron enlazarse con el CRM.
        </p>
      </div>

      <div className="grid border-y sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
        <Metric label="Inversión" value={currency.format(totals.spend)} />
        <Metric label="Clics de pago" value={integer.format(totals.clicks)} />
        <Metric label="SQL enlazados" value={integer.format(totals.sql)} />
        <Metric label="Altas enlazadas" value={integer.format(totals.altas)} />
      </div>

      <CampaignTable rows={advertising.rows} />

      <Alert>
        <AlertTitle>Cómo se relacionan los datos</AlertTitle>
        <AlertDescription>
          <ul className="list-disc space-y-1 pl-4">
            {advertising.caveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    </section>
  );
}

import { WeeklyMinutes } from "../components/weekly-minutes";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from "@qida/ui";
import { CalendarCheck2, CheckCircle2, Clock3, FileCheck2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "../components/feedback";
import { api, type PlanningData } from "../lib/api";
import { formatDate, integer } from "../lib/format";

type Meeting = PlanningData["meetings"][number];
type Category = Meeting["category"];

const categoryCopy: Record<Category, { label: string; tone: "info" | "warning" | "violet" | "danger" }> = {
  working: { label: "Trabajo", tone: "info" },
  control: { label: "Control", tone: "warning" },
  approval: { label: "Aprobación", tone: "violet" },
  decision: { label: "Decisión", tone: "danger" },
};

function utcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function dayNumber(value: string, startDate: string): number {
  return Math.round((utcDate(value).getTime() - utcDate(startDate).getTime()) / 86_400_000) + 1;
}

function dateAtDay(startDate: string, day: number): string {
  const date = utcDate(startDate);
  date.setUTCDate(date.getUTCDate() + day - 1);
  return date.toISOString().slice(0, 10);
}

function PhaseTimeline({ data }: { data: PlanningData }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="grid min-w-[720px] grid-cols-4">
        {data.phases.map((phase) => (
            <div className="border-r p-4 last:border-r-0" key={phase.id}>
              <p className="text-xs font-medium text-muted-foreground">Días {phase.startDay}–{phase.endDay}</p>
              <p className="mt-1 text-sm font-semibold">{phase.name}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{phase.outcome}</p>
              <p className="mt-3 text-xs font-medium">{phase.owner}</p>
            </div>
        ))}
      </div>
    </div>
  );
}

function WeekCalendar({ data, selectedId, onSelect }: { data: PlanningData; selectedId: string; onSelect: (id: string,date?: string) => void }) {
  const weeks = useMemo(() => Array.from({ length: 13 }, (_, index) => {
    const firstDay = index * 7 + 1;
    const lastDay = Math.min(data.totalDays, firstDay + 6);
    return { index, firstDay, lastDay, start: dateAtDay(data.startDate, firstDay), end: dateAtDay(data.startDate, lastDay) };
  }), [data.startDate, data.totalDays]);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Calendario de reuniones</CardTitle>
        <CardDescription>Selecciona una fila o una sesión para abrir su preparación y guion.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[1060px]">
            <div className="grid grid-cols-[230px_repeat(13,minmax(58px,1fr))] border-y bg-muted/40">
              <div className="px-4 py-3 text-xs font-semibold text-muted-foreground">Formato</div>
              {weeks.map((week) => <div className="border-l px-1 py-2 text-center" key={week.index}><p className="text-xs font-semibold">S{week.index + 1}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(week.start).replace(/ de /g, " ")}</p></div>)}
            </div>
            {data.meetings.map((meeting) => (
              <div className={cn("grid grid-cols-[230px_repeat(13,minmax(58px,1fr))] border-b last:border-b-0", selectedId === meeting.id && "bg-secondary/70")} key={meeting.id}>
                <button className="min-w-0 px-4 py-3 text-left hover:bg-secondary" onClick={() => onSelect(meeting.id)} type="button">
                  <span className="block truncate text-sm font-semibold">{meeting.name}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{meeting.cadence}</span>
                </button>
                {weeks.map((week) => {
                  const occurrences = meeting.dates.filter((date) => {
                    const day = dayNumber(date, data.startDate);
                    return day >= week.firstDay && day <= week.lastDay;
                  });
                  return (
                    <div className="grid min-h-16 place-items-center border-l p-1" key={week.index}>
                      {occurrences.length ? (
                        <button aria-label={`${meeting.name}, ${occurrences.map(formatDate).join(", ")}`} className={cn("grid size-8 place-items-center rounded-md border transition-colors", selectedId === meeting.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary")} onClick={() => onSelect(meeting.id,occurrences[0])} type="button"><Users className="size-4" /></button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MeetingDetail({ meeting, data }: { meeting: Meeting; data: PlanningData }) {
  const category = categoryCopy[meeting.category];
  const restrictions = data.restrictions.filter((restriction) => meeting.restrictionIds.includes(restriction.id));
  const duration = meeting.agenda.reduce((sum, section) => sum + section.minutes, 0);
  return (
    <Card className="min-w-0 xl:sticky xl:top-24 xl:self-start">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center gap-2"><Badge tone={category.tone}>{category.label}</Badge><Badge>{meeting.cadence}</Badge></div>
        <CardTitle className="mt-3 text-lg">{meeting.name}</CardTitle>
        <CardDescription>{meeting.purpose}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div><dt className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="size-4" />Responsable</dt><dd className="mt-1 font-semibold">{meeting.owner}</dd></div>
          <div><dt className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-4" />Duración</dt><dd className="mt-1 font-semibold">{integer.format(duration)} minutos</dd></div>
        </dl>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div><h3 className="text-sm font-semibold">Fechas</h3><div className="mt-2 flex flex-wrap gap-2">{meeting.dates.map((date) => <Badge key={date}>{formatDate(date)}</Badge>)}</div></div>
          <div><h3 className="text-sm font-semibold">Asistentes</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{meeting.attendees.join(" · ")}</p></div>
        </section>

        <section>
          <h3 className="text-sm font-semibold">Cómo presentar la reunión</h3>
          <div className="mt-3 flex flex-col gap-4">
            {meeting.agenda.map((section, index) => (
              <div className="grid grid-cols-[28px_1fr] gap-3" key={section.title}>
                <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span>
                <div><div className="flex items-baseline justify-between gap-3"><p className="text-sm font-semibold">{section.title}</p><span className="text-xs text-muted-foreground">{section.minutes} min</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{section.content}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t pt-5">
          <h3 className="text-sm font-semibold">Decisiones que deben salir</h3>
          <ul className="mt-3 flex flex-col gap-2">{meeting.decisions.map((decision) => <li className="flex gap-2 text-xs leading-5 text-muted-foreground" key={decision}><CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />{decision}</li>)}</ul>
        </section>

        <section className="grid gap-4 border-t pt-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div><h3 className="text-sm font-semibold">Preparar antes</h3><ul className="mt-2 flex flex-col gap-2">{meeting.inputs.map((item) => <li className="flex gap-2 text-xs leading-5 text-muted-foreground" key={item}><FileCheck2 className="mt-0.5 size-3.5 shrink-0" />{item}</li>)}</ul></div>
          <div><h3 className="text-sm font-semibold">Cerrar con</h3><ul className="mt-2 flex flex-col gap-2">{meeting.outputs.map((item) => <li className="flex gap-2 text-xs leading-5 text-muted-foreground" key={item}><CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />{item}</li>)}</ul></div>
        </section>

        <section className="border-t pt-5">
          <h3 className="text-sm font-semibold">Restricciones que valida</h3>
          <div className="mt-3 flex flex-col gap-3">{restrictions.map((restriction) => <div key={restriction.id}><p className="text-xs font-semibold">{restriction.rule}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">Evidencia: {restriction.evidence}</p></div>)}</div>
        </section>
      </CardContent>
    </Card>
  );
}

function Restrictions({ data }: { data: PlanningData }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-2">
      {data.restrictions.map((restriction) => (
        <div className="bg-card p-5" key={restriction.id}>
          <div className="flex items-start justify-between gap-4"><h3 className="text-sm font-semibold">{restriction.rule}</h3><Badge>{restriction.owner}</Badge></div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{restriction.evidence}</p>
          <p className="mt-4 text-xs text-muted-foreground">Se revisa en {data.meetings.filter((meeting) => meeting.restrictionIds.includes(restriction.id)).length} formatos de reunión.</p>
        </div>
      ))}
    </div>
  );
}

export function PlanningPage() {
  const query = useQuery({ queryKey: ["planning-90-days"], queryFn: api.planning });
  const [selectedId, setSelectedId] = useState("kickoff");
  const [sessionDate,setSessionDate] = useState("");
  if (query.isLoading) return <LoadingState cards={4} />;
  if (query.error instanceof Error) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <ErrorState error={new Error("No se recibió el plan de 90 días.")} retry={() => void query.refetch()} />;
  const data = query.data;
  const selected = data.meetings.find((meeting) => meeting.id === selectedId) ?? data.meetings[0];
  if (!selected) return null;
  const sessionCount = data.meetings.reduce((sum, meeting) => sum + meeting.dates.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarCheck2 className="size-4" />{formatDate(data.startDate)} – {formatDate(data.endDate)}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Plan de 90 días</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reuniones, controles y decisiones para ejecutar la primera apuesta.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <p><strong>{data.totalDays}</strong> <span className="text-muted-foreground">días</span></p>
          <p><strong>{data.phases.length}</strong> <span className="text-muted-foreground">fases</span></p>
          <p><strong>{sessionCount}</strong> <span className="text-muted-foreground">sesiones</span></p>
          <p><strong>{data.restrictions.length}</strong> <span className="text-muted-foreground">restricciones</span></p>
        </div>
      </header>

      <PhaseTimeline data={data} />

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="restrictions">Restricciones y evidencia</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.75fr)]">
            <WeekCalendar data={data} onSelect={(id,date)=>{setSelectedId(id);if(date) setSessionDate(date);}} selectedId={selected.id} />
            <MeetingDetail data={data} meeting={selected} />
          </div>
          {selected.id==="weekly" && selected.dates[0] && <div className="mt-5"><WeeklyMinutes dates={selected.dates} date={selected.dates.includes(sessionDate) ? sessionDate : selected.dates[0]} onDate={setSessionDate}/></div>}
        </TabsContent>
        <TabsContent value="restrictions"><Restrictions data={data} /></TabsContent>
      </Tabs>
    </div>
  );
}

export type AttributionEvent = {
  eventId: string;
  occurredAt: Date;
  eventType: string;
  channel: string | null;
  observed: boolean;
};

export type AttributionResult = {
  firstTouch: string | null;
  lastTouch: string | null;
  multiTouch: Array<{ channel: string; touches: number; descriptiveShare: number }>;
  observedTouchCount: number;
  excludedInferredEvents: number;
  warning: string;
};

const TOUCH_EVENTS = new Set(["ad_click", "landing_view", "page_view", "form_submit", "phone_call"]);

export function describeAttribution(events: readonly AttributionEvent[]): AttributionResult {
  const inferred = events.filter((event) => !event.observed).length;
  const touches = events
    .filter((event) => event.observed && event.channel !== null && TOUCH_EVENTS.has(event.eventType))
    .slice()
    .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime() || left.eventId.localeCompare(right.eventId));
  const counts = new Map<string, number>();
  for (const touch of touches) {
    const channel = touch.channel as string;
    counts.set(channel, (counts.get(channel) ?? 0) + 1);
  }
  const total = touches.length;
  const multiTouch = [...counts.entries()]
    .map(([channel, count]) => ({ channel, touches: count, descriptiveShare: total === 0 ? 0 : Number((count / total).toFixed(4)) }))
    .sort((left, right) => right.touches - left.touches || left.channel.localeCompare(right.channel));
  return {
    firstTouch: touches.at(0)?.channel ?? null,
    lastTouch: touches.at(-1)?.channel ?? null,
    multiTouch,
    observedTouchCount: total,
    excludedInferredEvents: inferred,
    warning: "Atribución descriptiva de contactos observados; no demuestra incrementalidad ni causalidad.",
  };
}

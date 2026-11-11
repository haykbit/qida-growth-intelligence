import { describe, expect, it } from "vitest";
import { describeAttribution } from "./attribution.js";

describe("describeAttribution", () => {
  it("reports deterministic first, last, and descriptive multi-touch attribution", () => {
    const result = describeAttribution([
      { eventId: "3", occurredAt: new Date("2026-01-03Z"), eventType: "phone_call", channel: "phone", observed: true },
      { eventId: "1", occurredAt: new Date("2026-01-01Z"), eventType: "ad_click", channel: "paid_search", observed: true },
      { eventId: "2", occurredAt: new Date("2026-01-02Z"), eventType: "page_view", channel: "organic", observed: true },
      { eventId: "4", occurredAt: new Date("2026-01-04Z"), eventType: "page_view", channel: "direct", observed: false },
      { eventId: "5", occurredAt: new Date("2026-01-05Z"), eventType: "alta_completed", channel: "crm", observed: true },
    ]);
    expect(result.firstTouch).toBe("paid_search");
    expect(result.lastTouch).toBe("phone");
    expect(result.observedTouchCount).toBe(3);
    expect(result.excludedInferredEvents).toBe(1);
    expect(result.multiTouch.map((row) => row.channel)).toEqual(["organic", "paid_search", "phone"]);
    expect(result.warning).toContain("no demuestra");
  });
});

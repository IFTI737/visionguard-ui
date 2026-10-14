import type { TimeWindow, Zone } from "@/types";

/** "HH:MM" → minutes after midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

const dhakaParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Minutes after midnight in Bangladesh time, whatever the device's own time zone is. */
export function dhakaMinutes(date: Date): number {
  const parts = dhakaParts.formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/**
 * Is the time window active at this moment?
 * Handles windows that cross midnight, e.g. 18:00 → 06:00.
 * from === to means the whole day.
 */
export function isWindowActive(window: TimeWindow, date: Date): boolean {
  const now = dhakaMinutes(date);
  const from = toMinutes(window.from);
  const to = toMinutes(window.to);
  if (from === to) return true;
  return from < to ? now >= from && now < to : now >= from || now < to;
}

export function isZoneActive(zone: Zone, date: Date): boolean {
  return zone.alwaysOn || isWindowActive(zone.schedule, date);
}

/** 24-hour "18:00" → "6:00 pm". */
export function to12h(hhmm: string): string {
  const mins = toMinutes(hhmm);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function describeSchedule(zone: Pick<Zone, "alwaysOn" | "schedule">): string {
  if (zone.alwaysOn) return "Always on";
  const { from, to } = zone.schedule;
  if (from === to) return "All day";
  const overnight = toMinutes(from) > toMinutes(to);
  return `${to12h(from)} – ${to12h(to)}${overnight ? " (overnight)" : ""}`;
}

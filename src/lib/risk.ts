import { RISK } from "@/data/seed";
import type { AlertLevel, PersonBox, Point, Zone } from "@/types";
import { pointInPolygon } from "./geometry";
import { describeSchedule, isWindowActive, isZoneActive } from "./schedule";

/** Where a person stands: the bottom centre of their box (their feet). */
export const footPoint = (b: PersonBox): Point => [(b.x0 + b.x1) / 2, b.y1];

export interface PersonCheck {
  box: PersonBox;
  /** Zone the person's feet are in, if any (the most serious one if several overlap). */
  zone: Zone | null;
  zoneActive: boolean;
}

export interface RiskDecision {
  score: number;
  level: AlertLevel | "ignore";
  reasons: string[];
  /** The person that drove the decision. */
  person: PersonCheck | null;
}

/** Check each detected person against the zones drawn for this camera. */
export function checkPeople(people: PersonBox[], zones: Zone[], now: Date): PersonCheck[] {
  return people.map((box) => {
    const feet = footPoint(box);
    const inside = zones.filter((z) => pointInPolygon(feet, z.points));
    const active = inside.find((z) => isZoneActive(z, now));
    const zone = active ?? inside[0] ?? null;
    return { box, zone, zoneActive: Boolean(active) };
  });
}

export function levelFor(score: number): RiskDecision["level"] {
  if (score >= RISK.bands.urgent) return "urgent";
  if (score >= RISK.bands.notify) return "notify";
  if (score >= RISK.bands.log) return "log";
  return "ignore";
}

/**
 * Score one person with the starting weights from the pitch:
 * restricted zone +40, inside restricted hours (or an always-on hazard zone) +30, night +15.
 */
export function scorePerson(check: PersonCheck, now: Date): RiskDecision {
  if (!check.zone) {
    return { score: 0, level: "ignore", reasons: ["Outside every restricted zone"], person: check };
  }
  const reasons: string[] = [];
  let score = RISK.restrictedZone;
  reasons.push(`Inside restricted zone “${check.zone.name}” (+${RISK.restrictedZone})`);

  if (check.zoneActive) {
    score += RISK.restrictedHours;
    reasons.push(
      check.zone.alwaysOn
        ? `Hazard zone, always on (+${RISK.restrictedHours})`
        : `During restricted hours, ${describeSchedule(check.zone)} (+${RISK.restrictedHours})`,
    );
    if (isWindowActive(RISK.nightWindow, now)) {
      score += RISK.night;
      reasons.push(`Night mode (+${RISK.night})`);
    }
  } else {
    reasons.push(`Outside restricted hours (${describeSchedule(check.zone)}), so it is only logged`);
  }
  return { score, level: levelFor(score), reasons, person: check };
}

export interface ZoneDecision extends RiskDecision {
  zone: Zone;
  /** How many detected people stand in this zone. */
  people: number;
}

/**
 * One decision per restricted zone that has someone in it, most serious first.
 * Two zones entered at the same time give two separate alerts.
 */
export function decideByZone(checks: PersonCheck[], now: Date): ZoneDecision[] {
  const byZone = new Map<string, ZoneDecision>();
  for (const check of checks) {
    if (!check.zone) continue;
    const decision = scorePerson(check, now);
    if (decision.level === "ignore") continue;
    const current = byZone.get(check.zone.id);
    if (!current) {
      byZone.set(check.zone.id, { ...decision, zone: check.zone, people: 1 });
    } else {
      const people = current.people + 1;
      byZone.set(check.zone.id, decision.score > current.score ? { ...decision, zone: check.zone, people } : { ...current, people });
    }
  }
  return [...byZone.values()].sort((a, b) => b.score - a.score);
}

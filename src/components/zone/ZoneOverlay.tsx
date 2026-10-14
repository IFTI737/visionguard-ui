import { centroid, toSvgPoints } from "@/lib/geometry";
import { describeSchedule, isZoneActive } from "@/lib/schedule";
import type { Zone } from "@/types";

/**
 * Read-only zone drawing for the live view.
 * Active zones (inside their hours) are filled red; inactive ones are a dashed outline.
 */
export function ZoneOverlay({ zones, now }: { zones: Zone[]; now: Date }) {
  if (zones.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {zones.map((z) => {
          const active = isZoneActive(z, now);
          return (
            <polygon
              key={z.id}
              points={toSvgPoints(z.points)}
              fill={active ? "rgba(229,72,77,0.30)" : "rgba(255,255,255,0.06)"}
              stroke={active ? "#e5484d" : "rgba(255,255,255,0.9)"}
              strokeWidth={2}
              strokeDasharray={active ? undefined : "6 5"}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
      {zones.map((z) => {
        const active = isZoneActive(z, now);
        const [cx, cy] = centroid(z.points);
        return (
          <div
            key={z.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${cx * 100}%`, top: `${cy * 100}%` }}
          >
            <span
              className={`flex flex-col items-center whitespace-nowrap rounded-md px-2 py-1 text-center text-[11px] font-semibold shadow ${
                active ? "bg-danger text-white" : "bg-white/90 text-ink"
              }`}
            >
              {z.name}
              <span className={`text-[10px] font-medium ${active ? "text-white/85" : "text-muted"}`}>
                {active ? "Restricted now" : `Not active · ${describeSchedule(z)}`}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

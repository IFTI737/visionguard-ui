import { footPoint, type PersonCheck } from "@/lib/risk";

/**
 * Boxes around detected people.
 * Red: feet inside a zone that is restricted now. Amber: inside a zone outside its hours.
 * White dashed: outside every zone (ignored).
 */
export function DetectionOverlay({ checks }: { checks: PersonCheck[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {checks.map((c, i) => {
        const { box } = c;
        const [fx, fy] = footPoint(box);
        const tone = c.zone && c.zoneActive ? "danger" : c.zone ? "amber" : "ignored";
        const border =
          tone === "danger"
            ? "border-danger border-[3px]"
            : tone === "amber"
              ? "border-amber-400 border-[3px]"
              : "border-white/90 border-2 border-dashed";
        const chip =
          tone === "danger" ? "bg-danger text-white" : tone === "amber" ? "bg-amber-400 text-ink" : "bg-white/90 text-ink";
        return (
          <div key={i}>
            <div
              className={`absolute rounded-sm ${border}`}
              style={{
                left: `${box.x0 * 100}%`,
                top: `${box.y0 * 100}%`,
                width: `${(box.x1 - box.x0) * 100}%`,
                height: `${(box.y1 - box.y0) * 100}%`,
              }}
            >
              <span
                className={`absolute -top-0.5 left-0 -translate-y-full whitespace-nowrap rounded-t-sm px-1.5 py-0.5 text-[10px] font-bold leading-none ${chip}`}
              >
                person {Math.round(box.score * 100)}%{c.zone ? ` · ${c.zone.name}` : ""}
              </span>
            </div>
            {/* The point used for the zone check: where the feet are */}
            <span
              className={`absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${
                tone === "danger" ? "bg-danger" : tone === "amber" ? "bg-amber-400" : "bg-ink"
              }`}
              style={{ left: `${fx * 100}%`, top: `${fy * 100}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

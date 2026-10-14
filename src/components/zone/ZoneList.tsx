import { ChevronRight, Shapes } from "lucide-react";
import { describeSchedule, isZoneActive } from "@/lib/schedule";
import type { Zone } from "@/types";

interface ZoneListProps {
  zones: Zone[];
  now: Date;
  onSelect: (id: string) => void;
}

export function ZoneList({ zones, now, onSelect }: ZoneListProps) {
  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-tint text-brand">
          <Shapes size={22} />
        </span>
        <p className="mt-3 font-semibold text-ink">No zones yet</p>
        <p className="mt-1 text-sm text-muted">
          Pick a tool above the view and draw the area that should be restricted, or use <b>Whole view</b>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Zones in this view</h2>
      <ul className="flex flex-col gap-2">
        {zones.map((z) => {
          const active = isZoneActive(z, now);
          return (
            <li key={z.id}>
              <button
                type="button"
                onClick={() => onSelect(z.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:border-brand/50 hover:bg-pale"
              >
                <span className="size-3.5 shrink-0 rounded-[4px] border-2 border-danger bg-danger/30" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{z.name}</span>
                  <span className="block text-xs text-muted">{describeSchedule(z)}</span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    active ? "bg-danger text-white" : "bg-pale text-muted"
                  }`}
                >
                  {active ? "Active" : "Off now"}
                </span>
                <ChevronRight size={16} className="text-muted" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Select a zone to change its hours, or drag its corners on the view.</p>
    </div>
  );
}

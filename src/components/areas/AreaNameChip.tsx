"use client";

import { TriangleAlert } from "lucide-react";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { Area } from "@/types";
import { AreaIcon } from "./AreaIcon";

/** Area icon + editable name, shown at the top right of area pages. */
export function AreaNameChip({ area }: { area: Area }) {
  const renameArea = useVisionGuard((s) => s.renameArea);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white py-2 pl-2 pr-3">
      <span className="grid size-9 place-items-center rounded-lg bg-brand-tint text-brand">
        <AreaIcon kind={area.kind} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Area name</p>
        <InlineEdit
          value={area.name}
          onSave={(name) => renameArea(area.id, name)}
          ariaLabel="Rename this area"
          className="-ml-1.5 max-w-[14rem] text-sm font-semibold text-ink"
        />
      </div>
      {area.hazard && (
        <span
          title="Hazard area"
          className="ml-1 inline-flex items-center gap-1 rounded-full bg-danger-tint px-2 py-0.5 text-[11px] font-semibold text-danger"
        >
          <TriangleAlert size={11} /> Hazard
        </span>
      )}
    </div>
  );
}

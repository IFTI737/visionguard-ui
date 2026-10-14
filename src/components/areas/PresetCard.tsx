import { Check, ScanFace, TriangleAlert } from "lucide-react";
import type { AreaPreset } from "@/data/seed";
import { AreaIcon } from "./AreaIcon";

interface PresetCardProps {
  preset: AreaPreset;
  selected: boolean;
  addedCount: number;
  onSelect: () => void;
}

/** One suggested area in the Add-area grid; behaves like a radio button. */
export function PresetCard({ preset, selected, addedCount, onSelect }: PresetCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group relative flex h-full flex-col rounded-2xl border bg-white p-4 text-left transition-all ${
        selected
          ? "border-brand shadow-md shadow-brand/10 ring-3 ring-brand-tint"
          : "border-line hover:border-brand/50 hover:shadow-sm"
      }`}
    >
      <span
        aria-hidden
        className={`absolute right-3 top-3 grid size-6 place-items-center rounded-full border transition-colors ${
          selected ? "border-brand bg-brand text-white" : "border-line bg-white text-transparent"
        }`}
      >
        <Check size={14} strokeWidth={3} />
      </span>

      <span
        className={`grid size-11 place-items-center rounded-xl transition-colors ${
          selected ? "bg-brand text-white" : "bg-brand-tint text-brand"
        }`}
      >
        <AreaIcon kind={preset.kind} size={21} />
      </span>

      <span className="mt-3 pr-6 font-semibold text-ink">{preset.label}</span>
      <span className="mt-1 text-xs leading-relaxed text-muted">{preset.description}</span>

      <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
        {preset.hazard && (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger-tint px-2 py-0.5 text-[11px] font-semibold text-danger">
            <TriangleAlert size={11} /> Hazard area
          </span>
        )}
        {preset.features.includes("face_verification") && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-semibold text-brand">
            <ScanFace size={11} /> Face check
          </span>
        )}
        {addedCount > 0 && (
          <span className="rounded-full bg-pale px-2 py-0.5 text-[11px] font-medium text-muted">
            Added{addedCount > 1 ? ` ×${addedCount}` : ""}
          </span>
        )}
      </span>
    </button>
  );
}

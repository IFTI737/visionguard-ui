"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AREA_PRESETS } from "@/data/seed";
import { useHydrated } from "@/lib/useHydrated";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { AreaKind } from "@/types";
import { CustomAreaForm } from "./CustomAreaForm";
import { PresetCard } from "./PresetCard";

type Selection = { type: "preset"; kind: Exclude<AreaKind, "custom"> } | { type: "custom" } | null;

export function AddAreaView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const areas = useVisionGuard((s) => s.areas);
  const addArea = useVisionGuard((s) => s.addArea);

  const [selection, setSelection] = useState<Selection>(null);
  const [customName, setCustomName] = useState("");
  const [customHazard, setCustomHazard] = useState(false);

  const countOf = (kind: AreaKind) => (hydrated ? areas.filter((a) => a.kind === kind).length : 0);

  const selectedLabel =
    selection?.type === "preset"
      ? AREA_PRESETS.find((p) => p.kind === selection.kind)?.label
      : selection?.type === "custom"
        ? customName.trim() || "Your own area"
        : null;

  const canContinue =
    selection?.type === "preset" || (selection?.type === "custom" && customName.trim().length > 0);

  const onContinue = () => {
    if (!selection || !canContinue) return;
    const id =
      selection.type === "preset"
        ? addArea(selection.kind)
        : addArea("custom", { name: customName, hazard: customHazard });
    // The page stays mounted in the background after navigating, so clear the form for next time.
    setSelection(null);
    setCustomName("");
    setCustomHazard(false);
    router.push(`/areas/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="Add an area"
        description="Choose the place this camera watches. Pick a suggestion or name your own; you can rename it later."
      />

      <section aria-labelledby="suggested-heading">
        <h2 id="suggested-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Suggested areas
        </h2>
        <div role="radiogroup" aria-label="Suggested areas" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {AREA_PRESETS.map((preset) => (
            <PresetCard
              key={preset.kind}
              preset={preset}
              addedCount={countOf(preset.kind)}
              selected={selection?.type === "preset" && selection.kind === preset.kind}
              onSelect={() => setSelection({ type: "preset", kind: preset.kind })}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="custom-heading" className="mt-8">
        <h2 id="custom-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Or add your own
        </h2>
        <CustomAreaForm
          selected={selection?.type === "custom"}
          name={customName}
          hazard={customHazard}
          onFocus={() => setSelection({ type: "custom" })}
          onNameChange={setCustomName}
          onHazardChange={setCustomHazard}
        />
      </section>

      {/* Action bar that sticks to the bottom of the page while scrolling */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-white/95 backdrop-blur sm:-mx-8">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <p className="min-w-0 truncate text-sm text-muted">
            {selectedLabel ? (
              <>
                Selected: <span className="font-semibold text-ink">{selectedLabel}</span>
              </>
            ) : (
              "Select an area to continue"
            )}
          </p>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:shadow-none"
          >
            Continue to camera <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

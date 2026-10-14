"use client";

import { useHydrated } from "@/lib/useHydrated";
import { useVisionGuard } from "@/store/useVisionGuard";
import { AreaGrid } from "./AreaGrid";
import { EmptyAreas } from "./EmptyAreas";

/** Landing page body: empty state until the first area is added, then the area grid. */
export function AreasHome() {
  const hydrated = useHydrated();
  const areas = useVisionGuard((s) => s.areas);

  if (!hydrated) {
    return <div className="h-72 animate-pulse rounded-2xl bg-white" aria-hidden />;
  }
  return areas.length === 0 ? <EmptyAreas /> : <AreaGrid areas={areas} />;
}

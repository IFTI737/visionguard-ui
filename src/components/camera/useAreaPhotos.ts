"use client";

import { useEffect, useState } from "react";
import { resolveAreaPhotos, type AreaPhotos } from "@/lib/photos";
import type { Area } from "@/types";

export type AreaPhotosState = AreaPhotos & { loading: boolean };

const EMPTY: AreaPhotos = {
  prefix: null,
  label: null,
  empty: null,
  person: null,
  covered: null,
  expected: { empty: "", person: "", covered: "" },
};

/** Finds this area's demo photos in /public/demo, re-checking when the area's name or photo set changes. */
export function useAreaPhotos(area: Area | undefined): AreaPhotosState {
  const key = area ? `${area.kind}|${area.name}|${area.sceneId}` : "";
  const [result, setResult] = useState<{ key: string; photos: AreaPhotos } | null>(null);

  useEffect(() => {
    if (!area) return;
    let cancelled = false;
    resolveAreaPhotos(area).then((photos) => {
      if (!cancelled) setResult({ key, photos });
    });
    return () => {
      cancelled = true;
    };
    // Re-run only when the inputs that decide the file names change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!result || result.key !== key) return { ...EMPTY, loading: true };
  return { ...result.photos, loading: false };
}

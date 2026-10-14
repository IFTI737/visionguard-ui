"use client";

import { useState } from "react";

export const PLACEHOLDER_IMAGE = "/demo/placeholder.svg";

/**
 * The sample photo that stands in for a camera feed.
 * Falls back to a placeholder if the photo file is missing.
 * Always fills its parent (use inside a relative, aspect-video box) so zone
 * coordinates line up the same way on every page.
 */
export function FeedImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const url = !src || failed === src ? PLACEHOLDER_IMAGE : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      onError={() => setFailed(src)}
      draggable={false}
      className="pointer-events-none absolute inset-0 size-full select-none object-cover"
    />
  );
}

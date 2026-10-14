"use client";

import { useState } from "react";

export const PLACEHOLDER_IMAGE = "/demo/placeholder.svg";

interface FeedFrameProps {
  src: string | null;
  alt: string;
  /** Shown if `src` is missing or fails to load. */
  fallback?: string;
  /** Tallest the frame may get, so portrait photos don't run off the screen. */
  maxHeight?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Box that takes the exact shape of the photo inside it (landscape or portrait),
 * so zones and detection boxes, stored as fractions of the photo, line up exactly.
 * Children are drawn on top and can use absolute positioning in percentages.
 */
export function FeedFrame({
  src,
  alt,
  fallback = PLACEHOLDER_IMAGE,
  maxHeight = "72vh",
  className = "",
  children,
}: FeedFrameProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const [ratio, setRatio] = useState(16 / 9);
  const url = !src || failed === src ? fallback : src;

  return (
    <div
      className={`relative mx-auto overflow-hidden bg-ink ${className}`}
      style={{ aspectRatio: ratio, width: `min(100%, calc(${maxHeight} * ${ratio}))` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        draggable={false}
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          if (w && h) setRatio(w / h);
        }}
        onError={() => setFailed(src)}
        className="pointer-events-none absolute inset-0 size-full select-none object-cover"
      />
      {children}
      {src && failed === src && fallback === PLACEHOLDER_IMAGE && (
        <p className="pointer-events-none absolute left-1/2 top-1/2 max-w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-ink/85 px-3 py-2 text-center text-xs font-medium text-white">
          Photo not found: <span className="font-mono">public{src}</span>
        </p>
      )}
    </div>
  );
}

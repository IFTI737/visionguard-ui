"use client";

import { useEffect, useRef, useState } from "react";

export const PLACEHOLDER_IMAGE = "/demo/placeholder.svg";

interface FeedFrameProps {
  /** Photo to show (demo feed). Ignored when `stream` is given. */
  src: string | null;
  /** Live video, e.g. from a paired phone camera. */
  stream?: MediaStream | null;
  alt: string;
  /** Shown if `src` is missing or fails to load. */
  fallback?: string;
  /** Tallest the frame may get, so portrait photos don't run off the screen. */
  maxHeight?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Box that takes the exact shape of the photo or video inside it (landscape or portrait),
 * so zones and detection boxes, stored as fractions of the picture, line up exactly.
 * Children are drawn on top and can use absolute positioning in percentages.
 */
export function FeedFrame({
  src,
  stream,
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
      {stream ? (
        <StreamVideo stream={stream} label={alt} onRatio={setRatio} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
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
      )}
      {children}
      {!stream && src && failed === src && fallback === PLACEHOLDER_IMAGE && (
        <p className="pointer-events-none absolute left-1/2 top-1/2 max-w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-ink/85 px-3 py-2 text-center text-xs font-medium text-white">
          Photo not found: <span className="font-mono">public{src}</span>
        </p>
      )}
    </div>
  );
}

/** Plays a MediaStream; reports its shape so the frame can match it. */
function StreamVideo({
  stream,
  label,
  onRatio,
}: {
  stream: MediaStream;
  label: string;
  onRatio: (ratio: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    void video.play().catch(() => {});
  }, [stream]);

  const report = (video: HTMLVideoElement) => {
    if (video.videoWidth && video.videoHeight) onRatio(video.videoWidth / video.videoHeight);
  };

  return (
    <video
      ref={ref}
      aria-label={label}
      autoPlay
      muted
      playsInline
      onLoadedMetadata={(e) => report(e.currentTarget)}
      onResize={(e) => report(e.currentTarget)}
      className="pointer-events-none absolute inset-0 size-full select-none object-cover"
    />
  );
}

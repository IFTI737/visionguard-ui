"use client";

import { Cctv, LoaderCircle, Play, Wifi } from "lucide-react";
import { ZoneOverlay } from "@/components/zone/ZoneOverlay";
import { formatDhakaDate, formatDhakaTime, useNow } from "@/lib/useNow";
import type { PersonCheck } from "@/lib/risk";
import type { Area } from "@/types";
import { DetectionOverlay } from "./DetectionOverlay";
import { FeedFrame } from "./FeedFrame";

export interface LiveFeedView {
  /** Photo currently shown as the feed. */
  src: string;
  /** Shown if the photo is missing. */
  fallback?: string;
  /** People found in this photo, if a scan has run on it. */
  checks: PersonCheck[];
  /** True while the camera is "covered" in the demo. */
  covered?: boolean;
}

interface CameraFrameProps {
  area: Area;
  feed: LiveFeedView;
  onStartStreaming: () => void;
}

/**
 * The camera view. It shows one of four states:
 * empty dashed box, connecting spinner, connected (press Start streaming), or the live demo feed.
 */
export function CameraFrame({ area, feed, onStartStreaming }: CameraFrameProps) {
  const { status, ip } = area.camera;

  if (status === "disconnected") {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-2xl border-2 border-dashed border-line bg-white">
        <div className="flex max-w-sm flex-col items-center px-6 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-brand-tint text-brand">
            <Cctv size={30} />
          </span>
          <p className="mt-4 text-lg font-semibold text-ink">No camera connected</p>
          <p className="mt-1 text-sm text-muted">
            Enter this camera&apos;s IP address below and press Connect to see its view here.
          </p>
        </div>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-2xl border-2 border-brand/40 bg-white">
        <div className="flex flex-col items-center text-center">
          <LoaderCircle size={36} className="animate-spin text-brand" />
          <p className="mt-4 font-semibold text-ink">Connecting to camera…</p>
          <p className="mt-1 font-mono text-sm text-muted">{ip}</p>
        </div>
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-2xl bg-ink">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]"
        />
        <div className="relative flex flex-col items-center px-6 text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
            <Wifi size={13} /> Camera connected
          </span>
          <p className="mt-4 text-xl font-semibold">Ready to stream</p>
          <p className="mt-1 font-mono text-sm text-white/60">{ip}</p>
          <button
            type="button"
            onClick={onStartStreaming}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-lg transition-transform hover:scale-[1.03]"
          >
            <Play size={16} className="fill-current text-danger" /> Start streaming
          </button>
        </div>
      </div>
    );
  }

  return <LiveFeed area={area} feed={feed} />;
}

function LiveFeed({ area, feed }: { area: Area; feed: LiveFeedView }) {
  const now = useNow(true);

  return (
    <FeedFrame
      src={feed.src}
      fallback={feed.fallback}
      alt={`${area.name} camera view (demo photo)`}
      className="rounded-2xl shadow-lg shadow-ink/10"
    >
      {!feed.covered && <ZoneOverlay zones={area.zones} now={now} />}
      <DetectionOverlay checks={feed.checks} />

      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="absolute left-3 top-3 flex items-center gap-2 sm:left-4 sm:top-4">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-danger px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-white" />
          </span>
          Live
        </span>
        <span className="text-sm font-semibold text-white drop-shadow">{area.name}</span>
      </div>

      <div className="absolute right-3 top-3 text-right font-mono text-white drop-shadow sm:right-4 sm:top-4">
        <p className="text-sm font-semibold tabular-nums">{formatDhakaTime(now)}</p>
        <p className="text-[11px] text-white/80">{formatDhakaDate(now)}</p>
      </div>

      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
        <span className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-ink">
          Demo feed · sample photo
        </span>
      </div>
      <p className="absolute bottom-3 right-3 font-mono text-[11px] text-white/85 sm:bottom-4 sm:right-4">
        {area.camera.ip}:{area.camera.port}
      </p>
    </FeedFrame>
  );
}

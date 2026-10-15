"use client";

import Link from "next/link";
import { EyeOff, Info, LoaderCircle, Radar, RotateCcw, UserRound } from "lucide-react";
import { AUTO_SCENE_ID, DEMO_SCENES } from "@/data/seed";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { Area } from "@/types";
import { AnalysisPanel } from "./AnalysisPanel";
import type { DemoEvents } from "./useDemoEvents";

const BUSY_TEXT = {
  "loading-model": "Loading the AI model (about 12 MB, first time only)…",
  detecting: "New frame: looking for people…",
  checking: "Checking the camera picture…",
} as const;

const btn =
  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/** Buttons that play demo events on the live view, plus the explanation of what was decided. */
export function DemoControls({ area, demo }: { area: Area; demo: DemoEvents }) {
  const updateArea = useVisionGuard((s) => s.updateArea);
  const { busy, analysis, mode } = demo;
  const disabled = busy !== null;

  return (
    <section aria-labelledby="demo-heading" className="mt-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="demo-heading" className="flex items-center gap-2 font-semibold text-ink">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            Automatic monitoring is on
          </h2>
          <p className="mt-0.5 flex items-start gap-1.5 text-xs text-muted">
            <Info size={13} className="mt-0.5 shrink-0" />
            Every new camera frame is checked by itself: people are detected, their position is compared with each
            restricted zone and its hours, and an alert is raised for every zone that was entered. Only the camera is
            simulated, using the buttons below.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-muted">
          Demo photos
          <select
            value={area.sceneId}
            disabled={disabled}
            onChange={(e) => {
              updateArea(area.id, { sceneId: e.target.value });
              demo.reset();
            }}
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-medium text-ink"
          >
            <option value={AUTO_SCENE_ID}>Auto (match area name)</option>
            {DEMO_SCENES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <PhotoStatus demo={demo} />

      {area.zones.length === 0 && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No restricted zones yet, so nobody will trigger an alert.{" "}
          <Link href={`/areas/${area.id}/zone`} className="font-semibold underline">
            Draw a zone first
          </Link>
          .
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="mr-1 self-center text-xs font-semibold uppercase tracking-wider text-muted">Simulate camera:</span>
        <button
          type="button"
          disabled={disabled || mode === "person"}
          onClick={demo.personWalksIn}
          className={`${btn} bg-brand text-white hover:bg-brand-dark`}
        >
          <UserRound size={16} /> Person walks in
        </button>
        <button
          type="button"
          disabled={disabled || mode === "covered"}
          onClick={demo.coverCamera}
          className={`${btn} border border-line bg-white text-ink hover:border-danger hover:text-danger`}
        >
          <EyeOff size={16} /> Cover camera
        </button>
        <button
          type="button"
          disabled={disabled || mode === "empty"}
          onClick={demo.reset}
          className={`${btn} text-muted hover:bg-pale hover:text-ink`}
        >
          <RotateCcw size={16} /> Back to normal view
        </button>
      </div>

      {(busy || analysis) && (
        <div className="mt-4 border-t border-line pt-4">
          {busy ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <LoaderCircle size={16} className="animate-spin text-brand" /> <Radar size={15} className="text-brand" /> {BUSY_TEXT[busy]}
            </p>
          ) : (
            analysis && <AnalysisPanel analysis={analysis} />
          )}
        </div>
      )}
    </section>
  );
}

/** Which photo files are in use, or which names to add to /public/demo. */
function PhotoStatus({ demo }: { demo: DemoEvents }) {
  const { photos } = demo;
  if (photos.loading) return <p className="mt-3 text-xs text-muted">Looking for this area&apos;s photos…</p>;

  const file = (url: string | null) => (url ? url.split("/").pop() : null);
  if (!photos.empty) {
    return (
      <p className="mt-3 rounded-xl bg-pale px-3 py-2 text-xs text-muted">
        No photos found for this area, so a sample view is shown. Add{" "}
        <code className="font-mono text-ink">public/demo/{photos.expected.empty}</code> and{" "}
        <code className="font-mono text-ink">{photos.expected.person}</code>, then refresh.
      </p>
    );
  }
  return (
    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 rounded-xl bg-pale px-3 py-2 text-xs text-muted">
      <span>
        View: <code className="font-mono text-ink">{file(photos.empty)}</code>
      </span>
      <span>
        Person:{" "}
        {photos.person ? (
          <code className="font-mono text-ink">{file(photos.person)}</code>
        ) : (
          <span>
            missing (add <code className="font-mono text-ink">{photos.expected.person}</code>)
          </span>
        )}
      </span>
      <span>
        Covered:{" "}
        {photos.covered ? <code className="font-mono text-ink">{file(photos.covered)}</code> : "dark frame (optional photo)"}
      </span>
    </p>
  );
}

"use client";

import Link from "next/link";
import { Info, LoaderCircle } from "lucide-react";
import type { Area } from "@/types";
import { AnalysisPanel } from "./AnalysisPanel";
import type { Analysis, Busy } from "./useDemoEvents";

/** Monitoring status and the latest decision, for a live phone camera. */
export function LiveMonitorPanel({ area, analysis, busy }: { area: Area; analysis: Analysis | null; busy: Busy }) {
  return (
    <section aria-labelledby="live-heading" className="mt-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <h2 id="live-heading" className="flex items-center gap-2 font-semibold text-ink">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-success" />
        </span>
        Automatic monitoring is on · live camera
      </h2>
      <p className="mt-0.5 flex items-start gap-1.5 text-xs text-muted">
        <Info size={13} className="mt-0.5 shrink-0" />
        About every 1.5 seconds a frame of the live video is checked in this browser: people are detected, their
        position is compared with each restricted zone and its hours, and an alert is raised for every zone entered.
        After an alert, the same zone stays quiet for a minute. To test: walk into a zone, or cover the phone&apos;s lens.
      </p>

      {area.zones.length === 0 && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No restricted zones yet, so nobody will trigger an alert.{" "}
          <Link href={`/areas/${area.id}/zone`} className="font-semibold underline">
            Draw a zone first
          </Link>
          .
        </p>
      )}

      <div className="mt-4 border-t border-line pt-4">
        {busy === "loading-model" ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <LoaderCircle size={16} className="animate-spin text-brand" /> Loading the AI model (about 12 MB, first time only)…
          </p>
        ) : analysis ? (
          <AnalysisPanel analysis={analysis} />
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted">
            <LoaderCircle size={16} className="animate-spin text-brand" /> Waiting for the first frame…
          </p>
        )}
      </div>
    </section>
  );
}

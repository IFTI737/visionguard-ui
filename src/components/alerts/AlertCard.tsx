"use client";

import Link from "next/link";
import { EyeOff, ThumbsDown, ThumbsUp } from "lucide-react";
import { FeedFrame } from "@/components/camera/FeedFrame";
import { COVERED_FALLBACK } from "@/data/seed";
import { toSvgPoints } from "@/lib/geometry";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { AlertEvent, Zone } from "@/types";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const LEVEL_STYLE = {
  urgent: { bar: "bg-danger", chip: "bg-danger text-white", label: "Urgent" },
  notify: { bar: "bg-amber-400", chip: "bg-amber-400 text-ink", label: "Notify" },
  log: { bar: "bg-line", chip: "border border-line bg-pale text-muted", label: "Logged" },
} as const;

/** One alert: snapshot with boxes and zones, the reasons, and Real / False alarm feedback. */
export function AlertCard({ alert, zones }: { alert: AlertEvent; zones: Zone[] }) {
  const setStatus = useVisionGuard((s) => s.setAlertStatus);
  const style = LEVEL_STYLE[alert.level];

  return (
    <li className="relative overflow-hidden rounded-2xl border border-line bg-white">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${style.bar}`} />
      <div className="grid gap-4 p-4 pl-6 sm:grid-cols-[14rem_1fr]">
        {alert.snapshot ? (
          <FeedFrame
            src={alert.snapshot.image}
            fallback={alert.kind === "camera_blocked" ? COVERED_FALLBACK : undefined}
            alt="Alert snapshot"
            maxHeight="12rem"
            className="w-full rounded-xl"
          >
            {alert.kind === "intrusion" && (
              <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                {zones.map((z) => (
                  <polygon
                    key={z.id}
                    points={toSvgPoints(z.points)}
                    fill="rgba(229,72,77,0.22)"
                    stroke="#e5484d"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {alert.snapshot.boxes.map((b, i) => (
                  <rect
                    key={i}
                    x={b.x0 * 100}
                    y={b.y0 * 100}
                    width={(b.x1 - b.x0) * 100}
                    height={(b.y1 - b.y0) * 100}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
            )}
            {alert.kind === "camera_blocked" && (
              <span className="absolute inset-0 grid place-items-center text-white/70">
                <EyeOff size={28} />
              </span>
            )}
          </FeedFrame>
        ) : (
          <div className="aspect-video rounded-xl bg-pale" />
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style.chip}`}>
              {style.label}
            </span>
            {alert.score !== null && <span className="text-xs font-semibold text-muted">Risk score {alert.score}</span>}
            {alert.status === "new" && (
              <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-semibold text-brand">New</span>
            )}
            <span className="ml-auto font-mono text-xs text-muted">{timeFormat.format(new Date(alert.createdAt))}</span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-ink">{alert.title}</h3>
          <p className="text-xs text-muted">
            <Link href={`/areas/${alert.areaId}`} className="hover:text-brand hover:underline">
              {alert.areaName}
            </Link>
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-ink/85">
            {alert.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {alert.status === "new" ? (
              <>
                <button
                  type="button"
                  onClick={() => setStatus(alert.id, "confirmed")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:border-danger hover:text-danger"
                >
                  <ThumbsUp size={14} /> Real
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(alert.id, "false_alarm")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  <ThumbsDown size={14} /> False alarm
                </button>
              </>
            ) : (
              <span className="text-sm text-muted">
                Marked as <b className="text-ink">{alert.status === "confirmed" ? "real" : "false alarm"}</b>
                {" · "}
                <button type="button" onClick={() => setStatus(alert.id, "new")} className="font-semibold text-brand hover:underline">
                  undo
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

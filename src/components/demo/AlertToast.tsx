"use client";

import Link from "next/link";
import { BellRing, X } from "lucide-react";
import type { ToastState } from "./useDemoEvents";

/** Phone-style notification that slides in when alerts are sent to the owner. */
export function AlertToast({ toast, onClose }: { toast: ToastState | null; onClose: () => void }) {
  if (!toast) return null;
  const { alert, more } = toast;
  const urgent = alert.level === "urgent";
  return (
    <div
      role="alert"
      className="fixed right-4 top-20 z-[60] w-[min(22rem,calc(100vw-2rem))] animate-[toast-in_0.25s_ease-out] overflow-hidden rounded-2xl border border-line bg-white shadow-2xl shadow-ink/20"
    >
      <div
        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white ${
          urgent ? "bg-danger" : "bg-amber-500"
        }`}
      >
        <BellRing size={14} /> VisionGuard · {urgent ? "Urgent alert" : "Alert"}
        <button type="button" onClick={onClose} aria-label="Dismiss" className="ml-auto rounded p-0.5 hover:bg-white/20">
          <X size={14} />
        </button>
      </div>
      <div className="p-4">
        <p className="font-semibold text-ink">{alert.title}</p>
        <p className="mt-0.5 text-xs text-muted">
          {alert.areaName}
          {alert.score !== null && ` · risk score ${alert.score}`}
        </p>
        {more > 0 && (
          <p className="mt-2 rounded-lg bg-pale px-2.5 py-1.5 text-xs font-medium text-ink">
            + {more} more {more === 1 ? "alert" : "alerts"} from other zones in this view
          </p>
        )}
        <Link href="/alerts" onClick={onClose} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          {more > 0 ? `View all ${more + 1} alerts →` : "View alert →"}
        </Link>
      </div>
    </div>
  );
}

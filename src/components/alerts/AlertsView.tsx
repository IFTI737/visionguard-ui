"use client";

import { BellOff, Trash } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useHydrated } from "@/lib/useHydrated";
import { useVisionGuard } from "@/store/useVisionGuard";
import { AlertCard } from "./AlertCard";

export function AlertsView() {
  const hydrated = useHydrated();
  const alerts = useVisionGuard((s) => s.alerts);
  const areas = useVisionGuard((s) => s.areas);
  const clearAlerts = useVisionGuard((s) => s.clearAlerts);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-white" aria-hidden />;

  const newCount = alerts.filter((a) => a.status === "new").length;

  return (
    <>
      <PageHeader
        title="Alerts"
        description={
          alerts.length === 0
            ? "Everything VisionGuard raises appears here, newest first."
            : `${alerts.length} alert${alerts.length > 1 ? "s" : ""}${newCount ? `, ${newCount} new` : ""}. Mark each one as real or a false alarm; that feedback is how the system would learn.`
        }
        actions={
          alerts.length > 0 && (
            <button
              type="button"
              onClick={() => (confirmClear ? (clearAlerts(), setConfirmClear(false)) : setConfirmClear(true))}
              onBlur={() => setConfirmClear(false)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                confirmClear ? "bg-danger text-white" : "border border-line bg-white text-ink hover:border-danger hover:text-danger"
              }`}
            >
              <Trash size={15} /> {confirmClear ? "Click again to clear" : "Clear all"}
            </button>
          )
        }
      />

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-tint text-brand">
            <BellOff size={26} />
          </span>
          <p className="mt-4 text-lg font-semibold text-ink">No alerts yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Open a camera&apos;s live view and use the demo events to see how VisionGuard decides.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} zones={areas.find((ar) => ar.id === a.areaId)?.zones ?? []} />
          ))}
        </ul>
      )}
    </>
  );
}

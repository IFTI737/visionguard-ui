"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shapes, TriangleAlert, Unplug } from "lucide-react";
import { useRef } from "react";
import { AreaIcon } from "@/components/areas/AreaIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { useHydrated } from "@/lib/useHydrated";
import { useVisionGuard } from "@/store/useVisionGuard";
import { CameraFrame } from "./CameraFrame";
import { IpForm } from "./IpForm";

/** Simulated time to "reach" the camera, so the connecting state is visible in the demo. */
const CONNECT_DELAY_MS = 1400;

export function CameraView() {
  const { areaId } = useParams<{ areaId: string }>();
  const hydrated = useHydrated();
  const area = useVisionGuard((s) => s.areas.find((a) => a.id === areaId));
  const renameArea = useVisionGuard((s) => s.renameArea);
  const setCamera = useVisionGuard((s) => s.setCamera);
  const timer = useRef<number | null>(null);

  if (!hydrated) return <CameraViewSkeleton />;

  if (!area) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <p className="text-lg font-semibold text-ink">Area not found</p>
        <p className="mt-1 text-sm text-muted">It may have been removed or the demo was reset.</p>
        <ButtonLink href="/" variant="secondary" className="mt-5">
          Back to areas
        </ButtonLink>
      </div>
    );
  }

  const { status } = area.camera;

  const connect = (ip: string, port: number) => {
    setCamera(area.id, { ip, port, status: "connecting" });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCamera(area.id, { status: "connected" }), CONNECT_DELAY_MS);
  };

  const disconnect = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setCamera(area.id, { status: "disconnected" });
  };

  return (
    <div>
      {/* Header: back link and title on the left, editable area name on the right */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-brand">
            <ArrowLeft size={15} /> Areas
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {status === "live" ? "Live view" : "Connect a camera"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {status === "live"
              ? "This is what the camera sees. Next, mark the parts of this view that are restricted."
              : "Each area has one camera. Connect it to see the view and start monitoring."}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-line bg-white py-2 pl-2 pr-3">
          <span className="grid size-9 place-items-center rounded-lg bg-brand-tint text-brand">
            <AreaIcon kind={area.kind} size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Area name</p>
            <InlineEdit
              value={area.name}
              onSave={(name) => renameArea(area.id, name)}
              ariaLabel="Rename this area"
              className="-ml-1.5 max-w-[14rem] text-sm font-semibold text-ink"
            />
          </div>
          {area.hazard && (
            <span
              title="Hazard area"
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-danger-tint px-2 py-0.5 text-[11px] font-semibold text-danger"
            >
              <TriangleAlert size={11} /> Hazard
            </span>
          )}
        </div>
      </div>

      <CameraFrame area={area} onStartStreaming={() => setCamera(area.id, { status: "live" })} />

      <div className="mt-4">
        {status === "disconnected" ? (
          <IpForm initialIp={area.camera.ip} initialPort={area.camera.port} onConnect={connect} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-muted">
              Camera at <span className="font-mono text-ink">{area.camera.ip}:{area.camera.port}</span>
              {status === "connecting" && " · connecting"}
              {status === "connected" && " · connected, not streaming"}
              {status === "live" && " · streaming"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={disconnect}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-danger hover:text-danger"
              >
                <Unplug size={16} /> Disconnect
              </button>
              <button
                type="button"
                disabled
                title="Built in the next step"
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-line px-4 py-2.5 text-sm font-semibold text-muted"
              >
                <Shapes size={16} /> Define restricted zone
                <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Next step</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CameraViewSkeleton() {
  return (
    <div aria-hidden>
      <div className="mb-6 h-16 w-72 animate-pulse rounded-xl bg-white" />
      <div className="aspect-video w-full animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

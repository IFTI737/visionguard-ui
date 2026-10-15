"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shapes, Unplug } from "lucide-react";
import { useRef } from "react";
import { AreaNameChip } from "@/components/areas/AreaNameChip";
import { AlertToast } from "@/components/demo/AlertToast";
import { DemoControls } from "@/components/demo/DemoControls";
import { useDemoEvents } from "@/components/demo/useDemoEvents";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useHydrated } from "@/lib/useHydrated";
import { useVisionGuard } from "@/store/useVisionGuard";
import { newPairingCode } from "@/lib/pairing";
import { usePhoneLink } from "@/lib/phoneLink";
import { CameraFrame } from "./CameraFrame";
import { ConnectChooser } from "./ConnectChooser";
import { PhoneCameraView } from "./PhoneCameraView";

/** Simulated time to "reach" the camera, so the connecting state is visible in the demo. */
const CONNECT_DELAY_MS = 1400;

export function CameraView() {
  const { areaId } = useParams<{ areaId: string }>();
  const hydrated = useHydrated();
  const area = useVisionGuard((s) => s.areas.find((a) => a.id === areaId));
  const setCamera = useVisionGuard((s) => s.setCamera);
  const timer = useRef<number | null>(null);
  const demo = useDemoEvents(area?.camera.source === "phone" ? undefined : area);
  const phoneLink = usePhoneLink(area?.camera.source === "phone" ? area.camera.phoneCode : null);

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
  const isPhone = area.camera.source === "phone" && area.camera.phoneCode !== null;
  const showingLive = isPhone ? phoneLink?.status === "connected" : status === "live";

  const connect = (ip: string, port: number) => {
    setCamera(area.id, { ip, port, status: "connecting" });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCamera(area.id, { status: "connected" }), CONNECT_DELAY_MS);
  };

  const usePhone = () => {
    setCamera(area.id, { source: "phone", status: "connecting", phoneCode: newPairingCode() });
  };

  const disconnect = () => {
    if (timer.current) window.clearTimeout(timer.current);
    demo.reset();
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
            {showingLive ? "Live view" : isPhone ? "Pair a phone camera" : "Connect a camera"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {showingLive
              ? "This is what the camera sees. Next, mark the parts of this view that are restricted."
              : "Each area has one camera. Connect it to see the view and start monitoring."}
          </p>
        </div>

        <AreaNameChip area={area} />
      </div>

      {isPhone ? (
        <PhoneCameraView area={area} />
      ) : (
        <>
      <CameraFrame area={area} feed={demo.feed} onStartStreaming={() => setCamera(area.id, { status: "live" })} />

      <div className="mt-4">
        {status === "disconnected" ? (
          <ConnectChooser
            initialIp={area.camera.ip}
            initialPort={area.camera.port}
            onConnectIp={connect}
            onUsePhone={usePhone}
          />
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
              {status === "live" ? (
                <ButtonLink href={`/areas/${area.id}/zone`}>
                  <Shapes size={16} />
                  {area.zones.length === 0 ? "Define restricted zone" : `Edit zones (${area.zones.length})`}
                </ButtonLink>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Start streaming first"
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-line px-4 py-2.5 text-sm font-semibold text-muted"
                >
                  <Shapes size={16} /> Define restricted zone
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {status === "live" && <DemoControls area={area} demo={demo} />}
          <AlertToast toast={demo.toast} onClose={demo.dismissToast} />
        </>
      )}
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

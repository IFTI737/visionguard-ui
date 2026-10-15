"use client";

import { QrCode, Shapes, Unplug } from "lucide-react";
import { AlertToast } from "@/components/demo/AlertToast";
import { LiveMonitorPanel } from "@/components/demo/LiveMonitorPanel";
import { useLiveMonitoring } from "@/components/demo/useLiveMonitoring";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { formatCode, newPairingCode } from "@/lib/pairing";
import { stopPhoneLink, usePhoneLink } from "@/lib/phoneLink";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { Area } from "@/types";
import { LiveFeed } from "./CameraFrame";
import { PairingPanel } from "./PairingPanel";

/** Camera page body for a phone camera: QR pairing until the phone connects, then live video + monitoring. */
export function PhoneCameraView({ area }: { area: Area }) {
  const setCamera = useVisionGuard((s) => s.setCamera);
  const code = area.camera.phoneCode;
  const link = usePhoneLink(code);
  const stream = link?.status === "connected" ? link.stream : null;
  const monitor = useLiveMonitoring(area, stream);

  if (!code) return null;

  const newCode = () => {
    stopPhoneLink(code);
    setCamera(area.id, { phoneCode: newPairingCode() });
  };
  const disconnect = () => {
    stopPhoneLink(code);
    setCamera(area.id, { source: "ip", status: "disconnected", phoneCode: null });
  };

  return (
    <>
      {stream ? (
        <LiveFeed
          area={area}
          feed={{
            src: "",
            stream,
            checks: monitor.checks,
            label: "Phone camera · live",
            detail: `code ${formatCode(code)}${link?.route ? (link.route === "relay" ? " · via relay" : " · direct connection") : ""}`,
          }}
        />
      ) : (
        <PairingPanel code={code} link={link} />
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
        <p className="text-sm text-muted">
          Phone camera · code <span className="font-mono text-ink">{formatCode(code)}</span>
          {stream ? " · streaming live" : " · waiting for the phone"}
        </p>
        <div className="flex flex-wrap gap-2">
          {!stream && (
            <button
              type="button"
              onClick={newCode}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              <QrCode size={16} /> New code
            </button>
          )}
          <button
            type="button"
            onClick={disconnect}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-danger hover:text-danger"
          >
            <Unplug size={16} /> Disconnect
          </button>
          {stream ? (
            <ButtonLink href={`/areas/${area.id}/zone`}>
              <Shapes size={16} />
              {area.zones.length === 0 ? "Define restricted zone" : `Edit zones (${area.zones.length})`}
            </ButtonLink>
          ) : (
            <button
              type="button"
              disabled
              title="Connect the phone first"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-line px-4 py-2.5 text-sm font-semibold text-muted"
            >
              <Shapes size={16} /> Define restricted zone
            </button>
          )}
        </div>
      </div>

      {stream && <LiveMonitorPanel area={area} analysis={monitor.analysis} busy={monitor.busy} />}
      <AlertToast toast={monitor.toast} onClose={monitor.dismissToast} />
    </>
  );
}

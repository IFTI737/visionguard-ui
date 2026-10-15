"use client";

import { CircleAlert, LoaderCircle, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { LinkState } from "@/lib/phoneLink";
import { formatCode, phonePageUrl } from "@/lib/pairing";

const STEPS = [
  "Open the camera app on your phone and point it at this QR code.",
  "Tap the link that appears, then tap Start camera.",
  "Allow camera access and place the phone facing the area.",
];

/** Shown in the camera frame while waiting for a phone: QR code, pairing code and steps. */
export function PairingPanel({ code, link }: { code: string; link: LinkState | null }) {
  const url = phonePageUrl(window.location.origin, code);
  const [qr, setQr] = useState<{ url: string; data: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 1, width: 360, errorCorrectionLevel: "M", color: { dark: "#0b1b33", light: "#ffffff" } })
      .then((data) => {
        if (!cancelled) setQr({ url, data });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);

  // A phone can't open "localhost", and phones only allow the camera on https sites.
  const host = window.location.hostname;
  const insecure = !window.isSecureContext || host === "localhost" || host === "127.0.0.1";
  const status = link?.status ?? "starting";
  const failures = link?.failures ?? 0;
  // The phone reached us but the video couldn't get through, and there is no relay to fall back on.
  const blocked = failures > 0 && !link?.relay && status !== "linking";

  return (
    <div className="grid w-full gap-6 rounded-2xl border-2 border-dashed border-brand/40 bg-white p-5 sm:p-8 md:grid-cols-[auto_1fr] md:items-center">
      <div className="mx-auto flex flex-col items-center">
        <div className="rounded-2xl border border-line bg-white p-3 shadow-sm">
          {qr && qr.url === url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr.data} alt={`QR code for ${url}`} width={220} height={220} className="size-[220px]" />
          ) : (
            <div className="grid size-[220px] place-items-center">
              <LoaderCircle className="animate-spin text-brand" />
            </div>
          )}
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">Pairing code</p>
        <p className="font-mono text-2xl font-bold tracking-[0.2em] text-ink">{formatCode(code)}</p>
      </div>

      <div className="min-w-0">
        <p className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Smartphone size={20} className="text-brand" /> Use a phone as this camera
        </p>
        <ol className="mt-3 flex flex-col gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 text-sm text-ink">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-bold text-brand">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-3 break-all text-xs text-muted">
          Can&apos;t scan? Open <span className="font-mono text-ink">{url}</span> on the phone.
        </p>

        <div
          className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
            status === "error" || insecure || blocked ? "bg-danger-tint text-danger" : "bg-pale text-ink"
          }`}
        >
          {status === "error" || insecure || blocked ? (
            <CircleAlert size={17} className="mt-0.5 shrink-0" />
          ) : (
            <LoaderCircle size={17} className="mt-0.5 shrink-0 animate-spin text-brand" />
          )}
          <span>
            {insecure
              ? "This page is open on your own computer (localhost), which a phone can't reach, and phones only allow the camera on https sites. Open the deployed Vercel address of VisionGuard to pair a phone."
              : status === "linking"
                ? "Phone found. Starting the video…"
                : blocked
                  ? `The phone reached this computer, but the video couldn't get through the network (${failures} ${failures > 1 ? "tries" : "try"}). Many home routers and mobile networks block direct video. Turn on the relay server (TURN) for this site to fix it. Still retrying…`
                  : status === "waiting"
                ? failures > 0
                  ? "Video connection dropped; the phone is retrying through the relay…"
                  : "Waiting for the phone… keep this page open."
                : status === "error"
                  ? (link?.error ?? "Pairing problem; retrying…")
                  : (link?.error ?? "Getting ready…")}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">
          Video goes straight from the phone to this browser, encrypted, and is not stored anywhere.
          {link?.relay ? " A relay server is used automatically if a direct connection isn't possible." : ""}
        </p>
      </div>
    </div>
  );
}

"use client";

import { Network, QrCode, Smartphone } from "lucide-react";
import { useState } from "react";
import { IpForm } from "./IpForm";

interface ConnectChooserProps {
  initialIp: string;
  initialPort: number;
  onConnectIp: (ip: string, port: number) => void;
  onUsePhone: () => void;
}

/** Two ways to connect a camera: pair a phone by QR code, or enter an IP camera's address. */
export function ConnectChooser({ initialIp, initialPort, onConnectIp, onUsePhone }: ConnectChooserProps) {
  const [tab, setTab] = useState<"phone" | "ip">("phone");
  const tabClass = (active: boolean) =>
    `inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none ${
      active ? "bg-brand text-white shadow-sm" : "text-ink hover:bg-pale"
    }`;

  return (
    <div>
      <div role="tablist" aria-label="How to connect" className="mb-3 flex gap-1 rounded-xl border border-line bg-white p-1">
        <button type="button" role="tab" aria-selected={tab === "phone"} onClick={() => setTab("phone")} className={tabClass(tab === "phone")}>
          <QrCode size={16} /> Scan QR with a phone
        </button>
        <button type="button" role="tab" aria-selected={tab === "ip"} onClick={() => setTab("ip")} className={tabClass(tab === "ip")}>
          <Network size={16} /> IP camera address
        </button>
      </div>

      {tab === "phone" ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
              <Smartphone size={20} />
            </span>
            <div>
              <p className="font-semibold text-ink">Use any phone as a live camera</p>
              <p className="text-sm text-muted">
                No app needed. Show a QR code here, scan it with the phone, and its camera streams live to this page.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUsePhone}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition-colors hover:bg-brand-dark"
          >
            <QrCode size={16} /> Show QR code
          </button>
        </div>
      ) : (
        <IpForm initialIp={initialIp} initialPort={initialPort} onConnect={onConnectIp} />
      )}
    </div>
  );
}

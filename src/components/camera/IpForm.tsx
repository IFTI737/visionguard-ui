"use client";

import { Plug } from "lucide-react";
import { useState } from "react";
import { isPrivateIPv4, isValidIPv4, rtspPreview } from "@/lib/ip";

interface IpFormProps {
  initialIp: string;
  initialPort: number;
  onConnect: (ip: string, port: number) => void;
}

/** IP address + port fields with a Connect button. */
export function IpForm({ initialIp, initialPort, onConnect }: IpFormProps) {
  const [ip, setIp] = useState(initialIp);
  const [port, setPort] = useState(String(initialPort));
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIp = ip.trim();
    const portNum = Number(port);
    if (!isValidIPv4(cleanIp)) {
      setError("Enter an IP address like 192.168.0.64.");
      return;
    }
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      setError("Port must be a number between 1 and 65535.");
      return;
    }
    setError(null);
    onConnect(cleanIp, portNum);
  };

  const warnPublic = isValidIPv4(ip.trim()) && !isPrivateIPv4(ip.trim());

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_7rem_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink">Camera IP address</span>
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="192.168.0.64"
            aria-invalid={error ? true : undefined}
            aria-describedby="ip-help"
            className={`w-full rounded-lg border px-3.5 py-2.5 font-mono text-sm text-ink outline-none placeholder:text-muted/60 focus:border-brand focus:ring-3 focus:ring-brand-tint ${error ? "border-danger" : "border-line"}`}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink">Port</span>
          <input
            value={port}
            onChange={(e) => setPort(e.target.value.replace(/\D/g, "").slice(0, 5))}
            inputMode="numeric"
            className="w-full rounded-lg border border-line px-3.5 py-2.5 font-mono text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand-tint"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition-colors hover:bg-brand-dark"
        >
          <Plug size={16} /> Connect
        </button>
      </div>

      <div id="ip-help" className="mt-3 space-y-1 text-xs">
        {error ? (
          <p className="font-medium text-danger">{error}</p>
        ) : warnPublic ? (
          <p className="text-amber-700">
            This looks like a public internet address. Cameras are normally on the building&apos;s local network
            (192.168.x.x or 10.x.x.x).
          </p>
        ) : (
          <p className="text-muted">
            Stream address: <span className="font-mono text-ink">{rtspPreview(ip.trim(), Number(port) || 554)}</span>
          </p>
        )}
        <p className="text-muted">Demo build: any valid address connects, and a sample photo stands in for the feed.</p>
      </div>
    </form>
  );
}

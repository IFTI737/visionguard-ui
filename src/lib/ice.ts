"use client";

/** Free public STUN servers: enough when at least one side is on normal Wi-Fi. */
export const FREE_STUN: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

let cached: Promise<{ servers: RTCIceServer[]; relay: boolean }> | null = null;

/**
 * STUN servers plus, if the site has a Metered API key configured, TURN relay servers.
 * TURN is only used by WebRTC when a direct connection is impossible (common on mobile data).
 */
export function getIceServers() {
  if (!cached) {
    cached = fetch("/api/turn", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { iceServers: null }))
      .then((data: { iceServers: RTCIceServer[] | null }) =>
        data.iceServers?.length
          ? { servers: [...FREE_STUN, ...data.iceServers], relay: true }
          : { servers: FREE_STUN, relay: false },
      )
      .catch(() => ({ servers: FREE_STUN, relay: false }));
  }
  return cached;
}

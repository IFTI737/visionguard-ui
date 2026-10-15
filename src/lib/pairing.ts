/** Phone-camera pairing helpers shared by the dashboard and the phone page. */

/** PeerJS ids are global on the public server, so prefix ours to avoid clashes with other apps. */
const PEER_PREFIX = "visionguard-demo-cam-";

export const dashboardPeerId = (code: string) => `${PEER_PREFIX}${code}`;

/** Random 6-digit code, e.g. "482913". */
export function newPairingCode(): string {
  const n = typeof crypto !== "undefined" && "getRandomValues" in crypto
    ? crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
    : Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(6, "0");
}

export const isPairingCode = (code: string) => /^\d{6}$/.test(code);

/** "482913" → "482 913" for display. */
export const formatCode = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`;

/** Address the phone opens (the QR code contains this). */
export const phonePageUrl = (origin: string, code: string) => `${origin}/cam/${code}`;

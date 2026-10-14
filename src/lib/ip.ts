/** Checks a dotted IPv4 address such as 192.168.0.64. */
export function isValidIPv4(value: string): boolean {
  const parts = value.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255 && String(Number(p)) === p);
}

/** True for addresses used inside a home or building network (10.x, 172.16-31.x, 192.168.x). */
export function isPrivateIPv4(value: string): boolean {
  if (!isValidIPv4(value)) return false;
  const [a, b] = value.split(".").map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** Example stream address shown to the user; real cameras differ by brand. */
export function rtspPreview(ip: string, port: number): string {
  return `rtsp://${ip || "<camera-ip>"}:${port}/stream1`;
}

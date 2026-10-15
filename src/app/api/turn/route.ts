import { connection } from "next/server";

/**
 * Returns ICE servers (STUN + TURN relay) for the phone camera connection.
 * The Metered API key stays on the server; the browser only receives short-lived credentials.
 * Without METERED_API_KEY it returns { iceServers: null } and the app falls back to free STUN only.
 *
 * Env vars (in .env.local and in Vercel → Settings → Environment Variables):
 *   METERED_API_KEY  the credential API key from metered.ca (secret)
 *   METERED_DOMAIN   your app domain, e.g. yourname.metered.live
 */
export async function GET() {
  await connection(); // always run at request time: credentials are short-lived

  const key = process.env.METERED_API_KEY;
  const domain = process.env.METERED_DOMAIN;
  if (!key || !domain) return Response.json({ iceServers: null });

  try {
    const res = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
    if (!res.ok) return Response.json({ iceServers: null, error: `TURN provider returned ${res.status}` });
    const iceServers = (await res.json()) as RTCIceServer[];
    return Response.json({ iceServers });
  } catch {
    return Response.json({ iceServers: null, error: "Could not reach the TURN provider" });
  }
}

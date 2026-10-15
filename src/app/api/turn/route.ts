import { connection } from "next/server";

/**
 * Returns ICE servers (STUN + TURN relay) for the phone camera connection.
 * Secrets stay on the server; the browser only receives short-lived credentials.
 * With no provider configured it returns { iceServers: null } and the app uses free STUN only.
 *
 * Providers (first one configured wins). Set env vars in .env.local and in Vercel → Settings → Environment Variables:
 *   Cloudflare Realtime TURN (1,000 GB free per month):
 *     CLOUDFLARE_TURN_KEY_ID      the TURN key's id
 *     CLOUDFLARE_TURN_API_TOKEN   the TURN key's API token (secret)
 *   Metered (small free quota):
 *     METERED_DOMAIN   e.g. yourname.metered.live
 *     METERED_API_KEY  the credential API key (secret)
 */
type IceServers = RTCIceServer[];

async function fromCloudflare(keyId: string, token: string): Promise<IceServers> {
  const res = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ttl: 86400 }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cloudflare returned ${res.status}`);
  const data = (await res.json()) as { iceServers: IceServers | IceServers[number] };
  const list = Array.isArray(data.iceServers) ? data.iceServers : [data.iceServers];
  // Port 53 often times out in browsers, so drop it.
  return list.map((s) => ({
    ...s,
    urls: Array.isArray(s.urls) ? s.urls.filter((u) => !u.includes(":53")) : s.urls,
  }));
}

async function fromMetered(domain: string, key: string): Promise<IceServers> {
  const res = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(key)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Metered returned ${res.status}`);
  return (await res.json()) as IceServers;
}

export async function GET() {
  await connection(); // always run at request time: credentials are short-lived

  const cfId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const cfToken = process.env.CLOUDFLARE_TURN_API_TOKEN;
  const mDomain = process.env.METERED_DOMAIN;
  const mKey = process.env.METERED_API_KEY;

  try {
    if (cfId && cfToken) return Response.json({ iceServers: await fromCloudflare(cfId, cfToken), provider: "cloudflare" });
  } catch (e) {
    // Fall through to Metered if it is configured too.
    if (!(mDomain && mKey)) return Response.json({ iceServers: null, error: String(e instanceof Error ? e.message : e) });
  }
  try {
    if (mDomain && mKey) return Response.json({ iceServers: await fromMetered(mDomain, mKey), provider: "metered" });
  } catch (e) {
    return Response.json({ iceServers: null, error: String(e instanceof Error ? e.message : e) });
  }
  return Response.json({ iceServers: null });
}

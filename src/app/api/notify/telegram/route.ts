import { connection } from "next/server";

/**
 * Sends VisionGuard alerts to the owner's Telegram chat.
 * The bot token and chat id stay on the server (Vercel → Settings → Environment Variables, and .env.local):
 *   TELEGRAM_BOT_TOKEN   from @BotFather (secret)
 *   TELEGRAM_CHAT_ID     the chat to send to
 * Without them, GET reports { configured: false } and POST answers 503.
 */
const MAX_PHOTO_BYTES = 1_500_000;
/** Simple brake against spam: at most this many messages per minute (per server instance). */
const MAX_PER_MINUTE = 12;
const recent: number[] = [];

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

interface Payload {
  test?: boolean;
  kind?: string;
  level?: string;
  title?: string;
  areaName?: string;
  score?: number | null;
  reasons?: string[];
  createdAt?: number;
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function buildText(p: Payload): string {
  if (p.test) return "✅ VisionGuard is connected to Telegram. Alerts will arrive here.";
  const head =
    p.kind === "camera_offline"
      ? "📴 CAMERA OFFLINE"
      : p.kind === "camera_blocked"
        ? "🙈 CAMERA BLOCKED"
        : p.level === "urgent"
          ? "🚨 URGENT ALERT"
          : "⚠️ ALERT";
  const reasons = (Array.isArray(p.reasons) ? p.reasons : []).slice(0, 6).map((r) => `• ${clip(r, 200)}`);
  const when = typeof p.createdAt === "number" ? new Date(p.createdAt) : new Date();
  return [
    `${head} · VisionGuard`,
    clip(p.title, 200),
    `Area: ${clip(p.areaName, 100)}`,
    typeof p.score === "number" ? `Risk score: ${Math.round(p.score)}` : null,
    "",
    ...reasons,
    "",
    `Time: ${timeFormat.format(when)} (Dhaka)`,
  ]
    .filter((l) => l !== null)
    .join("\n")
    .slice(0, 1000);
}

/** Only accept calls made by pages of this same site. */
function sameSite(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function GET() {
  await connection();
  return Response.json({ configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) });
}

export async function POST(req: Request) {
  await connection();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return Response.json({ ok: false, error: "Telegram is not set up on this site yet." }, { status: 503 });
  }
  if (!sameSite(req)) return Response.json({ ok: false, error: "Not allowed." }, { status: 403 });

  const now = Date.now();
  while (recent.length && now - recent[0] > 60_000) recent.shift();
  if (recent.length >= MAX_PER_MINUTE) {
    return Response.json({ ok: false, error: "Too many messages; slow down." }, { status: 429 });
  }
  recent.push(now);

  let payload: Payload;
  let photo: File | null = null;
  try {
    const form = await req.formData();
    payload = JSON.parse(String(form.get("payload") ?? "{}")) as Payload;
    const file = form.get("photo");
    if (file instanceof File && file.size > 0 && file.size <= MAX_PHOTO_BYTES && file.type.startsWith("image/")) {
      photo = file;
    }
  } catch {
    return Response.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const text = buildText(payload);
  const api = (method: string) => `https://api.telegram.org/bot${token}/${method}`;
  try {
    let res: Response;
    if (photo && !payload.test) {
      const out = new FormData();
      out.set("chat_id", chatId);
      out.set("caption", text);
      out.set("photo", photo, "alert.jpg");
      res = await fetch(api("sendPhoto"), { method: "POST", body: out });
    } else {
      res = await fetch(api("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    }
    const data = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (!res.ok || !data?.ok) {
      return Response.json({ ok: false, error: data?.description ?? `Telegram returned ${res.status}.` }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "Could not reach Telegram." }, { status: 502 });
  }
}

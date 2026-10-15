import type { AlertEvent, Zone } from "@/types";

export interface TelegramResult {
  ok: boolean;
  error?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the snapshot."));
    img.src = src;
  });
}

/** The alert's snapshot with the restricted zones and the detected people drawn on it. */
async function renderAlertImage(alert: AlertEvent, zones: Zone[]): Promise<Blob | null> {
  const src = alert.snapshot?.image;
  if (!src) return null;
  const img = await loadImage(src);
  const w = Math.min(img.naturalWidth, 960);
  const h = Math.round((img.naturalHeight * w) / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.drawImage(img, 0, 0, w, h);

  if (alert.kind === "intrusion") {
    const line = Math.max(2, Math.round(w / 220));
    g.lineWidth = line;
    for (const z of zones) {
      g.beginPath();
      z.points.forEach(([x, y], i) => (i === 0 ? g.moveTo(x * w, y * h) : g.lineTo(x * w, y * h)));
      g.closePath();
      g.fillStyle = "rgba(229,72,77,0.25)";
      g.strokeStyle = "#e5484d";
      g.fill();
      g.stroke();
    }
    g.strokeStyle = "#ffffff";
    g.lineWidth = line + 1;
    for (const b of alert.snapshot?.boxes ?? []) {
      g.strokeRect(b.x0 * w, b.y0 * h, (b.x1 - b.x0) * w, (b.y1 - b.y0) * h);
    }
  }
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82));
}

async function post(form: FormData): Promise<TelegramResult> {
  try {
    const res = await fetch("/api/notify/telegram", { method: "POST", body: form });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (res.ok && data?.ok) return { ok: true };
    return { ok: false, error: data?.error ?? `Request failed (${res.status}).` };
  } catch {
    return { ok: false, error: "Could not reach the VisionGuard server." };
  }
}

/** Send an alert (with its snapshot photo, if it has one) to the owner's Telegram. */
export async function sendTelegramAlert(alert: AlertEvent, zones: Zone[] = []): Promise<TelegramResult> {
  const form = new FormData();
  form.set(
    "payload",
    JSON.stringify({
      kind: alert.kind,
      level: alert.level,
      title: alert.title,
      areaName: alert.areaName,
      score: alert.score,
      reasons: alert.reasons,
      createdAt: alert.createdAt,
    }),
  );
  try {
    const photo = await renderAlertImage(alert, zones);
    if (photo) form.set("photo", photo, "alert.jpg");
  } catch {
    /* send the text without a photo */
  }
  return post(form);
}

export function sendTelegramTest(): Promise<TelegramResult> {
  const form = new FormData();
  form.set("payload", JSON.stringify({ test: true }));
  return post(form);
}

/** Has the site owner set up the Telegram bot (token and chat id on the server)? */
export async function isTelegramConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/notify/telegram", { cache: "no-store" });
    const data = (await res.json()) as { configured?: boolean };
    return data.configured === true;
  } catch {
    return false;
  }
}

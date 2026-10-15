"use client";

import { Bell, LoaderCircle, MessageCircle, PhoneCall, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { playAlertSound, unlockAudio } from "@/lib/alertSound";
import { isTelegramConfigured, sendTelegramTest } from "@/lib/telegram";
import { useHydrated } from "@/lib/useHydrated";
import { useVisionGuard } from "@/store/useVisionGuard";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-brand" : "bg-line"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function Card({ icon, title, hint, right, children }: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">{icon}</div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{hint}</p>
        </div>
        {right}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

const btn =
  "inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink hover:bg-pale disabled:opacity-60";

export function SettingsView() {
  const hydrated = useHydrated();
  const settings = useVisionGuard((s) => s.settings);
  const setChannel = useVisionGuard((s) => s.setChannel);
  const setSound = useVisionGuard((s) => s.setSound);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    isTelegramConfigured().then((v) => alive && setConfigured(v));
    return () => {
      alive = false;
    };
  }, []);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-white" aria-hidden />;

  const soundOn = settings.sound !== false;

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    const r = await sendTelegramTest();
    setTesting(false);
    setResult(r.ok ? { ok: true, text: "Sent. Check Telegram." } : { ok: false, text: r.error ?? "Could not send." });
  };

  return (
    <>
      <PageHeader title="Settings" description="Choose how VisionGuard reaches you when something happens." />
      <div className="grid max-w-3xl gap-4">
        <Card
          icon={<Volume2 className="h-5 w-5" />}
          title="Alert sound"
          hint="Plays on this computer when a new alert appears."
          right={<Toggle on={soundOn} onChange={setSound} label="Alert sound" />}
        >
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={() => { unlockAudio(); playAlertSound("notify"); }}>
              Test alert sound
            </button>
            <button type="button" className={btn} onClick={() => { unlockAudio(); playAlertSound("urgent"); }}>
              Test urgent siren
            </button>
          </div>
        </Card>

        <Card
          icon={<MessageCircle className="h-5 w-5" />}
          title="Telegram"
          hint="Get a message with a photo on your phone. Free."
          right={
            <Toggle
              on={settings.channels.telegram}
              onChange={(v) => setChannel("telegram", v)}
              label="Telegram alerts"
            />
          }
        >
          <p className="text-sm">
            Status:{" "}
            {configured === null ? (
              <span className="text-muted">checking…</span>
            ) : configured ? (
              <span className="font-medium text-success">Bot connected on the server</span>
            ) : (
              <span className="font-medium text-danger">Not set up yet</span>
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className={btn} disabled={testing || !configured} onClick={runTest}>
              {testing && <LoaderCircle className="h-4 w-4 animate-spin" />}
              Send test message
            </button>
            {result && (
              <span className={`text-sm ${result.ok ? "text-success" : "text-danger"}`}>{result.text}</span>
            )}
          </div>
          {!configured && configured !== null && (
            <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-muted">
              <li>In Telegram, open <b>@BotFather</b>, send <code>/newbot</code> and follow the steps. It gives you a token.</li>
              <li>Open your new bot and press <b>Start</b>.</li>
              <li>In your own browser open <code>https://api.telegram.org/bot&lt;YOUR_TOKEN&gt;/getUpdates</code> and find <code>chat → id</code>.</li>
              <li>Add <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_CHAT_ID</code> in Vercel (Settings → Environment Variables) and in <code>.env.local</code>, then redeploy.</li>
              <li>Keep the token private. Never paste it into the code or share it.</li>
            </ol>
          )}
          <p className="mt-3 text-xs text-muted">
            Messages are sent while a VisionGuard page is open in a browser. Turn this on in each browser you use.
          </p>
        </Card>

        <Card
          icon={<PhoneCall className="h-5 w-5" />}
          title="Phone call / SMS"
          hint="Needs a paid service. Coming later."
        />
        <Card icon={<Bell className="h-5 w-5" />} title="Browser push" hint="Coming later." />
      </div>
    </>
  );
}

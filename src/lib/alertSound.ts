/**
 * Alert sounds, made in the browser (no audio files).
 * Browsers only allow sound after the person has clicked or tapped the page once,
 * so the audio engine is unlocked on the first interaction.
 */
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Allow sound to play (call from a click/tap handler). */
export function unlockAudio(): void {
  const c = getContext();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}

let listening = false;

/** Unlock the sound engine on the first click, tap or key press anywhere on the page. */
export function unlockOnFirstGesture(): void {
  if (listening || typeof window === "undefined") return;
  listening = true;
  const unlock = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

function tone(c: AudioContext, at: number, freq: number, length: number, volume: number, type: OscillatorType) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(c.destination);
  osc.start(at);
  osc.stop(at + length + 0.05);
}

/** Play the alert sound. Returns false if the browser has not allowed sound yet. */
export function playAlertSound(level: "notify" | "urgent"): boolean {
  const c = getContext();
  if (!c || c.state !== "running") return false;
  const t = c.currentTime + 0.02;
  if (level === "urgent") {
    // Siren-like: four quick high/low pairs.
    for (let i = 0; i < 4; i++) {
      tone(c, t + i * 0.42, 960, 0.2, 0.3, "square");
      tone(c, t + i * 0.42 + 0.21, 720, 0.2, 0.3, "square");
    }
  } else {
    // Two-note "ding-dong".
    tone(c, t, 880, 0.25, 0.25, "sine");
    tone(c, t + 0.27, 660, 0.35, 0.25, "sine");
  }
  return true;
}

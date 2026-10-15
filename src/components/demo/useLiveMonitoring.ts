"use client";

import { useEffect, useRef, useState } from "react";
import { BLOCKED_CAMERA } from "@/data/seed";
import { checkFrameHealth } from "@/lib/cameraHealth";
import { detectPeopleIn, loadDetector } from "@/lib/detector";
import { checkPeople, decideByZone, type PersonCheck } from "@/lib/risk";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { AlertEvent, Area } from "@/types";
import type { Analysis, Busy, ToastState } from "./useDemoEvents";

/** How often a frame of the live video is checked. */
const CHECK_EVERY_MS = 1500;
/** After alerting for a zone (or a blocked camera), stay quiet about it for this long. */
const COOLDOWN_MS = 60_000;
const TOAST_MS = 9000;
/** Frames are shrunk to this width before checking; plenty for the 640-pixel model. */
const FRAME_WIDTH = 640;
const SNAPSHOT_WIDTH = 480;

/**
 * Automatic monitoring of a live video stream (a paired phone camera).
 * About every 1.5 s it grabs a frame and runs the same checks as the demo photos:
 * camera-blocked check, person detection, zones and hours, risk score, and one alert per zone.
 * Repeated alerts for the same zone are held back for a minute.
 */
export function useLiveMonitoring(area: Area | undefined, stream: MediaStream | null) {
  const addAlert = useVisionGuard((s) => s.addAlert);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [checks, setChecks] = useState<PersonCheck[]>([]);

  const areaRef = useRef(area);
  const lastAlert = useRef(new Map<string, number>());
  const toastTimer = useRef<number | null>(null);

  // Keep the latest zones available to the monitoring loop without restarting it.
  useEffect(() => {
    areaRef.current = area;
  }, [area]);

  const areaId = area?.id;

  useEffect(() => {
    if (!stream || !areaId) return;
    let stopped = false;
    let timer: number | null = null;

    // A hidden video element reads frames from the stream independently of what is on screen.
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    void video.play().catch(() => {});
    const frame = document.createElement("canvas");
    const snap = document.createElement("canvas");

    const showToast = (alerts: AlertEvent[]) => {
      const notified = alerts.filter((a) => a.level !== "log");
      if (notified.length === 0) return;
      setToast({ alert: notified[0], more: notified.length - 1 });
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
    };

    const snapshot = (): string => {
      snap.width = SNAPSHOT_WIDTH;
      snap.height = Math.round((frame.height / frame.width) * SNAPSHOT_WIDTH);
      snap.getContext("2d")?.drawImage(frame, 0, 0, snap.width, snap.height);
      return snap.toDataURL("image/jpeg", 0.68);
    };

    /** True if this key is outside its cooldown; marks it as alerted now. */
    const due = (key: string, now: number) => {
      const last = lastAlert.current.get(key) ?? 0;
      if (now - last < COOLDOWN_MS) return false;
      lastAlert.current.set(key, now);
      return true;
    };

    const check = async () => {
      const current = areaRef.current;
      if (!current || !video.videoWidth) return;

      frame.width = FRAME_WIDTH;
      frame.height = Math.round((video.videoHeight / video.videoWidth) * FRAME_WIDTH);
      frame.getContext("2d", { willReadFrequently: true })?.drawImage(video, 0, 0, frame.width, frame.height);
      const nowMs = Date.now();

      // 1. Is the camera covered or blacked out? (simple image check, not AI)
      const health = checkFrameHealth(frame);
      if (health.blocked) {
        const fresh = due(`${current.id}|blocked`, nowMs);
        const alerts: AlertEvent[] = [];
        if (fresh) {
          const reasons: string[] = [];
          if (health.brightness < BLOCKED_CAMERA.maxBrightness) reasons.push(`Picture is very dark (brightness ${health.brightness} of 255)`);
          if (health.contrast < BLOCKED_CAMERA.maxContrast) reasons.push(`Picture has almost no detail (contrast ${health.contrast})`);
          reasons.push("The camera may be covered, blocked or switched off");
          alerts.push(
            addAlert({
              areaId: current.id,
              areaName: current.name,
              kind: "camera_blocked",
              level: "notify",
              title: `${current.name} camera view blocked`,
              reasons,
              score: null,
              snapshot: { image: snapshot(), boxes: [] },
            }),
          );
          showToast(alerts);
        }
        setChecks([]);
        setAnalysis({ kind: "blocked", image: "live", health, alerts, repeated: !fresh, checkedAt: nowMs });
        return;
      }

      // 2. People, zones, hours, risk.
      const result = await detectPeopleIn(frame, frame.width, frame.height);
      if (stopped) return;
      const now = new Date();
      const found = checkPeople(result.people, current.zones, now);
      const decisions = decideByZone(found, now);
      const fresh = decisions.filter((d) => due(`${current.id}|${d.zone.id}`, nowMs));
      const image = fresh.length > 0 ? snapshot() : "";
      const alerts = fresh.map((d) =>
        addAlert({
          areaId: current.id,
          areaName: current.name,
          kind: "intrusion",
          level: d.level === "ignore" ? "log" : d.level,
          title: d.people > 1 ? `${d.people} people in ${d.zone.name}` : `Person in ${d.zone.name}`,
          reasons: d.people > 1 ? [`${d.people} people detected inside this zone`, ...d.reasons] : d.reasons,
          score: d.score,
          snapshot: { image, boxes: result.people },
        }),
      );
      showToast(alerts);
      setChecks(found);
      setAnalysis({
        kind: "scan",
        image: "live",
        checks: found,
        decisions,
        inferenceMs: result.inferenceMs,
        alerts,
        repeated: decisions.length > fresh.length,
        checkedAt: nowMs,
      });
    };

    const loop = async () => {
      if (stopped) return;
      try {
        await check();
      } catch (err) {
        if (!stopped) setAnalysis({ kind: "error", message: err instanceof Error ? err.message : "Live check failed." });
      }
      if (!stopped) timer = window.setTimeout(loop, CHECK_EVERY_MS);
    };

    // Load the model first (about 12 MB, once), then start checking.
    const start = window.setTimeout(async () => {
      setBusy("loading-model");
      try {
        await loadDetector();
      } catch (err) {
        if (!stopped) setAnalysis({ kind: "error", message: err instanceof Error ? err.message : "Could not load the AI model." });
      }
      if (stopped) return;
      setBusy(null);
      void loop();
    }, 0);

    return () => {
      stopped = true;
      window.clearTimeout(start);
      if (timer) window.clearTimeout(timer);
      video.srcObject = null;
      setChecks([]);
    };
    // Restart only when the stream or the area changes; zones are read from areaRef on every check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, areaId]);

  return { analysis, busy, toast, dismissToast: () => setToast(null), checks };
}

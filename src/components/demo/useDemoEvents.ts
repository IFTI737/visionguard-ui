"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveFeedView } from "@/components/camera/CameraFrame";
import { PLACEHOLDER_IMAGE } from "@/components/camera/FeedFrame";
import { useAreaPhotos } from "@/components/camera/useAreaPhotos";
import { BLOCKED_CAMERA, COVERED_FALLBACK } from "@/data/seed";
import { checkCameraView, type CameraHealth } from "@/lib/cameraHealth";
import { detectPeople, loadDetector } from "@/lib/detector";
import { checkPeople, decideByZone, type PersonCheck, type ZoneDecision } from "@/lib/risk";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { AlertEvent, Area } from "@/types";

/** What the simulated camera is showing. */
export type FeedMode = "empty" | "person" | "covered";
export type Busy = null | "loading-model" | "detecting" | "checking";

export type Analysis =
  | {
      kind: "scan";
      image: string;
      checks: PersonCheck[];
      /** One per restricted zone with someone in it, most serious first. */
      decisions: ZoneDecision[];
      inferenceMs: number;
      /** Alerts raised by this check (empty if they were already raised for this same frame). */
      alerts: AlertEvent[];
      repeated: boolean;
      checkedAt: number;
    }
  | { kind: "blocked"; image: string; health: CameraHealth; alerts: AlertEvent[]; repeated: boolean; checkedAt: number }
  | { kind: "error"; message: string };

export interface ToastState {
  alert: AlertEvent;
  /** Further alerts raised at the same moment. */
  more: number;
}

const TOAST_MS = 9000;

/**
 * Frames already turned into alerts during this visit, so the same frame and zone setup
 * never raises the same alert twice (a real system would also wait before repeating).
 */
const alertedFrames = new Set<string>();

/** Short fingerprint of the zones, so redrawing a zone or changing its hours re-checks the frame. */
function zonesKey(area: Area | undefined): string {
  if (!area) return "";
  return area.zones
    .map((z) => `${z.id}:${z.alwaysOn ? 1 : 0}:${z.schedule.from}-${z.schedule.to}:${z.points.map((p) => p.map((v) => v.toFixed(3)).join(",")).join(";")}`)
    .join("|");
}

/**
 * Automatic monitoring of the live view.
 * The camera is simulated with still photos, but whenever the frame changes VisionGuard checks it
 * by itself: it detects people (YOLOv8n in the browser), checks each person's feet against every
 * restricted zone and its hours, scores the risk, and raises one alert per zone that was entered.
 * A covered camera is caught by a simple brightness/contrast check.
 */
export function useDemoEvents(area: Area | undefined) {
  const addAlert = useVisionGuard((s) => s.addAlert);
  const [mode, setMode] = useState<FeedMode>("empty");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<number | null>(null);
  const runId = useRef(0);

  const photos = useAreaPhotos(area);
  const live = area?.camera.status === "live";
  const emptySrc = photos.empty ?? PLACEHOLDER_IMAGE;
  const coveredSrc = photos.covered ?? COVERED_FALLBACK;
  const src = mode === "person" ? (photos.person ?? emptySrc) : mode === "covered" ? coveredSrc : emptySrc;

  const feed: LiveFeedView = {
    src,
    fallback: mode === "covered" ? COVERED_FALLBACK : undefined,
    checks: analysis?.kind === "scan" && analysis.image === src ? analysis.checks : [],
    covered: mode === "covered",
  };

  const showToast = (alerts: AlertEvent[]) => {
    const notified = alerts.filter((a) => a.level !== "log");
    if (notified.length === 0) return;
    setToast({ alert: notified[0], more: notified.length - 1 });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  };
  const dismissToast = () => setToast(null);

  /** Detect people in a frame and raise one alert per restricted zone with someone in it. */
  const scanFrame = async (current: Area, image: string, frameKey: string) => {
    const id = ++runId.current;
    setAnalysis(null);
    try {
      setBusy("loading-model");
      await loadDetector();
      if (id !== runId.current) return;
      setBusy("detecting");
      const result = await detectPeople(image);
      if (id !== runId.current) return;

      const now = new Date();
      const checks = checkPeople(result.people, current.zones, now);
      const decisions = decideByZone(checks, now);
      const repeated = alertedFrames.has(frameKey);
      const alerts = repeated
        ? []
        : decisions.map((d) =>
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
      alertedFrames.add(frameKey);
      showToast(alerts);
      setAnalysis({
        kind: "scan",
        image,
        checks,
        decisions,
        inferenceMs: result.inferenceMs,
        alerts,
        repeated: repeated && decisions.length > 0,
        checkedAt: Date.now(),
      });
    } catch (err) {
      if (id === runId.current) {
        setAnalysis({ kind: "error", message: err instanceof Error ? err.message : "Detection failed." });
      }
    } finally {
      if (id === runId.current) setBusy(null);
    }
  };

  /** Brightness/contrast check for a covered or blacked-out camera. */
  const checkFrame = async (current: Area, image: string, frameKey: string) => {
    const id = ++runId.current;
    setAnalysis(null);
    setBusy("checking");
    try {
      let checked = image;
      let health: CameraHealth;
      try {
        health = await checkCameraView(checked);
      } catch {
        // No covered photo for this area: check the dark fallback frame that is on screen instead.
        checked = COVERED_FALLBACK;
        health = await checkCameraView(checked);
      }
      if (id !== runId.current) return;

      const repeated = alertedFrames.has(frameKey);
      const alerts: AlertEvent[] = [];
      if (health.blocked && !repeated) {
        const reasons: string[] = [];
        if (health.brightness < BLOCKED_CAMERA.maxBrightness) {
          reasons.push(`Picture is very dark (brightness ${health.brightness} of 255)`);
        }
        if (health.contrast < BLOCKED_CAMERA.maxContrast) {
          reasons.push(`Picture has almost no detail (contrast ${health.contrast})`);
        }
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
            snapshot: { image: checked, boxes: [] },
          }),
        );
      }
      alertedFrames.add(frameKey);
      showToast(alerts);
      setAnalysis({ kind: "blocked", image: checked, health, alerts, repeated: repeated && health.blocked, checkedAt: Date.now() });
    } catch (err) {
      if (id === runId.current) {
        setAnalysis({ kind: "error", message: err instanceof Error ? err.message : "Camera check failed." });
      }
    } finally {
      if (id === runId.current) setBusy(null);
    }
  };

  // Automatic monitoring: check every new frame while the camera is live.
  const frameKey = area && live && !photos.loading ? `${area.id}|${mode}|${src}|${zonesKey(area)}` : null;
  useEffect(() => {
    if (!frameKey || !area) return;
    // Start on the next tick so the new frame is on screen first.
    const t = window.setTimeout(() => {
      if (mode === "covered") void checkFrame(area, src, frameKey);
      else void scanFrame(area, src, frameKey);
    }, 0);
    return () => window.clearTimeout(t);
    // The frame key captures everything that should trigger a new check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey]);

  // Simulated camera: these only change what the camera "sees". The checks above run by themselves.
  const personWalksIn = () => {
    if (!photos.person) {
      setAnalysis({
        kind: "error",
        message: `No person photo for this area yet. Add public/demo/${photos.expected.person} (same view, with someone in it).`,
      });
      return;
    }
    setMode("person");
  };
  const coverCamera = () => setMode("covered");
  const reset = () => setMode("empty");

  return { photos, mode, live, feed, analysis, busy, toast, dismissToast, personWalksIn, coverCamera, reset };
}

export type DemoEvents = ReturnType<typeof useDemoEvents>;

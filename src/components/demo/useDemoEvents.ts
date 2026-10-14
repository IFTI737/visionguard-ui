"use client";

import { useRef, useState } from "react";
import type { LiveFeedView } from "@/components/camera/CameraFrame";
import { COVERED_FALLBACK, BLOCKED_CAMERA, findScene } from "@/data/seed";
import { checkCameraView, type CameraHealth } from "@/lib/cameraHealth";
import { detectPeople, loadDetector } from "@/lib/detector";
import { checkPeople, decide, type PersonCheck, type RiskDecision } from "@/lib/risk";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { AlertEvent, Area } from "@/types";

export type FeedMode = "empty" | "person" | "covered";
export type Busy = null | "loading-model" | "detecting" | "checking";

export type Analysis =
  | {
      kind: "scan";
      image: string;
      checks: PersonCheck[];
      decision: RiskDecision;
      inferenceMs: number;
      alert: AlertEvent | null;
    }
  | { kind: "blocked"; image: string; health: CameraHealth; alert: AlertEvent | null }
  | { kind: "error"; message: string };

const TOAST_MS = 9000;

/**
 * Demo events on the live view. The camera is a still photo, but everything after that is real:
 * the person detector runs in the browser, and the zone, hours, risk and camera-health checks
 * use the zones and settings the user created.
 */
export function useDemoEvents(area: Area | undefined) {
  const addAlert = useVisionGuard((s) => s.addAlert);
  const [mode, setMode] = useState<FeedMode>("empty");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [toast, setToast] = useState<AlertEvent | null>(null);
  const toastTimer = useRef<number | null>(null);
  // Each run gets a number; results from an older run are ignored.
  const runId = useRef(0);

  const scene = findScene(area?.sceneId);
  const coveredSrc = scene.covered ?? COVERED_FALLBACK;
  const src = mode === "person" ? (scene.person ?? scene.empty) : mode === "covered" ? coveredSrc : scene.empty;

  const feed: LiveFeedView = {
    src,
    fallback: mode === "covered" ? COVERED_FALLBACK : undefined,
    checks: analysis?.kind === "scan" && analysis.image === src ? analysis.checks : [],
    covered: mode === "covered",
  };

  const showToast = (alert: AlertEvent) => {
    setToast(alert);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  };
  const dismissToast = () => setToast(null);

  const scan = async (image: string) => {
    if (!area) return;
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
      const checks = checkPeople(result.people, area.zones, now);
      const decision = decide(checks, now);
      let alert: AlertEvent | null = null;
      if (decision.level !== "ignore" && decision.person?.zone) {
        alert = addAlert({
          areaId: area.id,
          areaName: area.name,
          kind: "intrusion",
          level: decision.level,
          title: `Person in ${decision.person.zone.name}`,
          reasons: decision.reasons,
          score: decision.score,
          snapshot: { image, boxes: result.people },
        });
        if (decision.level !== "log") showToast(alert);
      }
      setAnalysis({ kind: "scan", image, checks, decision, inferenceMs: result.inferenceMs, alert });
    } catch (err) {
      if (id === runId.current) {
        setAnalysis({ kind: "error", message: err instanceof Error ? err.message : "Detection failed." });
      }
    } finally {
      if (id === runId.current) setBusy(null);
    }
  };

  const personWalksIn = () => {
    if (!scene.person) {
      setAnalysis({ kind: "error", message: `The “${scene.label}” scene has no person photo yet.` });
      return;
    }
    setMode("person");
    void scan(scene.person);
  };

  const scanView = () => {
    if (mode !== "covered") void scan(src);
  };

  const coverCamera = async () => {
    if (!area) return;
    const id = ++runId.current;
    setMode("covered");
    setAnalysis(null);
    setBusy("checking");
    try {
      let image = coveredSrc;
      let health: CameraHealth;
      try {
        health = await checkCameraView(image);
      } catch {
        // No covered photo for this scene: check the dark fallback frame that is on screen instead.
        image = COVERED_FALLBACK;
        health = await checkCameraView(image);
      }
      if (id !== runId.current) return;

      let alert: AlertEvent | null = null;
      if (health.blocked) {
        const reasons: string[] = [];
        if (health.brightness < BLOCKED_CAMERA.maxBrightness) {
          reasons.push(`Picture is very dark (brightness ${health.brightness} of 255)`);
        }
        if (health.contrast < BLOCKED_CAMERA.maxContrast) {
          reasons.push(`Picture has almost no detail (contrast ${health.contrast})`);
        }
        reasons.push("The camera may be covered, blocked or switched off");
        alert = addAlert({
          areaId: area.id,
          areaName: area.name,
          kind: "camera_blocked",
          level: "notify",
          title: `${area.name} camera view blocked`,
          reasons,
          score: null,
          snapshot: { image, boxes: [] },
        });
        showToast(alert);
      }
      setAnalysis({ kind: "blocked", image, health, alert });
    } catch (err) {
      if (id === runId.current) {
        setAnalysis({ kind: "error", message: err instanceof Error ? err.message : "Camera check failed." });
      }
    } finally {
      if (id === runId.current) setBusy(null);
    }
  };

  const reset = () => {
    runId.current++;
    setMode("empty");
    setAnalysis(null);
    setBusy(null);
  };

  return { scene, mode, feed, analysis, busy, toast, dismissToast, personWalksIn, scanView, coverCamera, reset };
}

export type DemoEvents = ReturnType<typeof useDemoEvents>;

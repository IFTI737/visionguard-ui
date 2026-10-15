"use client";

import { useEffect, useRef } from "react";
import { usePhoneLink } from "@/lib/phoneLink";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { Area } from "@/types";

/** A phone that was streaming and stays gone this long counts as disconnected. Short drops reconnect by themselves. */
const OFFLINE_AFTER_MS = 15_000;

function Watcher({ area }: { area: Area }) {
  const addAlert = useVisionGuard((s) => s.addAlert);
  const link = usePhoneLink(area.camera.phoneCode);
  const connected = link?.status === "connected";
  const areaRef = useRef(area);
  const everConnected = useRef(false);
  const alerted = useRef(false);

  useEffect(() => {
    areaRef.current = area;
  }, [area]);

  useEffect(() => {
    if (connected) {
      everConnected.current = true;
      alerted.current = false;
      return;
    }
    if (!everConnected.current || alerted.current) return;
    const timer = window.setTimeout(() => {
      alerted.current = true;
      const a = areaRef.current;
      addAlert({
        areaId: a.id,
        areaName: a.name,
        kind: "camera_offline",
        level: "notify",
        title: `${a.name} phone camera disconnected`,
        reasons: [
          "The phone stopped sending video",
          "It may have lost its connection, run out of battery, or been stopped",
          "VisionGuard is not watching this area until the phone reconnects",
        ],
        score: null,
        snapshot: null,
      });
    }, OFFLINE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [connected, addAlert]);

  return null;
}

/**
 * Raises an alert when a phone camera that was live goes offline.
 * Also keeps each phone area's pairing open on every page, so the phone can connect from anywhere in the app.
 */
export function PhoneWatch() {
  const areas = useVisionGuard((s) => s.areas);
  return (
    <>
      {areas
        .filter((a) => a.camera.source === "phone" && a.camera.phoneCode)
        .map((a) => (
          <Watcher key={`${a.id}-${a.camera.phoneCode}`} area={a} />
        ))}
    </>
  );
}

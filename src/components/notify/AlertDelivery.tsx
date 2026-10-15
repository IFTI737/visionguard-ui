"use client";

import { useEffect, useRef } from "react";
import { playAlertSound, unlockOnFirstGesture } from "@/lib/alertSound";
import { sendTelegramAlert } from "@/lib/telegram";
import { useVisionGuard } from "@/store/useVisionGuard";

/**
 * Sends every new alert to the owner: plays the alert sound on this computer and, if turned on,
 * sends a message with the snapshot to Telegram. Alerts that already existed when the page opened are skipped.
 * Logged-only alerts (low risk) are never announced.
 */
export function AlertDelivery() {
  const alerts = useVisionGuard((s) => s.alerts);
  const sound = useVisionGuard((s) => s.settings.sound !== false);
  const telegram = useVisionGuard((s) => s.settings.channels.telegram);
  const startedAt = useRef(0);
  const handled = useRef(new Set<string>());

  useEffect(() => {
    startedAt.current = Date.now();
    unlockOnFirstGesture();
  }, []);

  useEffect(() => {
    for (const alert of alerts) {
      if (handled.current.has(alert.id)) continue;
      handled.current.add(alert.id);
      if (alert.createdAt < startedAt.current || alert.level === "log") continue;

      if (sound) playAlertSound(alert.level === "urgent" ? "urgent" : "notify");
      if (telegram) {
        const zones = useVisionGuard.getState().areas.find((a) => a.id === alert.areaId)?.zones ?? [];
        void sendTelegramAlert(alert, zones).then((r) => {
          if (!r.ok) console.warn("Telegram alert not sent:", r.error);
        });
      }
    }
  }, [alerts, sound, telegram]);

  return null;
}

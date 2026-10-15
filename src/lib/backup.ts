import { DEFAULT_SCENE_ID } from "@/data/seed";
import type { AlertEvent, Area, Settings } from "@/types";

/** The part of the store that is saved, exported and imported. */
export interface BackupData {
  userName: string;
  areas: Area[];
  alerts: AlertEvent[];
  settings: Settings;
}

const BACKUP_VERSION = 1;

/** Download the current setup as a JSON file. */
export function downloadBackup(data: BackupData): void {
  const payload = JSON.stringify({ version: BACKUP_VERSION, ...data }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `visionguard-setup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse an exported file. Throws a readable error if the file is not a VisionGuard setup. */
export function parseBackup(text: string): BackupData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!raw || typeof raw !== "object") throw new Error("This file is not a VisionGuard setup.");
  const r = raw as Partial<BackupData>;
  if (!Array.isArray(r.areas) || typeof r.userName !== "string" || !r.settings) {
    throw new Error("This file is not a VisionGuard setup.");
  }
  return {
    userName: r.userName,
    // Older exports had no photo setting; use automatic matching by area name.
    areas: r.areas.map((a) => ({
      ...a,
      sceneId: a.sceneId ?? DEFAULT_SCENE_ID,
      camera: { ...a.camera, source: a.camera?.source ?? "ip", phoneCode: a.camera?.phoneCode ?? null },
    })),
    alerts: Array.isArray(r.alerts) ? r.alerts.filter((a) => typeof a?.level === "string") : [],
    settings: r.settings,
  };
}

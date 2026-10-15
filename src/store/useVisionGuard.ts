"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CUSTOM_AREA_FEATURES,
  DEFAULT_SCENE_ID,
  DEFAULT_CAMERA_PORT,
  DEFAULT_CHANNELS,
  DEFAULT_USER_NAME,
  findPreset,
} from "@/data/seed";
import type { BackupData } from "@/lib/backup";
import { makeId } from "@/lib/id";
import type { AlertChannel, AlertEvent, AlertStatus, Area, AreaKind, Camera, Zone } from "@/types";

interface VisionGuardState extends BackupData {
  /** UI only; not saved. */
  sidebarOpen: boolean;

  setUserName: (name: string) => void;
  addArea: (kind: AreaKind, opts?: { name?: string; hazard?: boolean }) => string;
  setCamera: (id: string, camera: Partial<Camera>) => void;
  renameArea: (id: string, name: string) => void;
  updateArea: (id: string, patch: Partial<Omit<Area, "id">>) => void;
  removeArea: (id: string) => void;
  addZone: (areaId: string, zone: Omit<Zone, "id">) => string;
  updateZone: (areaId: string, zoneId: string, patch: Partial<Omit<Zone, "id">>) => void;
  removeZone: (areaId: string, zoneId: string) => void;
  setChannel: (channel: AlertChannel, on: boolean) => void;
  setSound: (on: boolean) => void;

  addAlert: (alert: Omit<AlertEvent, "id" | "createdAt" | "status">) => AlertEvent;
  setAlertStatus: (id: string, status: AlertStatus) => void;
  clearAlerts: () => void;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  importData: (data: BackupData) => void;
  resetDemo: () => void;
}

const initialData = (): BackupData => ({
  userName: DEFAULT_USER_NAME,
  areas: [],
  alerts: [],
  settings: { channels: { ...DEFAULT_CHANNELS } },
});

export const useVisionGuard = create<VisionGuardState>()(
  persist(
    (set) => ({
      ...initialData(),
      sidebarOpen: false,

      setUserName: (name) => set({ userName: name.trim() || DEFAULT_USER_NAME }),

      addArea: (kind, opts = {}) => {
        const preset = findPreset(kind);
        const area: Area = {
          id: makeId("area"),
          kind,
          name: opts.name?.trim() || preset?.label || "New area",
          camera: { source: "ip", ip: "", port: DEFAULT_CAMERA_PORT, status: "disconnected", phoneCode: null },
          features: preset ? [...preset.features] : [...CUSTOM_AREA_FEATURES],
          zones: [],
          hazard: opts.hazard ?? preset?.hazard ?? false,
          sceneId: DEFAULT_SCENE_ID,
          createdAt: Date.now(),
        };
        set((s) => ({ areas: [...s.areas, area] }));
        return area.id;
      },

      renameArea: (id, name) =>
        set((s) => ({
          areas: s.areas.map((a) => (a.id === id && name.trim() ? { ...a, name: name.trim() } : a)),
        })),

      updateArea: (id, patch) =>
        set((s) => ({ areas: s.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      setCamera: (id, camera) =>
        set((s) => ({
          areas: s.areas.map((a) => (a.id === id ? { ...a, camera: { ...a.camera, ...camera } } : a)),
        })),

      removeArea: (id) =>
        set((s) => ({
          areas: s.areas.filter((a) => a.id !== id),
          alerts: s.alerts.filter((e) => e.areaId !== id),
        })),

      addZone: (areaId, zone) => {
        const id = makeId("zone");
        set((s) => ({
          areas: s.areas.map((a) => (a.id === areaId ? { ...a, zones: [...a.zones, { ...zone, id }] } : a)),
        }));
        return id;
      },

      updateZone: (areaId, zoneId, patch) =>
        set((s) => ({
          areas: s.areas.map((a) =>
            a.id === areaId
              ? { ...a, zones: a.zones.map((z) => (z.id === zoneId ? { ...z, ...patch } : z)) }
              : a,
          ),
        })),

      removeZone: (areaId, zoneId) =>
        set((s) => ({
          areas: s.areas.map((a) =>
            a.id === areaId ? { ...a, zones: a.zones.filter((z) => z.id !== zoneId) } : a,
          ),
        })),

      setChannel: (channel, on) =>
        set((s) => ({ settings: { ...s.settings, channels: { ...s.settings.channels, [channel]: on } } })),

      setSound: (on) => set((s) => ({ settings: { ...s.settings, sound: on } })),

      addAlert: (alert) => {
        const full: AlertEvent = { ...alert, id: makeId("alert"), createdAt: Date.now(), status: "new" };
        set((s) => ({ alerts: [full, ...s.alerts].slice(0, 100) }));
        return full;
      },
      setAlertStatus: (id, status) =>
        set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, status } : a)) })),
      clearAlerts: () => set({ alerts: [] }),

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      importData: (data) => set({ ...data }),
      resetDemo: () => set({ ...initialData() }),
    }),
    {
      name: "visionguard-demo",
      version: 4,
      // v1 → v2: alerts changed shape. v2 → v3: demo photos are found from the area name ("auto").
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<BackupData>;
        // v3 → v4: cameras got a source (IP or phone) and a pairing code.
        const areas = (state.areas ?? []).map((a) => ({
          ...a,
          sceneId: version < 3 ? DEFAULT_SCENE_ID : a.sceneId,
          camera: { ...a.camera, source: a.camera.source ?? "ip", phoneCode: a.camera.phoneCode ?? null },
        }));
        return { ...state, areas, alerts: version < 2 ? [] : (state.alerts ?? []) } as BackupData;
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s): BackupData => ({
        userName: s.userName,
        areas: s.areas,
        alerts: s.alerts,
        settings: s.settings,
      }),
    },
  ),
);

/** Snapshot of the saved data, for export. */
export function selectBackup(s: VisionGuardState): BackupData {
  return { userName: s.userName, areas: s.areas, alerts: s.alerts, settings: s.settings };
}

/** Shared types for the VisionGuard demo UI. */

export type AreaKind =
  | "rooftop"
  | "void"
  | "garage"
  | "front-gate"
  | "entrance-face"
  | "back-side"
  | "left-side"
  | "right-side"
  | "custom";

export type CameraFeature =
  | "person_detection"
  | "intrusion"
  | "camera_health"
  | "face_verification";

/** A point stored as fractions of the image size (0 to 1), so zones fit any screen size. */
export type Point = [x: number, y: number];

export type ZoneShape = "polygon" | "rectangle" | "triangle" | "full";

export interface TimeWindow {
  /** "HH:MM", 24-hour, Asia/Dhaka time. */
  from: string;
  to: string;
}

export interface Zone {
  id: string;
  name: string;
  shape: ZoneShape;
  points: Point[];
  schedule: TimeWindow;
  /** Hazard zones (e.g. a roof edge) can alert at any hour. */
  alwaysOn: boolean;
}

/** disconnected → connecting → connected (reachable, not streaming) → live (streaming). */
export type CameraStatus = "disconnected" | "connecting" | "connected" | "live";

/** "ip": a CCTV/IP camera (demo photos stand in for it). "phone": a phone streaming live via QR pairing. */
export type CameraSource = "ip" | "phone";

export interface Camera {
  source: CameraSource;
  ip: string;
  port: number;
  status: CameraStatus;
  /** 6-digit pairing code shown in the QR, for phone cameras. */
  phoneCode: string | null;
}

export interface Area {
  id: string;
  kind: AreaKind;
  name: string;
  camera: Camera;
  features: CameraFeature[];
  zones: Zone[];
  /** Hazard areas (roof edge, open shaft) can have zones that alert at any hour. */
  hazard: boolean;
  /** Which demo scene (sample photos in /public/demo) stands in for this camera's feed. See DEMO_SCENES. */
  sceneId: string;
  createdAt: number;
}

/** A detected person, in fractions of the image size (0–1). */
export interface PersonBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Model confidence, 0–1. */
  score: number;
}

export type AlertKind = "intrusion" | "camera_blocked" | "camera_offline";
export type AlertStatus = "new" | "confirmed" | "false_alarm";
/** Risk bands from the pitch: log (20–49), notify (50–79), urgent (80+). */
export type AlertLevel = "log" | "notify" | "urgent";

export interface AlertSnapshot {
  /** Photo the event was found on. */
  image: string;
  boxes: PersonBox[];
}

export interface AlertEvent {
  id: string;
  areaId: string;
  /** Kept so the alert still reads well if the area is renamed or removed. */
  areaName: string;
  kind: AlertKind;
  level: AlertLevel;
  title: string;
  reasons: string[];
  /** Risk score for intrusions; null for camera-health alerts. */
  score: number | null;
  snapshot: AlertSnapshot | null;
  status: AlertStatus;
  createdAt: number;
}

export type AlertChannel = "push" | "telegram" | "call";

export interface Settings {
  channels: Record<AlertChannel, boolean>;
  /** Alert sound on this computer. Treated as on when missing. */
  sound?: boolean;
}

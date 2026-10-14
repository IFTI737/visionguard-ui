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

export interface Camera {
  ip: string;
  port: number;
  status: CameraStatus;
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
  /** Photo that stands in for the live feed in the demo. */
  demoImage: string | null;
  createdAt: number;
}

export type AlertKind = "intrusion" | "camera_blocked";
export type AlertStatus = "new" | "confirmed" | "false_alarm";

export interface AlertEvent {
  id: string;
  areaId: string;
  kind: AlertKind;
  title: string;
  reasons: string[];
  snapshot: string | null;
  status: AlertStatus;
  createdAt: number;
}

export type AlertChannel = "push" | "telegram" | "call";

export interface Settings {
  channels: Record<AlertChannel, boolean>;
}

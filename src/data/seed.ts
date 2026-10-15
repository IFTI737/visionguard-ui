/**
 * Read-only starting data for the demo.
 * Edit this file to change presets, demo photos or defaults; changes apply after a restart.
 * Anything the user changes in the UI is saved in the browser instead (see src/store).
 */
import type { AlertChannel, AreaKind, CameraFeature } from "@/types";

export interface AreaPreset {
  kind: Exclude<AreaKind, "custom">;
  label: string;
  description: string;
  /** Hazard areas get an "always on" zone option by default. */
  hazard: boolean;
  features: CameraFeature[];
}

export const DEFAULT_USER_NAME = "Demo owner";

export const AREA_PRESETS: AreaPreset[] = [
  {
    kind: "rooftop",
    label: "Rooftop",
    description: "Roof and its edges; a fall hazard as well as an entry point.",
    hazard: true,
    features: ["person_detection", "intrusion", "camera_health"],
  },
  {
    kind: "void",
    label: "Void area",
    description: "Open gap or shaft inside or beside the building.",
    hazard: true,
    features: ["person_detection", "intrusion", "camera_health"],
  },
  {
    kind: "garage",
    label: "Garage / parking",
    description: "Parking area and garage entrance.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
  },
  {
    kind: "front-gate",
    label: "Front gate",
    description: "Main gate and the street side of the entrance.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
  },
  {
    kind: "entrance-face",
    label: "Entrance face check",
    description: "Camera facing the entrance for resident face checks (daylight only).",
    hazard: false,
    features: ["person_detection", "face_verification", "camera_health"],
  },
  {
    kind: "back-side",
    label: "Back side",
    description: "Rear wall and back passage of the building.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
  },
  {
    kind: "left-side",
    label: "Left side",
    description: "Left side wall and passage.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
  },
  {
    kind: "right-side",
    label: "Right side",
    description: "Right side wall and passage.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
  },
];

export const CUSTOM_AREA_FEATURES: CameraFeature[] = [
  "person_detection",
  "intrusion",
  "camera_health",
];

export const DEFAULT_CHANNELS: Record<AlertChannel, boolean> = {
  push: true,
  telegram: false,
  call: false,
};

/** Default restricted hours for a new zone. */
export const DEFAULT_SCHEDULE = { from: "18:00", to: "06:00" };

export const DEFAULT_CAMERA_PORT = 554;

/* ------------------------------------------------------------------ */
/* Demo photos: still photos in /public/demo stand in for camera feeds. */
/*                                                                     */
/* Name the files after the area, e.g. for an area called "Walkway":   */
/*   walkway-empty.jpg    the normal view (or just walkway.jpg)        */
/*   walkway-person.jpg   same view with someone in it                 */
/*   walkway-covered.jpg  lens covered (optional)                      */
/* Lower-case, spaces become dashes: "Void area" → void-area-empty.jpg */
/* .jpg, .jpeg, .png and .webp all work.                               */
/* ------------------------------------------------------------------ */

export const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const PHOTO_FOLDER = "/demo";

/** "auto" = find photos named after the area; otherwise the name prefix of a photo set below. */
export const AUTO_SCENE_ID = "auto";
export const DEFAULT_SCENE_ID = AUTO_SCENE_ID;

/** Photo sets that can be picked by hand in the live view's "Demo photos" menu. */
export const DEMO_SCENES: { id: string; label: string }[] = [
  { id: "walkway", label: "Walkway" },
  { id: "rooftop", label: "Rooftop" },
  { id: "void", label: "Void area" },
];

/** Shown when the camera is "covered" and there is no covered photo. */
export const COVERED_FALLBACK = "/demo/covered.svg";

/* ------------------------------------------------------------------ */
/* Person detector (runs in the browser with onnxruntime-web)          */
/* ------------------------------------------------------------------ */

export const DETECTOR = {
  /** YOLOv8n trained on COCO, exported to ONNX. Swap for your own export of best.pt if you like. */
  modelUrl: "/models/yolov8n.onnx",
  inputSize: 640,
  /** Class index of "person" in the model (0 for COCO models). */
  personClass: 0,
  /** Ignore detections below this confidence. */
  minScore: 0.35,
  /** Overlap above which two boxes count as the same person. */
  iouThreshold: 0.45,
};

/* ------------------------------------------------------------------ */
/* Risk score: the starting weights from the pitch deck (slide 7).     */
/* ------------------------------------------------------------------ */

export const RISK = {
  restrictedZone: 40,
  /** A person counts as inside a zone when their feet are in it or at least this share of their box overlaps it. */
  minOverlap: 0.35,
  restrictedHours: 30,
  night: 15,
  /** Night mode hours (Asia/Dhaka). */
  nightWindow: { from: "22:00", to: "05:00" },
  /** Score at or above which each level applies; below `log` is ignored. */
  bands: { log: 20, notify: 50, urgent: 80 },
};

/** Camera-blocked check: the view is treated as covered if it is this dark or this flat. */
export const BLOCKED_CAMERA = { maxBrightness: 45, maxContrast: 18 };

export function findPreset(kind: AreaKind): AreaPreset | undefined {
  return AREA_PRESETS.find((p) => p.kind === kind);
}

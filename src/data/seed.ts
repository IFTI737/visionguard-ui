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
  /** Demo scene (sample photos) used for this camera's feed. See DEMO_SCENES. */
  sceneId: string;
}

export const DEFAULT_USER_NAME = "Demo owner";

export const AREA_PRESETS: AreaPreset[] = [
  {
    kind: "rooftop",
    label: "Rooftop",
    description: "Roof and its edges; a fall hazard as well as an entry point.",
    hazard: true,
    features: ["person_detection", "intrusion", "camera_health"],
    sceneId: "rooftop",
  },
  {
    kind: "void",
    label: "Void area",
    description: "Open gap or shaft inside or beside the building.",
    hazard: true,
    features: ["person_detection", "intrusion", "camera_health"],
    sceneId: "void",
  },
  {
    kind: "garage",
    label: "Garage / parking",
    description: "Parking area and garage entrance.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
    sceneId: "walkway",
  },
  {
    kind: "front-gate",
    label: "Front gate",
    description: "Main gate and the street side of the entrance.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
    sceneId: "walkway",
  },
  {
    kind: "entrance-face",
    label: "Entrance face check",
    description: "Camera facing the entrance for resident face checks (daylight only).",
    hazard: false,
    features: ["person_detection", "face_verification", "camera_health"],
    sceneId: "walkway",
  },
  {
    kind: "back-side",
    label: "Back side",
    description: "Rear wall and back passage of the building.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
    sceneId: "walkway",
  },
  {
    kind: "left-side",
    label: "Left side",
    description: "Left side wall and passage.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
    sceneId: "walkway",
  },
  {
    kind: "right-side",
    label: "Right side",
    description: "Right side wall and passage.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
    sceneId: "walkway",
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
/* Demo scenes: still photos that stand in for camera feeds.           */
/* Put the files in /public/demo with exactly these names.            */
/* ------------------------------------------------------------------ */

export interface DemoScene {
  id: string;
  label: string;
  /** The normal view (nobody in the restricted area). */
  empty: string;
  /** Same view, same position, with a person in it. Used by "Person walks in". */
  person: string | null;
  /** Same camera with the lens covered. Optional; a dark frame is used if missing. */
  covered: string | null;
}

export const DEMO_SCENES: DemoScene[] = [
  {
    id: "walkway",
    label: "Walkway",
    empty: "/demo/walkway-empty.jpg",
    person: "/demo/walkway-person.jpg",
    covered: "/demo/walkway-covered.jpg",
  },
  {
    id: "rooftop",
    label: "Rooftop",
    empty: "/demo/rooftop-empty.jpg",
    person: "/demo/rooftop-person.jpg",
    covered: null,
  },
  {
    id: "void",
    label: "Void area",
    empty: "/demo/void-empty.jpg",
    person: "/demo/void-person.jpg",
    covered: null,
  },
];

export const DEFAULT_SCENE_ID = "walkway";

/** Shown when the camera is "covered" and the scene has no covered photo. */
export const COVERED_FALLBACK = "/demo/covered.svg";

export function findScene(id: string | undefined): DemoScene {
  return DEMO_SCENES.find((s) => s.id === id) ?? DEMO_SCENES.find((s) => s.id === DEFAULT_SCENE_ID)!;
}

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

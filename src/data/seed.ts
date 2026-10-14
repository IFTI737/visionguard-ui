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
  /** Photo in /public/demo that stands in for this camera's feed. */
  demoImage: string | null;
}

export const DEFAULT_USER_NAME = "Demo owner";

export const AREA_PRESETS: AreaPreset[] = [
  {
    kind: "rooftop",
    label: "Rooftop",
    description: "Roof and its edges; a fall hazard as well as an entry point.",
    hazard: true,
    features: ["person_detection", "intrusion", "camera_health"],
    demoImage: "/demo/rooftop.jpg",
  },
  {
    kind: "void",
    label: "Void area",
    description: "Open gap or shaft inside or beside the building.",
    hazard: true,
    features: ["person_detection", "intrusion", "camera_health"],
    demoImage: "/demo/void.jpg",
  },
  {
    kind: "garage",
    label: "Garage / parking",
    description: "Parking area and garage entrance.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
    demoImage: null,
  },
  {
    kind: "front-gate",
    label: "Front gate",
    description: "Main gate and the street side of the entrance.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
    demoImage: null,
  },
  {
    kind: "entrance-face",
    label: "Entrance face check",
    description: "Camera facing the entrance for resident face checks (daylight only).",
    hazard: false,
    features: ["person_detection", "face_verification", "camera_health"],
    demoImage: null,
  },
  {
    kind: "back-side",
    label: "Back side",
    description: "Rear wall and back passage of the building.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
    demoImage: null,
  },
  {
    kind: "left-side",
    label: "Left side",
    description: "Left side wall and passage.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
    demoImage: null,
  },
  {
    kind: "right-side",
    label: "Right side",
    description: "Right side wall and passage.",
    hazard: false,
    features: ["person_detection", "intrusion", "camera_health"],
    demoImage: null,
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

export function findPreset(kind: AreaKind): AreaPreset | undefined {
  return AREA_PRESETS.find((p) => p.kind === kind);
}

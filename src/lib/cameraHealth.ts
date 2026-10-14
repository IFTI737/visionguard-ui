"use client";

import { BLOCKED_CAMERA } from "@/data/seed";
import { imagePixels, loadImage } from "./images";

export interface CameraHealth {
  /** Average brightness, 0 (black) to 255 (white). */
  brightness: number;
  /** Spread of brightness values; near 0 means a flat view with no detail. */
  contrast: number;
  blocked: boolean;
}

/**
 * A simple image check, not AI: a covered or blacked-out camera gives a very dark
 * or very flat picture. Works on a small copy of the frame (64×36) for speed.
 */
export async function checkCameraView(src: string): Promise<CameraHealth> {
  const img = await loadImage(src);
  const { data } = imagePixels(img, 64, 36);
  const n = data.length / 4;
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const y = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    sum += y;
    sumSq += y * y;
  }
  const brightness = sum / n;
  const contrast = Math.sqrt(Math.max(0, sumSq / n - brightness * brightness));
  const blocked = brightness < BLOCKED_CAMERA.maxBrightness || contrast < BLOCKED_CAMERA.maxContrast;
  return { brightness: Math.round(brightness), contrast: Math.round(contrast), blocked };
}

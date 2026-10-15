"use client";

/**
 * Person detection in the browser.
 * Runs a YOLOv8 ONNX model with onnxruntime-web (WebAssembly), so no server or GPU is needed.
 * The model file lives in /public/models and the runtime files in /public/ort.
 */
import type { InferenceSession, Tensor } from "onnxruntime-web";
import { DETECTOR } from "@/data/seed";
import type { PersonBox } from "@/types";
import { loadImage } from "./images";

type OrtModule = typeof import("onnxruntime-web/wasm");

let loading: Promise<{ ort: OrtModule; session: InferenceSession }> | null = null;

/** Load the runtime and model once; later calls reuse them. */
export function loadDetector() {
  if (!loading) {
    loading = (async () => {
      const ort = await import("onnxruntime-web/wasm");
      ort.env.wasm.wasmPaths = "/ort/";
      // Multi-threading needs special server headers; one thread is plenty for a single photo.
      ort.env.wasm.numThreads = 1;
      const session = await ort.InferenceSession.create(DETECTOR.modelUrl, { executionProviders: ["wasm"] });
      return { ort, session };
    })().catch((err) => {
      loading = null; // allow a retry
      throw err;
    });
  }
  return loading;
}

export interface DetectionResult {
  people: PersonBox[];
  /** Time spent running the model, in milliseconds. */
  inferenceMs: number;
}

/** Find people in a photo file. Boxes are returned as fractions of the photo's width and height. */
export async function detectPeople(src: string): Promise<DetectionResult> {
  const img = await loadImage(src);
  return detectPeopleIn(img, img.naturalWidth, img.naturalHeight);
}

/** Find people in any drawable source (photo, video frame, canvas) of the given size. */
export async function detectPeopleIn(img: CanvasImageSource, W: number, H: number): Promise<DetectionResult> {
  const { ort, session } = await loadDetector();
  const size = DETECTOR.inputSize;

  // Letterbox: scale the photo to fit 640×640 and pad the rest with grey, as YOLO expects.
  const scale = Math.min(size / W, size / H);
  const nw = Math.round(W * scale);
  const nh = Math.round(H * scale);
  const padX = (size - nw) / 2;
  const padY = (size - nh) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.fillStyle = "rgb(114,114,114)";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, padX, padY, nw, nh);
  const { data } = ctx.getImageData(0, 0, size, size);

  // RGBA bytes → planar RGB floats in 0–1 (shape 1×3×640×640).
  const plane = size * size;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    input[i] = data[i * 4] / 255;
    input[plane + i] = data[i * 4 + 1] / 255;
    input[2 * plane + i] = data[i * 4 + 2] / 255;
  }

  const started = performance.now();
  const feeds: Record<string, Tensor> = {
    [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, size, size]),
  };
  const outputs = await session.run(feeds);
  const inferenceMs = Math.round(performance.now() - started);

  // YOLOv8 output: 1 × (4 + classes) × anchors. Rows: cx, cy, w, h, then one score per class.
  const out = outputs[session.outputNames[0]];
  const values = out.data as Float32Array;
  const anchors = out.dims[2];
  const candidates: PersonBox[] = [];
  for (let i = 0; i < anchors; i++) {
    const score = values[(4 + DETECTOR.personClass) * anchors + i];
    if (score < DETECTOR.minScore) continue;
    const cx = values[i];
    const cy = values[anchors + i];
    const w = values[2 * anchors + i];
    const h = values[3 * anchors + i];
    // Undo the letterbox and normalise to the original photo.
    const x0 = (cx - w / 2 - padX) / scale / W;
    const y0 = (cy - h / 2 - padY) / scale / H;
    const x1 = (cx + w / 2 - padX) / scale / W;
    const y1 = (cy + h / 2 - padY) / scale / H;
    candidates.push({ x0: clamp(x0), y0: clamp(y0), x1: clamp(x1), y1: clamp(y1), score });
  }

  return { people: nonMaxSuppression(candidates, DETECTOR.iouThreshold), inferenceMs };
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

function iou(a: PersonBox, b: PersonBox): number {
  const iw = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const ih = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const inter = iw * ih;
  const union = (a.x1 - a.x0) * (a.y1 - a.y0) + (b.x1 - b.x0) * (b.y1 - b.y0) - inter;
  return union > 0 ? inter / union : 0;
}

/** Keep the most confident box among heavily overlapping ones. */
function nonMaxSuppression(boxes: PersonBox[], threshold: number): PersonBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: PersonBox[] = [];
  for (const box of sorted) {
    if (kept.every((k) => iou(k, box) < threshold)) kept.push(box);
  }
  return kept;
}

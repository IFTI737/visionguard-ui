import type { Point } from "@/types";

/** Keep a value between 0 and 1. */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** The whole camera view as one zone. */
export const FULL_FRAME: Point[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

/** Rectangle from two opposite corners. */
export function rectanglePoints(a: Point, b: Point): Point[] {
  const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y0, y1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
}

/** Triangle that fills the dragged box: apex at the top centre, base along the bottom. */
export function trianglePoints(a: Point, b: Point): Point[] {
  const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y0, y1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return [
    [(x0 + x1) / 2, y0],
    [x1, y1],
    [x0, y1],
  ];
}

/** True if the dragged box is big enough to count as a shape (not an accidental click). */
export function isBigEnough(a: Point, b: Point, min = 0.02): boolean {
  return Math.abs(a[0] - b[0]) > min && Math.abs(a[1] - b[1]) > min;
}

/**
 * Ray-casting test: is point p inside the polygon?
 * VisionGuard uses this with the bottom-centre of a person's box (their feet).
 */
export function pointInPolygon(p: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const crosses = yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Average of the vertices; good enough to place a label inside simple shapes. */
export function centroid(poly: Point[]): Point {
  const n = poly.length || 1;
  const sx = poly.reduce((s, p) => s + p[0], 0);
  const sy = poly.reduce((s, p) => s + p[1], 0);
  return [sx / n, sy / n];
}

/** SVG "points" attribute for a 0–100 viewBox. */
export const toSvgPoints = (poly: Point[]) => poly.map(([x, y]) => `${x * 100},${y * 100}`).join(" ");

/** Pointer position inside an element, as fractions of its size. */
export function pointerToPoint(e: { clientX: number; clientY: number }, el: HTMLElement): Point {
  const r = el.getBoundingClientRect();
  return [clamp01((e.clientX - r.left) / r.width), clamp01((e.clientY - r.top) / r.height)];
}

/**
 * How much of a person's box lies inside a zone (0 to 1), found by testing a grid of points
 * across the box. Used so someone half inside a zone still counts as entering it.
 */
export function overlapFraction(box: { x0: number; y0: number; x1: number; y1: number }, poly: Point[], steps = 14): number {
  let hit = 0;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < steps; j++) {
      const p: Point = [box.x0 + ((i + 0.5) / steps) * (box.x1 - box.x0), box.y0 + ((j + 0.5) / steps) * (box.y1 - box.y0)];
      if (pointInPolygon(p, poly)) hit++;
    }
  }
  return hit / (steps * steps);
}

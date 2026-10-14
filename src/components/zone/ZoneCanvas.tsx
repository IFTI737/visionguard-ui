"use client";

import { useRef, useState } from "react";
import { Check, Undo2, X } from "lucide-react";
import { FeedImage } from "@/components/camera/FeedImage";
import {
  centroid,
  isBigEnough,
  pointerToPoint,
  rectanglePoints,
  toSvgPoints,
  trianglePoints,
} from "@/lib/geometry";
import type { Point, Zone, ZoneShape } from "@/types";

export type DrawTool = "select" | "polygon" | "rectangle" | "triangle";

export interface DraftShape {
  shape: ZoneShape;
  points: Point[];
}

interface ZoneCanvasProps {
  imageSrc: string | null;
  imageAlt: string;
  zones: Zone[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  tool: DrawTool;
  /** A finished shape waiting for its name and hours. Drawing is paused while it exists. */
  draft: DraftShape | null;
  onDraftComplete: (draft: DraftShape) => void;
  onZonePointsChange: (zoneId: string, points: Point[]) => void;
}

/** Distance (in screen pixels) at which a click on the first point closes the polygon. */
const CLOSE_DISTANCE_PX = 14;

const HINTS: Record<Exclude<DrawTool, "select">, string> = {
  polygon: "Click to place points. Click the first point (or press Enter) to close the shape.",
  rectangle: "Press and drag to draw a rectangle.",
  triangle: "Press and drag to draw a triangle.",
};

/**
 * Still frame from the camera with a drawing layer on top.
 * All points are stored as fractions of the frame (0–1), so zones fit any screen size.
 */
export function ZoneCanvas({
  imageSrc,
  imageAlt,
  zones,
  selectedId,
  onSelect,
  tool,
  draft,
  onDraftComplete,
  onZonePointsChange,
}: ZoneCanvasProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  // In-progress polygon; tagged with its tool so switching tools starts fresh.
  const [poly, setPoly] = useState<{ tool: DrawTool; points: Point[] }>({ tool, points: [] });
  const [drag, setDrag] = useState<{ tool: DrawTool; start: Point; end: Point } | null>(null);
  const [hover, setHover] = useState<{ point: Point; nearFirst: boolean } | null>(null);
  const [vertexDrag, setVertexDrag] = useState<{ id: string; index: number; points: Point[] } | null>(null);

  const polyPoints = poly.tool === tool ? poly.points : [];
  const canDraw = !draft && tool !== "select";

  const isNearFirst = (p: Point): boolean => {
    const el = overlayRef.current;
    if (!el || polyPoints.length < 3) return false;
    const r = el.getBoundingClientRect();
    const [fx, fy] = polyPoints[0];
    return Math.hypot((p[0] - fx) * r.width, (p[1] - fy) * r.height) <= CLOSE_DISTANCE_PX;
  };

  const finishPolygon = () => {
    if (polyPoints.length < 3) return;
    onDraftComplete({ shape: "polygon", points: polyPoints });
    setPoly({ tool, points: [] });
    setHover(null);
  };
  const undoPoint = () => setPoly({ tool, points: polyPoints.slice(0, -1) });
  const cancelPolygon = () => setPoly({ tool, points: [] });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = overlayRef.current;
    if (!el || e.button !== 0) return;
    if (!canDraw) {
      if (tool === "select" && e.target === e.currentTarget) onSelect(null);
      return;
    }
    const p = pointerToPoint(e, el);
    if (tool === "polygon") {
      if (isNearFirst(p)) finishPolygon();
      else setPoly({ tool, points: [...polyPoints, p] });
      return;
    }
    el.setPointerCapture(e.pointerId);
    setDrag({ tool, start: p, end: p });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = overlayRef.current;
    if (!el) return;
    const p = pointerToPoint(e, el);
    if (vertexDrag) {
      const points = vertexDrag.points.map((q, i) => (i === vertexDrag.index ? p : q));
      setVertexDrag({ ...vertexDrag, points });
    } else if (drag) {
      setDrag({ ...drag, end: p });
    } else if (tool === "polygon" && canDraw) {
      setHover({ point: p, nearFirst: isNearFirst(p) });
    }
  };

  const onPointerUp = () => {
    if (vertexDrag) {
      onZonePointsChange(vertexDrag.id, vertexDrag.points);
      setVertexDrag(null);
    }
    if (drag) {
      if (isBigEnough(drag.start, drag.end)) {
        const shape: ZoneShape = drag.tool === "triangle" ? "triangle" : "rectangle";
        const points =
          shape === "triangle" ? trianglePoints(drag.start, drag.end) : rectanglePoints(drag.start, drag.end);
        onDraftComplete({ shape, points });
      }
      setDrag(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (tool !== "polygon" || polyPoints.length === 0) return;
    if (e.key === "Enter") finishPolygon();
    if (e.key === "Escape") cancelPolygon();
    if (e.key === "Backspace") {
      e.preventDefault();
      undoPoint();
    }
  };

  const dragPreview =
    drag && (drag.tool === "triangle" ? trianglePoints(drag.start, drag.end) : rectanglePoints(drag.start, drag.end));
  const rubberBand = hover && polyPoints.length > 0 ? [...polyPoints, hover.point] : polyPoints;
  const selectable = tool === "select" && !draft;

  return (
    <div>
      <div className="relative aspect-video w-full select-none overflow-hidden rounded-2xl bg-ink shadow-lg shadow-ink/10">
        <FeedImage src={imageSrc} alt={imageAlt} />

        <div
          ref={overlayRef}
          role="application"
          aria-label="Camera view. Draw restricted zones here."
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKeyDown}
          className={`absolute inset-0 touch-none outline-none ${canDraw ? "cursor-crosshair" : ""}`}
        >
          <svg
            className="pointer-events-none absolute inset-0 size-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {zones.map((z) => {
              const pts = vertexDrag?.id === z.id ? vertexDrag.points : z.points;
              const selected = z.id === selectedId;
              return (
                <polygon
                  key={z.id}
                  points={toSvgPoints(pts)}
                  fill={selected ? "rgba(229,72,77,0.40)" : "rgba(229,72,77,0.28)"}
                  stroke="#e5484d"
                  strokeWidth={selected ? 3 : 2}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  style={{ pointerEvents: selectable ? "visiblePainted" : "none", cursor: selectable ? "pointer" : undefined }}
                  onPointerDown={
                    selectable
                      ? (e) => {
                          e.stopPropagation();
                          onSelect(z.id);
                        }
                      : undefined
                  }
                />
              );
            })}

            {draft && (
              <polygon
                points={toSvgPoints(draft.points)}
                fill="rgba(26,86,219,0.25)"
                stroke="#1a56db"
                strokeWidth={2.5}
                strokeDasharray="7 5"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {dragPreview && (
              <polygon
                points={toSvgPoints(dragPreview)}
                fill="rgba(26,86,219,0.18)"
                stroke="#1a56db"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            )}

            {rubberBand.length > 0 && (
              <polyline
                points={toSvgPoints(rubberBand)}
                fill={rubberBand.length > 2 ? "rgba(26,86,219,0.15)" : "none"}
                stroke="#1a56db"
                strokeWidth={2}
                strokeDasharray={hover ? "6 4" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Zone names */}
          {zones.map((z) => {
            const [cx, cy] = centroid(vertexDrag?.id === z.id ? vertexDrag.points : z.points);
            return (
              <span
                key={z.id}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-danger px-2 py-0.5 text-[11px] font-semibold text-white shadow"
                style={{ left: `${cx * 100}%`, top: `${cy * 100}%` }}
              >
                {z.name}
              </span>
            );
          })}

          {/* Points of the polygon being drawn; the first one closes the shape */}
          {polyPoints.map(([x, y], i) => (
            <span
              key={i}
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
                i === 0
                  ? `size-4 bg-brand ${hover?.nearFirst ? "scale-150 ring-4 ring-white/60" : ""} transition-transform`
                  : "size-3 bg-brand"
              }`}
              style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
            />
          ))}

          {/* Draggable corners of the selected zone */}
          {selectable &&
            zones
              .filter((z) => z.id === selectedId)
              .flatMap((z) =>
                (vertexDrag?.id === z.id ? vertexDrag.points : z.points).map(([x, y], i) => (
                  <span
                    key={`${z.id}-${i}`}
                    role="presentation"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      overlayRef.current?.setPointerCapture(e.pointerId);
                      setVertexDrag({ id: z.id, index: i, points: z.points });
                    }}
                    className="absolute size-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-danger shadow-md active:cursor-grabbing"
                    style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                  />
                )),
              )}
        </div>

        <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-ink/70 px-2 py-1 text-[11px] font-semibold text-white">
          Still frame
        </span>

      </div>

      {/* Hints and polygon controls sit below the frame so they never cover the area being drawn */}
      {canDraw && polyPoints.length === 0 && !drag && (
        <p className="mt-3 rounded-xl border border-dashed border-brand/40 bg-brand-tint/50 px-3 py-2 text-sm text-ink">
          {HINTS[tool as Exclude<DrawTool, "select">]}
        </p>
      )}
      {tool === "polygon" && polyPoints.length > 0 && !draft && (
        <div className="mt-3 flex flex-wrap items-center gap-1 rounded-xl border border-line bg-white p-1.5 pl-3 text-sm">
          <span className="mr-auto font-medium text-muted">
            {polyPoints.length} point{polyPoints.length > 1 ? "s" : ""}
            {polyPoints.length < 3 ? " · add at least 3" : " · click the first point or Finish"}
          </span>
          <button
            type="button"
            onClick={undoPoint}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold text-ink hover:bg-pale"
          >
            <Undo2 size={14} /> Undo
          </button>
          <button
            type="button"
            onClick={cancelPolygon}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold text-ink hover:bg-pale"
          >
            <X size={14} /> Cancel
          </button>
          <button
            type="button"
            onClick={finishPolygon}
            disabled={polyPoints.length < 3}
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 font-semibold text-white disabled:bg-line disabled:text-muted"
          >
            <Check size={14} /> Finish shape
          </button>
        </div>
      )}
    </div>
  );
}

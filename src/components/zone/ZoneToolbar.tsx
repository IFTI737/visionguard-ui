"use client";

import { Expand, MousePointer2, PenTool, RectangleHorizontal, Triangle, type LucideIcon } from "lucide-react";
import type { DrawTool } from "./ZoneCanvas";

const TOOLS: { id: DrawTool; label: string; icon: LucideIcon }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "polygon", label: "Free draw", icon: PenTool },
  { id: "rectangle", label: "Rectangle", icon: RectangleHorizontal },
  { id: "triangle", label: "Triangle", icon: Triangle },
];

interface ZoneToolbarProps {
  tool: DrawTool;
  onToolChange: (tool: DrawTool) => void;
  onWholeView: () => void;
  disabled: boolean;
}

export function ZoneToolbar({ tool, onToolChange, onWholeView, disabled }: ZoneToolbarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div role="toolbar" aria-label="Drawing tools" className="flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
        {TOOLS.map(({ id, label, icon: Icon }) => {
          const active = tool === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onToolChange(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                active ? "bg-brand text-white shadow-sm" : "text-ink hover:bg-pale"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onWholeView}
        className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
      >
        <Expand size={16} /> Whole view
      </button>
    </div>
  );
}

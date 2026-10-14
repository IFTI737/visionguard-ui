"use client";

import { Clock, ShieldAlert, Trash, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { describeSchedule, isZoneActive } from "@/lib/schedule";
import type { TimeWindow } from "@/types";

export interface ZoneDetails {
  name: string;
  schedule: TimeWindow;
  alwaysOn: boolean;
}

interface ZoneDetailsFormProps {
  mode: "new" | "edit";
  initial: ZoneDetails;
  shapeLabel: string;
  hazardArea: boolean;
  now: Date;
  onSave: (details: ZoneDetails) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand-tint";

/** Name and restricted hours for a zone. Used for new drawings and for editing saved zones. */
export function ZoneDetailsForm({
  mode,
  initial,
  shapeLabel,
  hazardArea,
  now,
  onSave,
  onCancel,
  onDelete,
}: ZoneDetailsFormProps) {
  const [name, setName] = useState(initial.name);
  const [from, setFrom] = useState(initial.schedule.from);
  const [to, setTo] = useState(initial.schedule.to);
  const [alwaysOn, setAlwaysOn] = useState(initial.alwaysOn);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const preview = { alwaysOn, schedule: { from, to } };
  const activeNow = isZoneActive({ ...preview, id: "", name, shape: "polygon", points: [] }, now);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name: name.trim() || initial.name, schedule: { from, to }, alwaysOn });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          {mode === "new" ? "New zone" : "Edit zone"} · {shapeLabel}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-ink">
          {mode === "new" ? "Name it and set its hours" : name || initial.name}
        </h2>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">Zone name</span>
        <input value={name} maxLength={32} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </label>

      <fieldset disabled={alwaysOn} className="disabled:opacity-50">
        <legend className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
          <Clock size={13} /> Restricted hours
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] text-muted">From</span>
            <input type="time" required value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-muted">To</span>
            <input type="time" required value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </label>
        </div>
      </fieldset>

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
          alwaysOn ? "border-danger bg-danger-tint/60" : "border-line hover:bg-pale"
        }`}
      >
        <input
          type="checkbox"
          checked={alwaysOn}
          onChange={(e) => setAlwaysOn(e.target.checked)}
          className="mt-0.5 size-4 accent-danger"
        />
        <span className="text-sm">
          <span className="flex items-center gap-1.5 font-semibold text-ink">
            <TriangleAlert size={14} className="text-danger" /> Always on
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {hazardArea
              ? "Recommended for this hazard area: a child at the edge is dangerous at any hour."
              : "Alert at any hour, ignoring the times above."}
          </span>
        </span>
      </label>

      <div
        className={`flex items-center gap-2.5 rounded-xl p-3 text-sm ${
          activeNow ? "bg-danger text-white" : "bg-pale text-ink"
        }`}
      >
        <ShieldAlert size={18} className="shrink-0" />
        <span>
          <span className="font-semibold">{describeSchedule(preview)}</span>
          <span className={`block text-xs ${activeNow ? "text-white/85" : "text-muted"}`}>
            {activeNow
              ? "Restricted right now: anyone entering triggers an alert."
              : "Not restricted right now; entries are only logged."}
          </span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-brand-dark"
        >
          {mode === "new" ? "Save zone" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-pale"
        >
          {mode === "new" ? "Discard" : "Close"}
        </button>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          onBlur={() => setConfirmDelete(false)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            confirmDelete ? "bg-danger text-white" : "text-danger hover:bg-danger-tint"
          }`}
        >
          <Trash size={15} /> {confirmDelete ? "Click again to delete" : "Delete zone"}
        </button>
      )}
    </form>
  );
}

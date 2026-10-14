"use client";

import { Check, Pencil } from "lucide-react";
import { useState } from "react";

interface InlineEditProps {
  value: string;
  onSave: (next: string) => void;
  ariaLabel: string;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
}

/**
 * Text that turns into an input when clicked.
 * Enter or clicking away saves; Escape cancels.
 */
export function InlineEdit({
  value,
  onSave,
  ariaLabel,
  maxLength = 40,
  className = "",
  inputClassName = "",
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) onSave(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <input
          autoFocus
          value={draft}
          maxLength={maxLength}
          aria-label={ariaLabel}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className={`min-w-0 rounded-md border border-brand bg-white px-2 py-1 text-ink outline-none ring-3 ring-brand-tint ${inputClassName}`}
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
          aria-label="Save"
          className="grid size-7 place-items-center rounded-md text-brand hover:bg-brand-tint"
        >
          <Check size={16} />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      aria-label={ariaLabel}
      className={`group inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left hover:bg-brand-tint/70 ${className}`}
    >
      <span className="truncate">{value}</span>
      <Pencil size={13} className="shrink-0 text-muted opacity-60 group-hover:opacity-100" />
    </button>
  );
}

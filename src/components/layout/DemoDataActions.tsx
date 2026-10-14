"use client";

import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { downloadBackup, parseBackup } from "@/lib/backup";
import { selectBackup, useVisionGuard } from "@/store/useVisionGuard";

const itemClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-pale";

/** Export / import the demo setup as a JSON file, and reset everything. */
export function DemoDataActions() {
  const importData = useVisionGuard((s) => s.importData);
  const resetDemo = useVisionGuard((s) => s.resetDemo);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const onExport = () => {
    downloadBackup(selectBackup(useVisionGuard.getState()));
    setMessage({ text: "Setup downloaded." });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      importData(parseBackup(await file.text()));
      setMessage({ text: "Setup imported." });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Import failed.", error: true });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetDemo();
    setConfirmReset(false);
    setMessage({ text: "Demo reset." });
  };

  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Demo data</p>
      <button type="button" onClick={onExport} className={itemClass}>
        <Download size={16} /> Export setup
      </button>
      <button type="button" onClick={() => fileRef.current?.click()} className={itemClass}>
        <Upload size={16} /> Import setup
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={onReset}
        onBlur={() => setConfirmReset(false)}
        className={`${itemClass} ${confirmReset ? "bg-danger-tint text-danger hover:bg-danger-tint" : ""}`}
      >
        <RotateCcw size={16} /> {confirmReset ? "Click again to reset" : "Reset demo"}
      </button>
      {message && (
        <p role="status" className={`px-3 pt-1 text-xs ${message.error ? "text-danger" : "text-success"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

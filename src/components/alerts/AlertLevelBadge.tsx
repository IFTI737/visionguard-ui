import type { AlertLevel } from "@/types";

const STYLES: Record<AlertLevel | "ignore", { label: string; className: string }> = {
  urgent: { label: "Urgent", className: "bg-danger text-white" },
  notify: { label: "Notify", className: "bg-amber-400 text-ink" },
  log: { label: "Logged", className: "bg-pale text-muted border border-line" },
  ignore: { label: "No alert", className: "bg-success/15 text-success" },
};

export function AlertLevelBadge({ level }: { level: AlertLevel | "ignore" }) {
  const s = STYLES[level];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${s.className}`}>
      {s.label}
    </span>
  );
}

import Link from "next/link";
import { CircleAlert, Cpu, Footprints, ListChecks } from "lucide-react";
import { AlertLevelBadge } from "@/components/alerts/AlertLevelBadge";
import { describeSchedule } from "@/lib/schedule";
import type { Analysis } from "./useDemoEvents";

/** Step-by-step explanation of what VisionGuard decided, shown under the live view. */
export function AnalysisPanel({ analysis }: { analysis: Analysis }) {
  if (analysis.kind === "error") {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-danger-tint p-3 text-sm text-danger">
        <CircleAlert size={17} className="mt-0.5 shrink-0" />
        <span>{analysis.message}</span>
      </div>
    );
  }

  if (analysis.kind === "blocked") {
    const { health, alert } = analysis;
    return (
      <ol className="flex flex-col gap-3 text-sm">
        <Step n={1} title="Simple image check (not AI)">
          Brightness {health.brightness} of 255 · contrast {health.contrast}
        </Step>
        <Step n={2} title="Decision">
          <span className="flex flex-wrap items-center gap-2">
            {health.blocked ? "Camera view is blocked" : "Camera view looks normal"}
            <AlertLevelBadge level={alert ? alert.level : "ignore"} />
          </span>
        </Step>
        {alert && <Outcome text="Owner alerted that this camera can no longer see." />}
      </ol>
    );
  }

  const { checks, decision, inferenceMs, alert } = analysis;
  return (
    <ol className="flex flex-col gap-3 text-sm">
      <Step n={1} title="Person detection (YOLOv8n, running in this browser)" icon={<Cpu size={14} />}>
        Found {checks.length} {checks.length === 1 ? "person" : "people"} in {inferenceMs} ms
      </Step>
      <Step n={2} title="Zone check (where are their feet?)" icon={<Footprints size={14} />}>
        {checks.length === 0 ? (
          "Nobody in view"
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {checks.map((c, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-2">
                <span className="font-mono text-xs text-muted">person {Math.round(c.box.score * 100)}%</span>
                {c.zone ? (
                  <span>
                    inside <b>{c.zone.name}</b>{" "}
                    <span className={c.zoneActive ? "text-danger" : "text-muted"}>
                      ({c.zoneActive ? "restricted now" : `not active · ${describeSchedule(c.zone)}`})
                    </span>
                  </span>
                ) : (
                  <span className="text-muted">outside every zone, ignored</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Step>
      <Step n={3} title="Risk score" icon={<ListChecks size={14} />}>
        {decision.person?.zone ? (
          <>
            <ul className="mt-1 list-inside list-disc text-muted">
              {decision.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-1.5 flex flex-wrap items-center gap-2">
              Total <b>{decision.score}</b> <AlertLevelBadge level={decision.level} />
            </p>
          </>
        ) : (
          <span className="flex items-center gap-2">
            Nobody inside a restricted zone <AlertLevelBadge level="ignore" />
          </span>
        )}
      </Step>
      {alert && (
        <Outcome
          text={
            alert.level === "log"
              ? "Saved to the alert history without notifying the owner."
              : "Alert sent to the owner with a snapshot and the reasons."
          }
        />
      )}
    </ol>
  );
}

function Step({
  n,
  title,
  icon,
  children,
}: {
  n: number;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-bold text-brand">
        {n}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-semibold text-ink">
          {icon}
          {title}
        </p>
        <div className="text-ink/90">{children}</div>
      </div>
    </li>
  );
}

function Outcome({ text }: { text: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-pale px-3 py-2">
      <span>{text}</span>
      <Link href="/alerts" className="text-sm font-semibold text-brand hover:underline">
        Open alerts →
      </Link>
    </li>
  );
}

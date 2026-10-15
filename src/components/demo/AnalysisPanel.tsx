import Link from "next/link";
import { CircleAlert, Cpu, Footprints, ListChecks } from "lucide-react";
import { AlertLevelBadge } from "@/components/alerts/AlertLevelBadge";
import { describeSchedule } from "@/lib/schedule";
import type { Analysis } from "./useDemoEvents";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Step-by-step explanation of the latest automatic check, shown under the live view. */
export function AnalysisPanel({ analysis }: { analysis: Analysis }) {
  if (analysis.kind === "error") {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-danger-tint p-3 text-sm text-danger">
        <CircleAlert size={17} className="mt-0.5 shrink-0" />
        <span>{analysis.message}</span>
      </div>
    );
  }

  const checkedAt = <span className="font-mono text-xs text-muted">checked {timeFormat.format(analysis.checkedAt)}</span>;

  if (analysis.kind === "blocked") {
    const { health, alerts, repeated } = analysis;
    return (
      <ol className="flex flex-col gap-3 text-sm">
        <Step n={1} title="Camera health (simple image check, not AI)" aside={checkedAt}>
          Brightness {health.brightness} of 255 · contrast {health.contrast}
        </Step>
        <Step n={2} title="Decision">
          <span className="flex flex-wrap items-center gap-2">
            {health.blocked ? "Camera view is blocked" : "Camera view looks normal"}
            <AlertLevelBadge level={health.blocked ? "notify" : "ignore"} />
          </span>
        </Step>
        {alerts.length > 0 && <Outcome text="Owner alerted that this camera can no longer see." />}
        {repeated && <Outcome text="Already alerted for this recently, so it was not sent again." />}
      </ol>
    );
  }

  const { checks, decisions, inferenceMs, alerts, repeated } = analysis;
  const notified = alerts.filter((a) => a.level !== "log").length;
  return (
    <ol className="flex flex-col gap-3 text-sm">
      <Step n={1} title="Person detection (YOLOv8n, running in this browser)" icon={<Cpu size={14} />} aside={checkedAt}>
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
      <Step n={3} title="Risk score, per zone" icon={<ListChecks size={14} />}>
        {decisions.length === 0 ? (
          <span className="flex items-center gap-2">
            Nobody inside a restricted zone <AlertLevelBadge level="ignore" />
          </span>
        ) : (
          <div className="mt-1 flex flex-col gap-2">
            {decisions.map((d) => (
              <div key={d.zone.id} className="rounded-lg border border-line px-3 py-2">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  {d.zone.name}
                  {d.people > 1 && <span className="text-xs font-medium text-muted">({d.people} people)</span>}
                  <span className="ml-auto flex items-center gap-2 font-normal">
                    Total <b>{d.score}</b> <AlertLevelBadge level={d.level} />
                  </span>
                </p>
                <ul className="mt-1 list-inside list-disc text-muted">
                  {d.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Step>
      {alerts.length > 0 && (
        <Outcome
          text={
            notified === 0
              ? `${alerts.length === 1 ? "Event" : `${alerts.length} events`} saved to the history without notifying the owner.`
              : `${notified === 1 ? "1 alert" : `${notified} alerts`} sent to the owner automatically, each with a snapshot and its reasons.`
          }
        />
      )}
      {repeated && <Outcome text="Already alerted for this recently, so it was not sent again." />}
    </ol>
  );
}

function Step({
  n,
  title,
  icon,
  aside,
  children,
}: {
  n: number;
  title: string;
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-bold text-brand">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 font-semibold text-ink">
          {icon}
          {title}
          {aside && <span className="ml-auto">{aside}</span>}
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

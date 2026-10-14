"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CircleCheck, Radio } from "lucide-react";
import { useState } from "react";
import { AreaNameChip } from "@/components/areas/AreaNameChip";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { DEFAULT_SCHEDULE } from "@/data/seed";
import { FULL_FRAME } from "@/lib/geometry";
import { useHydrated } from "@/lib/useHydrated";
import { useNow } from "@/lib/useNow";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { ZoneShape } from "@/types";
import { ZoneCanvas, type DraftShape, type DrawTool } from "./ZoneCanvas";
import { ZoneDetailsForm, type ZoneDetails } from "./ZoneDetailsForm";
import { ZoneList } from "./ZoneList";
import { ZoneToolbar } from "./ZoneToolbar";

const SHAPE_LABEL: Record<ZoneShape, string> = {
  polygon: "Free shape",
  rectangle: "Rectangle",
  triangle: "Triangle",
  full: "Whole view",
};

export function ZoneEditor() {
  const { areaId } = useParams<{ areaId: string }>();
  const hydrated = useHydrated();
  const area = useVisionGuard((s) => s.areas.find((a) => a.id === areaId));
  const addZone = useVisionGuard((s) => s.addZone);
  const updateZone = useVisionGuard((s) => s.updateZone);
  const removeZone = useVisionGuard((s) => s.removeZone);
  const now = useNow(true);

  const [tool, setTool] = useState<DrawTool>("polygon");
  const [draft, setDraft] = useState<DraftShape | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!hydrated) return <ZoneEditorSkeleton />;

  if (!area) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <p className="text-lg font-semibold text-ink">Area not found</p>
        <ButtonLink href="/" variant="secondary" className="mt-5">
          Back to areas
        </ButtonLink>
      </div>
    );
  }

  if (area.camera.status !== "live") {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-tint text-brand">
          <Radio size={22} />
        </span>
        <p className="mt-3 text-lg font-semibold text-ink">Start the camera stream first</p>
        <p className="mt-1 text-sm text-muted">Zones are drawn on the camera&apos;s view, so the camera needs to be live.</p>
        <ButtonLink href={`/areas/${area.id}`} className="mt-5">
          Go to camera
        </ButtonLink>
      </div>
    );
  }

  const selected = area.zones.find((z) => z.id === selectedId) ?? null;
  const nextName = `Restricted zone ${area.zones.length + 1}`;

  const startDraft = (d: DraftShape) => {
    setDraft(d);
    setSelectedId(null);
    setNotice(null);
  };

  const saveDraft = (details: ZoneDetails) => {
    if (!draft) return;
    addZone(area.id, { ...details, shape: draft.shape, points: draft.points });
    setDraft(null);
    setTool("select");
    setSelectedId(null);
    setNotice(`“${details.name}” saved. It shows in red on the live view during its hours.`);
  };

  const changeTool = (t: DrawTool) => {
    setTool(t);
    setSelectedId(null);
    setNotice(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/areas/${area.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-brand"
          >
            <ArrowLeft size={15} /> Live view
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Restricted zones</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Draw the parts of this view where people should not be, then choose the hours they are restricted.
          </p>
        </div>
        <AreaNameChip area={area} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
          <ZoneToolbar
            tool={tool}
            onToolChange={changeTool}
            disabled={draft !== null}
            onWholeView={() => startDraft({ shape: "full", points: FULL_FRAME })}
          />
          <ZoneCanvas
            imageSrc={area.demoImage}
            imageAlt={`${area.name} camera view (demo photo)`}
            zones={area.zones}
            selectedId={selectedId}
            onSelect={setSelectedId}
            tool={tool}
            draft={draft}
            onDraftComplete={startDraft}
            onZonePointsChange={(zoneId, points) => updateZone(area.id, zoneId, { points })}
          />
          <p className="mt-3 text-xs text-muted">
            Zones are positions in this camera&apos;s view. If the camera is moved, redraw them.
          </p>
        </div>

        <aside className="rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-24">
          {draft ? (
            <ZoneDetailsForm
              key="draft"
              mode="new"
              shapeLabel={SHAPE_LABEL[draft.shape]}
              hazardArea={area.hazard}
              now={now}
              initial={{
                name: draft.shape === "full" ? `All of ${area.name}` : nextName,
                schedule: { ...DEFAULT_SCHEDULE },
                alwaysOn: false,
              }}
              onSave={saveDraft}
              onCancel={() => setDraft(null)}
            />
          ) : selected ? (
            <ZoneDetailsForm
              key={selected.id}
              mode="edit"
              shapeLabel={SHAPE_LABEL[selected.shape]}
              hazardArea={area.hazard}
              now={now}
              initial={{ name: selected.name, schedule: selected.schedule, alwaysOn: selected.alwaysOn }}
              onSave={(details) => {
                updateZone(area.id, selected.id, details);
                setSelectedId(null);
                setNotice(`“${details.name}” updated.`);
              }}
              onCancel={() => setSelectedId(null)}
              onDelete={() => {
                removeZone(area.id, selected.id);
                setSelectedId(null);
                setNotice(`“${selected.name}” deleted.`);
              }}
            />
          ) : (
            <>
              {notice && (
                <p
                  role="status"
                  className="mb-4 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-ink"
                >
                  <CircleCheck size={17} className="mt-0.5 shrink-0 text-success" />
                  {notice}
                </p>
              )}
              <ZoneList
                zones={area.zones}
                now={now}
                onSelect={(id) => {
                  setTool("select");
                  setSelectedId(id);
                  setNotice(null);
                }}
              />
              {area.zones.length > 0 && (
                <ButtonLink href={`/areas/${area.id}`} variant="secondary" className="mt-4 w-full">
                  Back to live view
                </ButtonLink>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export function ZoneEditorSkeleton() {
  return (
    <div aria-hidden className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="aspect-video animate-pulse rounded-2xl bg-white" />
      <div className="h-80 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

"use client";

import Link from "next/link";
import { ChevronRight, Plus, ShieldAlert } from "lucide-react";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useVisionGuard } from "@/store/useVisionGuard";
import type { Area, CameraStatus } from "@/types";
import { AreaIcon } from "./AreaIcon";

const STATUS: Record<CameraStatus, { label: string; dot: string }> = {
  disconnected: { label: "Not connected", dot: "bg-muted/50" },
  connecting: { label: "Connecting", dot: "bg-amber-400" },
  connected: { label: "Connected", dot: "bg-brand" },
  live: { label: "Live", dot: "bg-success" },
};

function AreaCard({ area }: { area: Area }) {
  const rename = useVisionGuard((s) => s.renameArea);
  const status = STATUS[area.camera.status];
  const href = `/areas/${area.id}`;

  return (
    <li className="flex flex-col rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-md hover:shadow-brand/5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
          <AreaIcon kind={area.kind} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={area.name}
            onSave={(name) => rename(area.id, name)}
            ariaLabel={`Rename ${area.name}`}
            className="-ml-1.5 max-w-full font-semibold text-ink"
          />
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            <span className={`size-2 rounded-full ${status.dot}`} />
            {status.label}
            {area.camera.ip && <span className="font-mono">· {area.camera.ip}</span>}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          <ShieldAlert size={15} />
          {area.zones.length === 0 ? "No zones yet" : `${area.zones.length} zone${area.zones.length > 1 ? "s" : ""}`}
        </span>
        <Link href={href} className="inline-flex items-center gap-0.5 font-semibold text-brand hover:underline">
          {area.camera.status === "disconnected" ? "Connect" : "Open"} <ChevronRight size={16} />
        </Link>
      </div>
    </li>
  );
}

export function AreaGrid({ areas }: { areas: Area[] }) {
  return (
    <>
      <PageHeader
        title="Your areas"
        description="Each area is one camera view. Click a name to rename it."
        actions={
          <ButtonLink href="/areas/new">
            <Plus size={16} /> Add area
          </ButtonLink>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {areas.map((a) => (
          <AreaCard key={a.id} area={a} />
        ))}
      </ul>
    </>
  );
}

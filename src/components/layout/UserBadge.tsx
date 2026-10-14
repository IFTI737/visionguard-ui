"use client";

import { InlineEdit } from "@/components/ui/InlineEdit";
import { useHydrated } from "@/lib/useHydrated";
import { useVisionGuard } from "@/store/useVisionGuard";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/** User name on the right of the navbar; click the name to edit it. */
export function UserBadge() {
  const hydrated = useHydrated();
  const name = useVisionGuard((s) => s.userName);
  const setName = useVisionGuard((s) => s.setUserName);

  if (!hydrated) {
    return <div className="h-9 w-36 animate-pulse rounded-full bg-pale" aria-hidden />;
  }

  return (
    <div className="flex items-center gap-2.5">
      <InlineEdit
        value={name}
        onSave={setName}
        ariaLabel="Edit your name"
        maxLength={32}
        className="max-w-[10rem] text-sm font-medium text-ink sm:max-w-[16rem]"
      />
      <span
        className="grid size-9 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand"
        title={name}
      >
        {initials(name)}
      </span>
    </div>
  );
}

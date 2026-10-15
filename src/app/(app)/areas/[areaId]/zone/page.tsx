import { Suspense } from "react";
import { ZoneEditor, ZoneEditorSkeleton } from "@/components/zone/ZoneEditor";

/** Draw restricted zones on a camera's still frame and set their hours. */
export default function ZonePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <Suspense fallback={<ZoneEditorSkeleton />}>
        <ZoneEditor />
      </Suspense>
    </div>
  );
}

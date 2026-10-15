import { Suspense } from "react";
import { CameraView, CameraViewSkeleton } from "@/components/camera/CameraView";

/** Camera page for one area: connect by IP, then start the (demo) stream. */
export default function AreaCameraPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      {/* The area id comes from the URL, which is only known at request time, so it needs Suspense. */}
      <Suspense fallback={<CameraViewSkeleton />}>
        <CameraView />
      </Suspense>
    </div>
  );
}

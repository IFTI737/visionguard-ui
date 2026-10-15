import type { Metadata } from "next";
import { Suspense } from "react";
import { PhoneCamera } from "@/components/phone/PhoneCamera";

export const metadata: Metadata = {
  title: "VisionGuard · Phone camera",
  description: "Use this phone as a live camera for your VisionGuard dashboard.",
};

/** Page the phone opens after scanning the QR code. No navbar: it is a simple full-screen camera. */
export default function PhoneCameraPage() {
  return (
    <main className="min-h-dvh bg-ink text-white">
      {/* The pairing code comes from the URL (request-time data), so it needs Suspense. */}
      <Suspense fallback={<div className="min-h-dvh" />}>
        <PhoneCamera />
      </Suspense>
    </main>
  );
}

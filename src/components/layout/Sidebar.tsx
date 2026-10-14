"use client";

import { Suspense } from "react";
import { useVisionGuard } from "@/store/useVisionGuard";
import { DemoDataActions } from "./DemoDataActions";
import { SidebarLinks, SidebarNav } from "./SidebarNav";

/**
 * Collapsible sidebar, opened and closed with the menu button in the navbar.
 * Phones: slides over the page with a dimmed backdrop.
 * Laptops (lg and up): sits beside the page and pushes the content over.
 */
export function Sidebar() {
  const open = useVisionGuard((s) => s.sidebarOpen);
  const setOpen = useVisionGuard((s) => s.setSidebarOpen);

  return (
    <>
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 top-16 z-30 bg-ink/30 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`fixed bottom-0 left-0 top-16 z-40 shrink-0 overflow-hidden transition-[transform,width] duration-200 ease-out lg:sticky lg:z-auto lg:h-[calc(100dvh-4rem)] lg:translate-x-0 ${
          open ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-0"
        }`}
      >
        <aside
          id="app-sidebar"
          aria-label="Main menu"
          inert={!open}
          className="flex h-full w-64 flex-col border-r border-line bg-white"
        >
          {/* With Cache Components, reading the URL on dynamic routes needs a Suspense boundary. */}
          <Suspense fallback={<SidebarLinks pathname={null} />}>
            <SidebarNav />
          </Suspense>

          <div className="mt-auto border-t border-line p-3">
            <DemoDataActions />
            <p className="mt-3 px-3 text-[11px] leading-snug text-muted">
              Demo build. Camera feeds are simulated with sample photos.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

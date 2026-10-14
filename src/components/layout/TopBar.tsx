"use client";

import Link from "next/link";
import { Menu, ShieldCheck } from "lucide-react";
import { useVisionGuard } from "@/store/useVisionGuard";
import { UserBadge } from "./UserBadge";

export function TopBar() {
  const open = useVisionGuard((s) => s.sidebarOpen);
  const toggle = useVisionGuard((s) => s.toggleSidebar);

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-3 backdrop-blur sm:px-5">
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Hide menu" : "Show menu"}
        aria-expanded={open}
        aria-controls="app-sidebar"
        className="grid size-10 place-items-center rounded-lg text-ink transition-colors hover:bg-brand-tint"
      >
        <Menu size={20} />
      </button>

      <Link href="/" className="flex items-center gap-2 rounded-lg pr-2">
        <span className="grid size-8 place-items-center rounded-lg bg-brand text-white">
          <ShieldCheck size={18} strokeWidth={2.25} />
        </span>
        <span className="text-[17px] font-semibold tracking-tight text-ink">VisionGuard</span>
      </Link>

      <div className="ml-auto">
        <UserBadge />
      </div>
    </header>
  );
}

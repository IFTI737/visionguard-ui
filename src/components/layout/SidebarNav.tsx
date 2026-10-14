"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutGrid, Plus, Settings, type LucideIcon } from "lucide-react";
import { useHydrated } from "@/lib/useHydrated";
import { useVisionGuard } from "@/store/useVisionGuard";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra paths that should also highlight this item. */
  match?: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Areas",
    icon: LayoutGrid,
    match: (p) => p === "/" || (p.startsWith("/areas/") && p !== "/areas/new"),
  },
  { href: "/areas/new", label: "Add area", icon: Plus },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

const DESKTOP_QUERY = "(min-width: 1024px)";

/** The links themselves. `pathname` is null while the URL is still unknown (prerender). */
export function SidebarLinks({ pathname }: { pathname: string | null }) {
  const setOpen = useVisionGuard((s) => s.setSidebarOpen);
  const hydrated = useHydrated();
  const newAlerts = useVisionGuard((s) => s.alerts.filter((a) => a.status === "new").length);

  /** On phones, close the menu after choosing a page. */
  const closeOnMobile = () => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) setOpen(false);
  };

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: Icon, match }) => {
        const active = pathname !== null && (match ? match(pathname) : pathname === href);
        return (
          <Link
            key={href}
            href={href}
            onClick={closeOnMobile}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-brand-tint text-brand" : "text-ink hover:bg-pale"
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
            {href === "/alerts" && hydrated && newAlerts > 0 && (
              <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">
                {newAlerts}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Reads the current URL to highlight the active page. Must sit inside <Suspense> (see Sidebar). */
export function SidebarNav() {
  const pathname = usePathname();
  return <SidebarLinks pathname={pathname} />;
}

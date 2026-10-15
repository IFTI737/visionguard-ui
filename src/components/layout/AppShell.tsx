import { AlertDelivery } from "@/components/notify/AlertDelivery";
import { PhoneWatch } from "@/components/notify/PhoneWatch";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

/** Page frame: navbar on top, collapsible sidebar on the left, page content on the right. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <div className="relative flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 bg-pale/60">{children}</main>
      </div>
      <AlertDelivery />
      <PhoneWatch />
    </div>
  );
}

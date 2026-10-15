import { AppShell } from "@/components/layout/AppShell";

/** Dashboard pages: navbar + sidebar. The phone camera page (/cam) sits outside this group. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

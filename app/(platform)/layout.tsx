import { requireAuth } from "@/lib/auth";
import AppShell from "@/components/shell/AppShell";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return <AppShell userId={user.id}>{children}</AppShell>;
}

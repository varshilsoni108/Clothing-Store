import { requireAdmin } from "@/lib/db/helpers";
import { AdminNav } from "@/components/admin/admin-nav";
import { ToastProvider } from "@/components/ui/toast";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  await requireAdmin();
  return (
    <ToastProvider>
      <div className="min-h-dvh">
        <div className="flex min-h-dvh bg-accent-soft/40">
          <aside className="hidden w-60 shrink-0 border-r border-line bg-background px-4 py-6 lg:block">
            <AdminNav />
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminMobileHeader />
            <main className="container-store flex-1 py-8 lg:max-w-none">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

function AdminMobileHeader() {
  return (
    <div className="border-b border-line bg-background lg:hidden">
      <div className="container-store py-3">
        <AdminNav horizontal />
      </div>
    </div>
  );
}
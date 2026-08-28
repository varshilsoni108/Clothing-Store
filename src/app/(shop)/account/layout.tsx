import { requireUser } from "@/lib/db/helpers";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return (
    <div className="container-store py-10">
      <h1 className="font-display text-3xl font-semibold text-accent sm:text-4xl">
        My Account
      </h1>
      <div className="mt-6 grid gap-10 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
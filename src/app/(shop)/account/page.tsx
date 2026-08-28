import Link from "next/link";
import { requireUser, getOwnProfile } from "@/lib/db/helpers";
import { createClient } from "@/lib/supabase/server";
import { getOrdersForUser } from "@/lib/db/orders";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { Card } from "@/components/account/card";
import { formatINR, formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default async function AccountPage() {
  const user = await requireUser();
  const profile = await getOwnProfile();
  const orders = await getOrdersForUser(user.id, 5);

  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  const defaultAddress = addresses?.find((a) => a.is_default) ?? addresses?.[0];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-accent p-6 text-background">
        <p className="text-xs uppercase tracking-wider text-background/70">
          Welcome back
        </p>
        <h2 className="font-display mt-1 text-2xl font-semibold">
          {profile?.full_name ?? user.email}
        </h2>
        <p className="mt-1 text-sm text-background/70">{user.email}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          title="Recent orders"
          footer={
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              View all orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              No orders yet.{" "}
              <Link href="/shop" className="font-medium text-accent hover:underline">
                Start shopping
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-accent-soft/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-accent">{o.order_number}</p>
                      <p className="text-xs text-muted">{formatDate(o.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatINR(o.total_amount)}</span>
                      <OrderStatusBadge status={o.order_status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Delivery address"
          footer={
            <Link
              href="/account/addresses"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Manage addresses <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {defaultAddress ? (
            <div className="text-sm text-foreground/80">
              <p className="font-medium text-accent">{defaultAddress.full_name}</p>
              <p className="mt-1">
                {defaultAddress.address_line_1}
                {defaultAddress.address_line_2 ? `, ${defaultAddress.address_line_2}` : ""}
              </p>
              <p>
                {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postal_code}
              </p>
              <p className="mt-1 text-muted">{defaultAddress.phone}</p>
            </div>
          ) : (
            <p className="text-sm text-muted">
              No saved addresses. Add one for faster checkout.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
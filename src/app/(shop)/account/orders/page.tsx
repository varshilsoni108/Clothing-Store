import { requireUser } from "@/lib/db/helpers";
import { getOrdersForUser } from "@/lib/db/orders";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { formatINR, formatDate } from "@/lib/utils";
import { PAYMENT_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getOrdersForUser(user.id, 50);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-accent">Orders</h2>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-sm text-muted">
            You haven&apos;t placed any orders yet.
          </p>
          <Link
            href="/shop"
            className="mt-3 inline-block rounded-full border border-accent px-5 py-2 text-sm font-medium text-accent hover:bg-accent-soft"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-3 py-5 transition-colors hover:bg-accent-soft/40"
              >
                <div>
                  <p className="font-medium text-accent">{o.order_number}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Placed {formatDate(o.created_at)} · {PAYMENT_STATUS_LABELS[o.payment_status]}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">{formatINR(o.total_amount)}</span>
                  <OrderStatusBadge status={o.order_status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
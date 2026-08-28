import Link from "next/link";
import { listAdminOrders } from "@/lib/db/admin";
import { Pagination } from "@/components/store/pagination";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { PaymentBadge } from "@/components/admin/payment-badge";
import { SearchOrdersBox } from "@/components/admin/search-orders-box";
import { AdminOrdersFilters } from "@/components/admin/admin-orders-filters";
import { formatINR, formatDate } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const orderStatus =
    typeof sp.status === "string" ? (sp.status as OrderStatus) : "";
  const paymentStatus =
    typeof sp.payment === "string" ? (sp.payment as PaymentStatus) : "";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "") || 1);

  const result = await listAdminOrders({
    search: q,
    orderStatus: orderStatus as OrderStatus | "",
    paymentStatus: paymentStatus as PaymentStatus | "",
    page,
    pageSize: 15,
  });

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (orderStatus) params.set("status", orderStatus);
    if (paymentStatus) params.set("payment", paymentStatus);
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-accent">Orders</h1>
        <p className="mt-1 text-sm text-muted">{result.total} orders total</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-[1fr_200px_200px]">
        <SearchOrdersBox
          initial={q}
          baseParams={{ status: orderStatus, payment: paymentStatus }}
        />
        <AdminOrdersFilters
          search={q}
          status={orderStatus}
          payment={paymentStatus}
        />
      </div>

      {result.orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          No orders match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-background">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Placed</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.orders.map((o) => (
                <tr key={o.id} className="hover:bg-accent-soft/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(o.created_at)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatINR(o.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.order_status} />
                  </td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={o.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} makeHref={makeHref} />
    </div>
  );
}
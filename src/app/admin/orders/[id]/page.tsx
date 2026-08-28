import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/db/admin";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { PaymentBadge } from "@/components/admin/payment-badge";
import { OrderControls } from "@/components/admin/order-controls";
import { OrderTimeline } from "@/components/account/order-timeline";
import { formatINR, formatDateTime } from "@/lib/utils";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const address = order.shipping_address_snapshot as {
    full_name: string;
    phone?: string;
    address_line_1: string;
    address_line_2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-xs text-muted hover:text-accent hover:underline">
        ← All orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-accent">
            {order.order_number}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Placed {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <OrderStatusBadge status={order.order_status} />
          <PaymentBadge status={order.payment_status} />
        </div>
      </div>

      {order.customer && (
        <div className="rounded-2xl border border-line p-5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Customer
          </p>
          <p className="mt-2 font-medium text-accent">
            {order.customer.full_name ?? "—"}
          </p>
          <p className="text-muted">
            {order.customer.email ?? ""}
            {order.customer.phone ? ` · ${order.customer.phone}` : ""}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-line p-6">
            <OrderTimeline status={order.order_status} />
          </div>

          <div className="rounded-2xl border border-line p-6">
            <OrderControls
              orderId={order.id}
              orderStatus={order.order_status}
              paymentStatus={order.payment_status}
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-line bg-background">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Variant</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.order_items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.image_url_snapshot && (
                          <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-accent-soft">
                            <Image
                              src={item.image_url_snapshot}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </span>
                        )}
                        <span className="font-medium text-accent">
                          {item.product_name_snapshot}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.size ? `Size ${item.size}` : "—"}
                      {item.color ? ` · ${item.color}` : ""}
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{formatINR(item.price_snapshot)}</td>
                    <td className="px-4 py-3 font-semibold">
                      {formatINR(item.price_snapshot * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="h-fit space-y-5 rounded-2xl border border-line p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Shipping to
            </p>
            <p className="mt-2 text-sm text-foreground/80">
              {address.full_name}
              <br />
              {address.address_line_1}
              {address.address_line_2 ? `, ${address.address_line_2}` : ""}
              <br />
              {address.city}, {address.state} {address.postal_code}
              <br />
              {address.country}
              {address.phone ? <><br />{address.phone}</> : null}
            </p>
          </div>

          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium">{formatINR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="font-medium">
                {order.shipping_amount === 0 ? "Free" : formatINR(order.shipping_amount)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold">{formatINR(order.total_amount)}</dd>
            </div>
          </dl>

          {order.razorpay_order_id && (
            <p className="rounded-lg bg-accent-soft/60 px-3 py-2 text-[11px] text-muted break-all">
              Razorpay order: {order.razorpay_order_id}
            </p>
          )}
          {order.razorpay_payment_id && (
            <p className="rounded-lg bg-accent-soft/60 px-3 py-2 text-[11px] text-muted break-all">
              Razorpay payment: {order.razorpay_payment_id}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
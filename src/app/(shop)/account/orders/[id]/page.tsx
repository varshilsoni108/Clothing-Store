import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/db/helpers";
import { getOrderForUser } from "@/lib/db/orders";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { OrderCancelButton } from "@/components/account/order-cancel-button";
import { OrderTimeline } from "@/components/account/order-timeline";
import { formatINR, formatDateTime } from "@/lib/utils";
import { PAYMENT_STATUS_LABELS } from "@/lib/constants";
import type { Address } from "@/lib/types";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const order = await getOrderForUser(user.id, id);
  if (!order) notFound();

  const address = order.shipping_address_snapshot as Address;

  return (
    <div>
      <Link
        href="/account/orders"
        className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
      >
        ← All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-accent">
            {order.order_number}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Placed {formatDateTime(order.created_at)} ·{" "}
            {PAYMENT_STATUS_LABELS[order.payment_status]}
          </p>
        </div>
        <OrderStatusBadge status={order.order_status} />
      </div>

      <div className="mt-6 rounded-2xl border border-line p-6">
        <OrderTimeline status={order.order_status} />
      </div>

      {order.order_status === "pending" && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-accent-soft/60 px-4 py-3">
          <p className="text-sm text-muted">
            {order.payment_status === "pending"
              ? "Payment not yet received for this order."
              : "This order can still be cancelled."}
          </p>
          <OrderCancelButton orderId={order.id} />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-line border-y border-line">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-accent-soft">
                {item.image_url_snapshot && (
                  <Image
                    src={item.image_url_snapshot}
                    alt={item.product_name_snapshot}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-accent">
                  {item.product_name_snapshot}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {item.size ? `Size ${item.size}` : "One size"}
                  {item.color ? ` · ${item.color}` : ""} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold">
                {formatINR(item.price_snapshot * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

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
                {order.shipping_amount === 0
                  ? "Free"
                  : formatINR(order.shipping_amount)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold">{formatINR(order.total_amount)}</dd>
            </div>
          </dl>

          {order.razorpay_payment_id && (
            <p className="rounded-lg bg-accent-soft/60 px-3 py-2 text-[11px] text-muted">
              Payment ref: {order.razorpay_payment_id}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
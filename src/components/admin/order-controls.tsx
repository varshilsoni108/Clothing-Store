"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, updatePaymentStatus } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["pending", "processing", "cancelled"],
  processing: ["confirmed", "shipped", "cancelled"],
  shipped: ["processing", "delivered", "cancelled"],
  delivered: ["shipped", "returned"],
  cancelled: [],
  returned: [],
};

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["paid", "failed"],
  paid: ["refunded"],
  failed: ["pending", "paid"],
  refunded: ["paid"],
};

export function OrderControls({
  orderId,
  orderStatus,
  paymentStatus,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<string | null>(null);

  async function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    key: string
  ) {
    setPending(key);
    try {
      const res = await action();
      if (res.ok) {
        toast("Updated.", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Could not update.", "error");
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Order status
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_TRANSITIONS[orderStatus].map((next) => (
            <Button
              key={next}
              size="sm"
              variant="outline"
              loading={pending === `s-${next}`}
              onClick={() =>
                run(() => updateOrderStatus(orderId, next), `s-${next}`)
              }
            >
              → {next}
            </Button>
          ))}
          {STATUS_TRANSITIONS[orderStatus].length === 0 && (
            <p className="text-sm text-muted">No transitions available.</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Payment status
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PAYMENT_TRANSITIONS[paymentStatus].map((next) => (
            <Button
              key={next}
              size="sm"
              variant="outline"
              loading={pending === `p-${next}`}
              onClick={() =>
                run(() => updatePaymentStatus(orderId, next), `p-${next}`)
              }
            >
              → {next}
            </Button>
          ))}
          {PAYMENT_TRANSITIONS[paymentStatus].length === 0 && (
            <p className="text-sm text-muted">No transitions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
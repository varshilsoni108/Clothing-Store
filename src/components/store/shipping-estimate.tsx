"use client";

import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export function ShippingEstimate({ subtotal }: { subtotal: number }) {
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return (
      <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        You&apos;ve unlocked <strong>free shipping</strong>!
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-xs text-muted">
        You&apos;re{" "}
        <span className="font-semibold text-foreground">
          ₹{remaining.toLocaleString("en-IN")}
        </span>{" "}
        away from free shipping.
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent-soft">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
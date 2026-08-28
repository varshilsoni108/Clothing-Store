"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/providers/cart-provider";
import { useUser } from "@/providers/user-provider";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { EmptyState } from "@/components/ui/empty-state";
import { ShippingEstimate } from "@/components/store/shipping-estimate";
import { formatINR } from "@/lib/utils";
import { ShoppingBag, Trash2 } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export default function CartPage() {
  const {
    lines,
    loading,
    subtotal,
    updateQuantity,
    removeItem,
    clear,
  } = useCart();
  const { user } = useUser();

  const shipping = {
    amount: subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 99,
  };
  const total = subtotal + shipping.amount;

  return (
    <div className="container-store py-10">
      <h1 className="font-display text-3xl font-semibold text-accent sm:text-4xl">
        Your Cart
      </h1>

      {loading ? (
        <div className="mt-10 space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-28 w-24 rounded-xl bg-accent-soft" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-4 w-1/3 rounded bg-accent-soft" />
                <div className="h-4 w-1/4 rounded bg-accent-soft" />
                <div className="h-4 w-1/5 rounded bg-accent-soft" />
              </div>
            </div>
          ))}
        </div>
      ) : lines.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Your cart is empty"
            description="Browse the collection and find something you love."
            action={{ label: "Start shopping", href: "/shop" }}
            icon={<ShoppingBag className="h-5 w-5" />}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted">
                {lines.reduce((n, l) => n + l.quantity, 0)} item
                {lines.reduce((n, l) => n + l.quantity, 0) === 1 ? "" : "s"}
              </p>
              <button
                onClick={clear}
                className="text-xs font-medium text-muted underline-offset-2 hover:text-red-700 hover:underline"
              >
                Clear cart
              </button>
            </div>

            <ul className="divide-y divide-line border-y border-line">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-5 py-6">
                  <Link
                    href={`/product/${line.slug}`}
                    className="relative h-32 w-28 shrink-0 overflow-hidden rounded-xl bg-accent-soft"
                  >
                    {line.image && (
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${line.slug}`}
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          {line.name}
                        </Link>
                        <p className="mt-1 text-xs text-muted">
                          {line.size ? `Size ${line.size}` : "One size"}
                          {line.color ? ` · ${line.color}` : ""}
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {formatINR(line.price)}
                        </p>
                        {line.stock < 5 && line.stock > 0 && (
                          <p className="mt-1 text-[11px] font-medium text-amber-800">
                            Only {line.stock} left in stock
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(line.variantId)}
                        aria-label={`Remove ${line.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                      <QuantitySelector
                        value={line.quantity}
                        max={Math.max(1, line.stock)}
                        onChange={(q) => updateQuantity(line.variantId, q)}
                      />
                      <p className="text-sm font-semibold">
                        {formatINR(line.price * line.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="h-fit rounded-2xl border border-line p-6 lg:sticky lg:top-28">
            <h2 className="font-display text-lg font-semibold text-accent">
              Order Summary
            </h2>

            <ShippingEstimate subtotal={subtotal} />

            <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-medium">
                  {shipping.amount === 0 ? "Free" : formatINR(shipping.amount)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-semibold text-accent">Total</dt>
                <dd className="font-semibold text-accent">{formatINR(total)}</dd>
              </div>
            </dl>

            {!user && (
              <p className="mt-4 rounded-lg bg-accent-soft/70 px-3 py-2.5 text-xs text-muted">
                You&apos;ll need to{" "}
                <Link href="/login" className="font-medium text-accent underline">
                  log in
                </Link>{" "}
                to complete your order. Your cart is saved on this device.
              </p>
            )}

            <Button href="/checkout" fullWidth className="mt-5" size="lg">
              Proceed to Checkout
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted">
              Taxes included in prices. Payment is collected at checkout.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
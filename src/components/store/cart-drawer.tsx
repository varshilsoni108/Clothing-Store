"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { formatINR } from "@/lib/utils";

export function CartDrawer() {
  const { lines, loading, count, subtotal, isOpen, close, updateQuantity, removeItem } =
    useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-accent">
              Your Cart
            </h2>
            <p className="text-xs text-muted">
              {count > 0 ? `${count} item${count === 1 ? "" : "s"}` : "Nothing here yet"}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            Loading your cart…
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-muted">Your cart is empty.</p>
            <Button variant="outline" size="sm" href="/shop" onClick={close}>
              Start shopping
            </Button>
          </div>
        ) : (
          <>
            <ul className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-4">
                  <Link
                    href={`/product/${line.slug}`}
                    onClick={close}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-accent-soft"
                  >
                    {line.image ? (
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${line.slug}`}
                          onClick={close}
                          className="truncate text-sm font-medium text-accent hover:underline"
                        >
                          {line.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">
                          {line.size ? `Size ${line.size}` : "One size"}
                          {line.color ? ` · ${line.color}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(line.variantId)}
                        aria-label={`Remove ${line.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <QuantitySelector
                        value={line.quantity}
                        max={Math.max(1, line.stock)}
                        onChange={(q) => updateQuantity(line.variantId, q)}
                      />
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatINR(line.price * line.quantity)}
                        </p>
                        {!line.active && (
                          <p className="text-[11px] text-red-700">
                            Unavailable — remove item
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-5 py-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{formatINR(subtotal)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" fullWidth href="/cart" onClick={close}>
                  View Cart
                </Button>
                <Button fullWidth href="/checkout" onClick={close}>
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
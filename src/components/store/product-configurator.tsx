"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/components/ui/toast";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import type { ProductVariant } from "@/lib/types";

export function ProductConfigurator({
  variants,
}: {
  variants: ProductVariant[];
}) {
  const active = useMemo(
    () =>
      variants
        .filter((v) => v.active)
        .sort(
          (a, b) =>
            (b.stock_quantity > 0 ? 1 : 0) - (a.stock_quantity > 0 ? 1 : 0)
        ),
    [variants]
  );

  const hasSizes =
    active.some((v) => v.size) &&
    new Set(active.map((v) => v.size)).size > 1;
  const hasColors =
    active.some((v) => v.color) &&
    new Set(active.map((v) => v.color)).size > 1;

  const sizes = useMemo(
    () =>
      Array.from(
        new Set(active.filter((v) => v.size).map((v) => v.size) as string[])
      ),
    [active]
  );
  const colors = useMemo(
    () =>
      Array.from(
        new Set(active.filter((v) => v.color).map((v) => v.color) as string[])
      ),
    [active]
  );

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  function rowFor(s: string | null, c: string | null): ProductVariant | null {
    if (hasSizes && hasColors) {
      if (!s || !c) return null;
      return active.find((v) => v.size === s && v.color === c) ?? null;
    }
    if (hasSizes) {
      if (!s) return null;
      return active.find((v) => v.size === s) ?? null;
    }
    if (hasColors) {
      if (!c) return null;
      return active.find((v) => v.color === c) ?? null;
    }
    return active[0] ?? null;
  }

  const selected = rowFor(size, color);

  const sizeUnavailableForColor =
    hasSizes && hasColors && color
      ? (s: string) =>
          !active.some(
            (v) => v.size === s && v.color === color && v.stock_quantity > 0
          )
      : () => false;

  const colorUnavailableForSize =
    hasSizes && hasColors && size
      ? (c: string) =>
          !active.some(
            (v) => v.size === size && v.color === c && v.stock_quantity > 0
          )
      : () => false;

  function pick(field: "size" | "color", value: string) {
    let nextSize = size;
    let nextColor = color;
    if (field === "size") nextSize = nextSize === value ? null : value;
    if (field === "color") nextColor = nextColor === value ? null : value;
    setSize(nextSize);
    setColor(nextColor);
  }

  const maxQty = selected ? Math.min(selected.stock_quantity, 10) : 1;

  const stockLabel = selected
    ? selected.stock_quantity === 0
      ? "Out of stock"
      : selected.stock_quantity <= LOW_STOCK_THRESHOLD
        ? `Only ${selected.stock_quantity} left`
        : "In stock"
    : "Select all options to continue";

  return (
    <div className="space-y-6">
      {sizes.length > 0 && (
        <OptionGroup label="Size">
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const disabled =
                sizeUnavailableForColor(s) ||
                !active.some((v) => v.size === s && v.stock_quantity > 0);
              return (
                <button
                  key={s}
                  onClick={() => pick("size", s)}
                  disabled={disabled}
                  className={cn(
                    "min-w-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    size === s
                      ? "border-accent bg-accent text-background"
                      : "border-line hover:border-accent",
                    disabled && "disabled:line-through"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </OptionGroup>
      )}

      {hasColors && (
        <OptionGroup label="Colour">
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const disabled =
                colorUnavailableForSize(c) ||
                !active.some((v) => v.color === c && v.stock_quantity > 0);
              return (
                <button
                  key={c}
                  onClick={() => pick("color", c)}
                  disabled={disabled}
                  className={cn(
                    "min-w-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    color === c
                      ? "border-accent bg-accent text-background"
                      : "border-line hover:border-accent",
                    disabled && "disabled:line-through"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </OptionGroup>
      )}

      {!hasSizes && !hasColors && active.length === 0 && (
        <p className="text-sm font-medium text-red-700">
          This product is currently unavailable.
        </p>
      )}

      {selected && (
        <p
          className={cn(
            "text-sm font-medium",
            selected.stock_quantity === 0
              ? "text-red-700"
              : selected.stock_quantity <= LOW_STOCK_THRESHOLD
                ? "text-amber-800"
                : "text-emerald-800"
          )}
        >
          {stockLabel}
        </p>
      )}

      {selected && selected.stock_quantity > 0 && (
        <OptionGroup label="Quantity">
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            max={maxQty}
          />
        </OptionGroup>
      )}

      <BuyRow
        variantId={selected?.id ?? null}
        stock={selected?.stock_quantity ?? 0}
        quantity={quantity}
      />
    </div>
  );
}

function OptionGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function BuyRow({
  variantId,
  stock,
  quantity,
}: {
  variantId: string | null;
  stock: number;
  quantity: number;
}) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!variantId) {
    return (
      <p className="rounded-xl border border-line bg-accent-soft/60 px-4 py-3 text-sm text-muted">
        Select size{quantity && stock === 0 ? "" : ""} to add to cart.
      </p>
    );
  }

  if (stock === 0) {
    return (
      <button
        disabled
        className="w-full rounded-full bg-muted/40 py-3.5 text-sm font-medium uppercase tracking-wide text-muted"
      >
        Out of stock
      </button>
    );
  }

  const vid = variantId;

  async function addToCart() {
    setPending(true);
    try {
      const ok = await addItem(vid, quantity);
      if (!ok) toast("Could not add to cart. Please try again.", "error");
      else toast("Added to your cart.", "success");
    } finally {
      setPending(false);
    }
  }

  async function buyNow() {
    setPending(true);
    try {
      await addItem(vid, quantity);
      router.push("/checkout");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={addToCart}
        disabled={pending}
        className="w-full rounded-full border border-accent py-3.5 text-sm font-medium uppercase tracking-wide text-accent transition-colors hover:bg-accent-soft disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>
      <button
        onClick={buyNow}
        disabled={pending}
        className="w-full rounded-full bg-accent py-3.5 text-sm font-medium uppercase tracking-wide text-background transition-colors hover:bg-foreground disabled:opacity-60"
      >
        Buy now
      </button>
    </div>
  );
}
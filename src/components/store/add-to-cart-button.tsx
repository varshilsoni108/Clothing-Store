"use client";

import { useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  variantId,
  label = "Add to cart",
  fullWidth,
  size = "md",
}: {
  variantId: string;
  label?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { addItem, open } = useCart();
  const [pending, setPending] = useState(false);

  const sizeClasses = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-7 text-sm",
  };

  async function handle() {
    if (pending) return;
    setPending(true);
    try {
      const ok = await addItem(variantId, 1);
      if (ok) open();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-accent text-background font-medium tracking-wide transition-colors duration-200 hover:bg-foreground disabled:cursor-not-allowed disabled:opacity-70",
        sizeClasses[size],
        fullWidth && "w-full"
      )}
    >
      {pending ? "Adding…" : label}
    </button>
  );
}
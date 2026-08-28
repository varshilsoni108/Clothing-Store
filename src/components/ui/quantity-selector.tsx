"use client";

import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 10,
  disabled,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className={cn(
        "inline-flex h-10 items-stretch overflow-hidden rounded-lg border border-line bg-background",
        disabled && "opacity-50",
        className
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="w-10 text-lg text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-muted/40"
      >
        −
      </button>
      <span
        aria-live="polite"
        className="flex w-10 items-center justify-center border-x border-line text-sm font-medium tabular-nums"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className="w-10 text-lg text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-muted/40"
      >
        +
      </button>
    </div>
  );
}
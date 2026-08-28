import { formatINR, discountPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Price({
  price,
  compareAt,
  className,
  size = "md",
}: {
  price: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };
  const discount = compareAt && compareAt > price ? discountPercent(price, compareAt) : null;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-medium text-foreground", sizeClasses[size])}>
        {formatINR(price)}
      </span>
      {discount !== null && compareAt && (
        <>
          <span
            className={cn(
              "text-muted line-through",
              size === "lg" ? "text-sm" : "text-xs"
            )}
          >
            {formatINR(compareAt)}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
            {discount}% off
          </span>
        </>
      )}
    </div>
  );
}
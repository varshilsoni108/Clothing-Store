import { cn } from "@/lib/utils";
import { ORDER_TIMELINE } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        This order was cancelled.
      </div>
    );
  }
  if (status === "returned") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        This order was returned.
      </div>
    );
  }

  // Index up to the current status in the happy-path timeline.
  const index = ORDER_TIMELINE.findIndex((s) => s.key === status);
  const last = status === "delivered" ? ORDER_TIMELINE.length : index;

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
      {ORDER_TIMELINE.map((step, i) => {
        const done = i < last;
        const current = i === index;
        return (
          <li key={step.key} className="relative flex flex-1 gap-3 sm:block">
            {i < ORDER_TIMELINE.length - 1 && (
              <span
                className={cn(
                  "absolute left-5 top-5 hidden h-0.5 w-[calc(100%-2.5rem)] sm:left-10 sm:top-4 sm:block",
                  i < last ? "bg-accent" : "bg-line"
                )}
              />
            )}
            <div className="flex items-center gap-3 sm:flex-col sm:items-start">
              <span
                className={cn(
                  "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  done
                    ? "border-accent bg-accent text-background"
                    : current
                      ? "border-accent bg-background text-accent"
                      : "border-line bg-background text-muted"
                )}
              >
                {i + 1}
              </span>
              <div className="pb-6 sm:pb-0 sm:pr-4">
                <p
                  className={cn(
                    "text-sm font-medium",
                    done || current ? "text-accent" : "text-muted"
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-muted">{step.description}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
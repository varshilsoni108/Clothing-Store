import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: {
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-muted">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-accent">
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          href={action.href}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
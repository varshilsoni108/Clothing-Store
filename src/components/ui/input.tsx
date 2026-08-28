import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  startAdornment?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  startAdornment,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? props.name : undefined);
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium uppercase tracking-wider text-muted"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {startAdornment && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
            {startAdornment}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            "h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-foreground",
            startAdornment ? "pl-9" : "",
            error ? "border-red-600" : "border-line",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-700">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
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
      <textarea
        id={inputId}
        aria-invalid={!!error}
        className={cn(
          "w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-foreground",
          error ? "border-red-600" : "border-line"
        )}
        rows={props.rows ?? 4}
        {...props}
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
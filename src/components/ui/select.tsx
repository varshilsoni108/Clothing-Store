import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  defaultValue,
  ...props
}: SelectProps) {
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
      <select
        id={inputId}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        className={cn(
          "h-11 w-full appearance-none rounded-lg border border-line bg-background px-4 pr-9 text-sm outline-none transition-colors focus:border-foreground",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20fill%3D%22none%22%20stroke%3D%22%231c1917%22%20stroke-width%3D%221.5%22/%3E%3C/svg%3E')] bg-[length:12px_8px] bg-no-repeat bg-[right_1rem_center]",
          error && "border-red-600"
        )}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
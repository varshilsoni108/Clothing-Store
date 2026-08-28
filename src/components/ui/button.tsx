import Link from "next/link";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "light" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-background hover:bg-foreground disabled:bg-muted",
  outline:
    "border border-foreground/25 bg-transparent text-foreground hover:border-foreground hover:bg-accent-soft",
  ghost: "bg-transparent text-foreground hover:bg-accent-soft",
  light: "bg-background text-accent hover:bg-accent-soft",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-sm",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  href?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  href,
  className,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className
  );

  const inner = (
    <>
      {loading && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </>
  );

  if (href) {
    return (
      <LinkLegacy href={href} className={classes}>
        {inner}
      </LinkLegacy>
    );
  }

  return (
    <button
      type={type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {inner}
    </button>
  );
}

// Local link wrapper to avoid circular typing complexity.

function LinkLegacy({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
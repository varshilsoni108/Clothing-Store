import Link from "next/link";

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-muted">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label + i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>›</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-accent hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-foreground" : ""}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
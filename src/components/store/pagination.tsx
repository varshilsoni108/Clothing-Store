import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex items-center justify-center gap-2"
    >
      <Link
        href={makeHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border border-line text-foreground/80 transition-colors hover:border-accent hover:text-accent",
          page <= 1 && "pointer-events-none opacity-40"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={makeHref(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
              p === page
                ? "bg-accent text-background"
                : "text-foreground/80 hover:bg-accent-soft"
            )}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={makeHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border border-line text-foreground/80 transition-colors hover:border-accent hover:text-accent",
          page >= totalPages && "pointer-events-none opacity-40"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { searchProductsAction } from "@/actions/search";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(() => {
      if (!q) {
        setResults([]);
        setLoading(false);
        setOpen(false);
        return;
      }
      setLoading(true);
      searchProductsAction(q)
        .then((res) => {
          setResults(res);
          setLoading(false);
          setOpen(true);
        })
        .catch(() => {
          setResults([]);
          setLoading(false);
          setOpen(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={boxRef} className={`relative ${className ?? ""}`}>
      <form onSubmit={submit} className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">
          <Search className="h-4 w-4" />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search products…"
          aria-label="Search products"
          className="h-10 w-full rounded-full border border-line bg-background pl-10 pr-9 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            aria-label="Clear search"
            className="absolute inset-y-0 right-2 flex w-7 items-center justify-center text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-2xl border border-line bg-background shadow-xl">
          {loading ? (
            <p className="px-4 py-5 text-center text-sm text-muted">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-muted">
              No products match “{query}”.
            </p>
          ) : (
            <ul>
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/product/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent-soft"
                  >
                    <span className="relative h-11 w-9 shrink-0 overflow-hidden rounded bg-accent-soft">
                      {p.main_image ? (
                        <Image
                          src={p.main_image}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-accent">
                        {p.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium">
                      {formatINR(p.price)}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-line">
                <Link
                  href={`/shop?q=${encodeURIComponent(query)}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground"
                >
                  View all results
                </Link>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
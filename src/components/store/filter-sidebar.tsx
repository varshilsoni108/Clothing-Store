"use client";

import { useRef, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface FilterInitialState {
  q?: string;
  sizes: string[];
  colors: string[];
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

export function FilterSidebar({
  initial,
  facetSizes,
  facetColors,
}: {
  initial: FilterInitialState;
  facetSizes: string[];
  facetColors: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sizes, setSizes] = useState<string[]>(initial.sizes);
  const [colors, setColors] = useState<string[]>(initial.colors);
  const [minPrice, setMinPrice] = useState(initial.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice ?? "");
  const [sort, setSort] = useState(initial.sort ?? "newest");
  const [mobileOpen, setMobileOpen] = useState(false);
  const minRef = useRef(minPrice);
  const maxRef = useRef(maxPrice);

  function push(newParams: Pick<FilterInitialState, "sizes" | "colors" | "minPrice" | "maxPrice" | "sort" | "q">) {
    const params = new URLSearchParams(searchParams.toString());
    const set = (key: string, value: string) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };
    set("sort", newParams.sort ?? sort);
    if (newParams.q) set("q", newParams.q);
    if (newParams.sizes) {
      params.delete("size");
      newParams.sizes.forEach((s) => params.append("size", s));
    }
    if (newParams.colors) {
      params.delete("color");
      newParams.colors.forEach((c) => params.append("color", c));
    }
    if (newParams.minPrice !== undefined) set("min", newParams.minPrice);
    if (newParams.maxPrice !== undefined) set("max", newParams.maxPrice);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function toggleSize(size: string) {
    const next = sizes.includes(size)
      ? sizes.filter((s) => s !== size)
      : [...sizes, size];
    setSizes(next);
    push({ sizes: next, colors, minPrice: minRef.current, maxPrice: maxRef.current, sort });
  }

  function toggleColor(color: string) {
    const next = colors.includes(color)
      ? colors.filter((c) => c !== color)
      : [...colors, color];
    setColors(next);
    push({ sizes, colors: next, minPrice: minRef.current, maxPrice: maxRef.current, sort });
  }

  function applyPrice() {
    minRef.current = minPrice.trim();
    maxRef.current = maxPrice.trim();
    push({ sizes, colors, minPrice: minRef.current, maxPrice: maxRef.current, sort });
  }

  function applySort(next: string) {
    setSort(next);
    push({ sizes, colors, minPrice: minRef.current, maxPrice: maxRef.current, sort: next });
  }

  const facets = (
    <div className="space-y-7">
      <ChipGroup
        title="Size"
        options={facetSizes}
        selected={sizes}
        onToggle={toggleSize}
      />
      <ChipGroup
        title="Colour"
        options={facetColors}
        selected={colors}
        onToggle={toggleColor}
      />
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Price (₹)
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className="h-10"
          />
          <span className="text-muted">–</span>
          <Input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            aria-label="Maximum price"
            className="h-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={applyPrice}
        >
          Apply
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {(sizes.length > 0 || colors.length > 0) && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-background">
            {sizes.length + colors.length}
          </span>
        )}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-28 space-y-7 lg:w-60">{facets}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-accent">
                Filters
              </h2>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close filters"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-accent-soft"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-6">
              {facets}
            </div>
            <div className="border-t border-line p-4">
              <Button fullWidth onClick={() => setMobileOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <SortSelect sort={sort} onSort={applySort} className="lg:hidden" />
    </>
  );
}

function SortSelect({
  sort,
  onSort,
  className,
}: {
  sort: string;
  onSort: (v: string) => void;
  className?: string;
}) {
  return (
    <Select
      value={sort}
      onChange={(e) => onSort(e.target.value)}
      options={SORT_OPTIONS}
      aria-label="Sort products"
      className={cn("w-44", className)}
    />
  );
}

function ChipGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-accent bg-accent text-background"
                  : "border-line text-foreground/80 hover:border-accent"
              )}
            >
              {active && <Check className="h-3 w-3" />}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
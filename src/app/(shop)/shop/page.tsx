import type { Metadata } from "next";
import { getProducts } from "@/lib/db/products";
import {
  FilterSidebar,
  type FilterInitialState,
} from "@/components/store/filter-sidebar";
import { ProductCard } from "@/components/store/product-card";
import { Pagination } from "@/components/store/pagination";
import { ShopSortSelect } from "@/components/store/shop-sort-select";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX } from "lucide-react";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the full collection of shirts, tees, denim and more.",
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  return [];
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = str(sp.q).trim();
  const sort = str(sp.sort) || "newest";
  const sizes = strArray(sp.size);
  const colors = strArray(sp.color);
  const minPrice = str(sp.min);
  const maxPrice = str(sp.max);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const result = await getProducts({
    q,
    sizes,
    colors,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort,
    page,
  });

  const initial: FilterInitialState = { q, sizes, colors, minPrice, maxPrice, sort };

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    sizes.forEach((s) => params.append("size", s));
    colors.forEach((c) => params.append("color", c));
    if (minPrice) params.set("min", minPrice);
    if (maxPrice) params.set("max", maxPrice);
    if (sort) params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/shop?${query}` : "/shop";
  };

  return (
    <div className="container-store py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-accent sm:text-4xl">
          Shop
        </h1>
        <p className="mt-2 text-sm text-muted">
          {result.total > 0
            ? `${result.total} product${result.total === 1 ? "" : "s"}`
            : "No products match your filters."}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <FilterSidebar
          initial={initial}
          facetSizes={result.sizes}
          facetColors={result.colors}
        />

        <div className="flex-1">
          <div className="mb-6 hidden justify-end lg:flex">
            <ShopSortSelect
              value={sort}
              q={q}
              sizes={sizes}
              colors={colors}
              minPrice={minPrice}
              maxPrice={maxPrice}
            />
          </div>

          {result.products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search for something else."
              action={{ label: "Clear filters", href: "/shop" }}
              icon={<SearchX className="h-5 w-5" />}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
              {result.products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  variants={p.product_variants}
                />
              ))}
            </div>
          )}

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            makeHref={makeHref}
          />
        </div>
      </div>
    </div>
  );
}
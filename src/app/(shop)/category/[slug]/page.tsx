import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getProducts } from "@/lib/db/products";
import {
  FilterSidebar,
  type FilterInitialState,
} from "@/components/store/filter-sidebar";
import { ProductCard } from "@/components/store/product-card";
import { Pagination } from "@/components/store/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return {
    title: category?.name ?? "Category",
    description: category?.description ?? undefined,
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  return [];
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const sort = str(sp.sort) || "newest";
  const sizes = strArray(sp.size);
  const colors = strArray(sp.color);
  const minPrice = str(sp.min);
  const maxPrice = str(sp.max);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const result = await getProducts({
    categoryId: category.id,
    sizes,
    colors,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort,
    page,
  });

  const initial: FilterInitialState = { sizes, colors, minPrice, maxPrice, sort };

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    sizes.forEach((s) => params.append("size", s));
    colors.forEach((c) => params.append("color", c));
    if (minPrice) params.set("min", minPrice);
    if (maxPrice) params.set("max", maxPrice);
    if (sort) params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/category/${category.slug}?${query}` : `/category/${category.slug}`;
  };

  return (
    <div className="container-store py-10">
      <div className="mb-8">
        {category.image && (
          <div className="relative mb-6 h-40 w-full overflow-hidden rounded-2xl sm:h-52">
            <Image
              src={category.image}
              alt={category.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
              <div>
                <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="mt-1 max-w-xl text-sm text-white/80">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!category.image && (
          <h1 className="font-display text-3xl font-semibold text-accent sm:text-4xl">
            {category.name}
          </h1>
        )}
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
          {result.products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters."
              action={{ label: "Clear filters", href: `/category/${category.slug}` }}
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
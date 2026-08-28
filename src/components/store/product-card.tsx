import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Price } from "@/components/ui/price";
import type { Product, ProductVariant } from "@/lib/types";

export function pickDefaultVariant(
  variants: ProductVariant[] | null | undefined
): ProductVariant | null {
  if (!variants) return null;
  return (
    variants.find((v) => v.active && v.stock_quantity > 0) ??
    variants.find((v) => v.active) ??
    null
  );
}

export function ProductCard({
  product,
  variants,
}: {
  product: Product;
  variants?: ProductVariant[];
}) {
  const defaultVariant = pickDefaultVariant(variants);
  const inStock = !!defaultVariant && defaultVariant.stock_quantity > 0;

  return (
    <div className="group relative">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-accent-soft"
      >
        {product.main_image ? (
          <Image
            src={product.main_image}
            alt={product.name}
            fill
            priority={false}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-muted">
            {product.name}
          </span>
        )}
        {product.compare_at_price && product.compare_at_price > product.price && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
            Sale
          </span>
        )}

        {/* Quick add */}
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {inStock ? (
            <AddToCartButton variantId={defaultVariant!.id} fullWidth />
          ) : (
            <span className="block w-full rounded-full bg-background/95 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-muted">
              Out of stock
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3">
        <Link
          href={`/product/${product.slug}`}
          className="block truncate text-sm font-medium text-accent hover:underline"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <Price price={product.price} compareAt={product.compare_at_price} size="sm" />
          {variants && variants.length > 0 && (
            <span className="hidden text-xs text-muted sm:block">
              {defaultVariant ? `Size ${defaultVariant.size ?? "—"}` : ""}
            </span>
          )}
        </div>
        {!inStock && (
          <span className="mt-1 inline-block text-[11px] font-medium uppercase tracking-wider text-red-700">
            Sold out
          </span>
        )}
      </div>
    </div>
  );
}

export function ProductCardPlaceholder() {
  return (
    <div role="status" aria-label="Loading products" className="space-y-3">
      <div className="aspect-[4/5] animate-pulse rounded-2xl bg-accent-soft" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-accent-soft" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-accent-soft" />
    </div>
  );
}
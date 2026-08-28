import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts, getVariantsForProducts } from "@/lib/db/products";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductConfigurator } from "@/components/store/product-configurator";
import { ProductCard } from "@/components/store/product-card";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product?.name ?? "Product",
    description: product?.description ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const relatedVariantMap = await getVariantsForProducts(related.map((p) => p.id));

  const galleryImages = [
    ...(product.main_image ? [product.main_image] : []),
    ...product.product_images.map((img) => img.image_url),
  ];

  const totalStock = product.product_variants.reduce(
    (sum, v) => sum + (v.active ? v.stock_quantity : 0),
    0
  );
  const lowStock = totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD;

  return (
    <div className="container-store py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(product.category ? [{ label: product.category.name, href: `/category/${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={galleryImages} name={product.name} />

        <div>
          {product.category && (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {product.category.name}
            </span>
          )}
          <h1 className="font-display mt-2 text-3xl font-semibold leading-tight text-accent sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4">
            <Price price={product.price} compareAt={product.compare_at_price} size="lg" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {totalStock === 0 ? (
              <Badge tone="danger">Sold out</Badge>
            ) : lowStock ? (
              <Badge tone="warning">Low stock</Badge>
            ) : (
              <Badge tone="success">In stock</Badge>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-sm leading-relaxed text-foreground/80">
              {product.description}
            </p>
          )}

          <div className="mt-8 border-t border-line pt-8">
            <ProductConfigurator variants={product.product_variants} />
          </div>

          <div className="mt-8 space-y-2 rounded-2xl border border-line p-5 text-sm">
            <Row label="Shipping" value="Free above ₹1,999, else ₹99 flat" />
            <Row label="Returns" value="14-day easy returns & exchanges" />
            <Row label="Material" value="Premium fabric, listed per item" />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold text-accent">
            You may also like
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                variants={relatedVariantMap[p.id]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="text-right text-sm text-foreground/80">{value}</span>
    </div>
  );
}
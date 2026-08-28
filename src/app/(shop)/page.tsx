import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getCategories,
  getFeaturedProducts,
  getNewArrivals,
  getVariantsForProducts,
} from "@/lib/db/products";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Truck, RotateCcw, ShieldCheck, BadgeIndianRupee } from "lucide-react";

export const metadata: Metadata = {
  title: "Premium Clothing Store",
};

export default async function HomePage() {
  const [featured, arrivals, categories] = await Promise.all([
    getFeaturedProducts(),
    getNewArrivals(),
    getCategories(),
  ]);

  const [featuredVariantMap, arrivalVariantMap] = await Promise.all([
    getVariantsForProducts(featured.map((p) => p.id)),
    getVariantsForProducts(arrivals.map((p) => p.id)),
  ]);

  const heroCategory = categories[0];
  const result = (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-accent text-background">
        <div className="container-store grid min-h-[70dvh] items-center gap-8 py-16 lg:min-h-[82dvh] lg:grid-cols-2">
          <div className="animate-fade-in relative z-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-background/70">
              The New Season
            </p>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Wardrobe staples, built to last.
            </h1>
            <p className="mt-5 max-w-md text-base text-background/80">
              Thoughtfully designed essentials in honest fabrics — tees, shirts,
              denim and outerwear. Free shipping on orders above ₹1,999.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="light" size="lg" href="/shop">
                Shop the collection
              </Button>
              {heroCategory && (
                <Button
                  variant="ghost"
                  size="lg"
                  href={`/category/${heroCategory.slug}`}
                  className="border border-background/30 text-background hover:bg-background/10"
                >
                  {heroCategory.name}
                </Button>
              )}
            </div>
          </div>

          <div className="relative hidden h-full min-h-[60dvh] lg:block">
            <HeroImage />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-store py-16">
        <SectionHeading
          title="Shop by category"
          link={{ href: "/shop", label: "View all" }}
        />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group overflow-hidden rounded-2xl bg-accent-soft"
            >
              <div className="relative aspect-[4/5]">
                {c.image ? (
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                  <p className="font-display text-sm font-semibold text-white sm:text-base">
                    {c.name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-store py-16">
          <SectionHeading
            title="Featured pieces"
            link={{ href: "/shop?sort=newest", label: "Browse all" }}
          />
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                variants={featuredVariantMap[p.id]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Promo */}
      <section className="container-store py-16">
        <div className="relative overflow-hidden rounded-3xl bg-accent-soft px-6 py-14 text-center sm:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            Summer Edit
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold text-accent sm:text-4xl">
            Refresh your everyday uniform
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            Up to 40% off selected tees, shirts and denim while stock lasts.
          </p>
          <Button
            variant="primary"
            size="lg"
            href="/shop?sort=price-asc"
            className="mt-7"
          >
            Shop the sale
          </Button>
        </div>
      </section>

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="container-store py-16">
          <SectionHeading
            title="New arrivals"
            link={{ href: "/shop?sort=newest", label: "See all" }}
          />
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {arrivals.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                variants={arrivalVariantMap[p.id]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="container-store py-16">
        <div className="grid gap-6 rounded-3xl border border-line p-8 sm:grid-cols-2 lg:grid-cols-4">
          <Benefit
            icon={<Truck className="h-5 w-5" />}
            title="Free shipping"
            text="On all orders above ₹1,999."
          />
          <Benefit
            icon={<RotateCcw className="h-5 w-5" />}
            title="Easy returns"
            text="14-day hassle-free exchanges."
          />
          <Benefit
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Secure payments"
            text="Protected card & UPI checkout."
          />
          <Benefit
            icon={<BadgeIndianRupee className="h-5 w-5" />}
            title="COD available"
            text="When enabled on your checkout."
          />
        </div>
      </section>
    </>
  );
  return result;
}

async function HeroImage() {
  return (
    <div className="absolute inset-0 flex items-end justify-end">
      <Link href="/shop" className="group block h-[80%] w-full max-w-md">
        <div className="relative h-full w-full overflow-hidden rounded-3xl">
          <Image
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80"
            alt="Premium fashion editorial"
            fill
            priority
            sizes="480px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      </Link>
    </div>
  );
}

function SectionHeading({
  title,
  link,
}: {
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-display text-2xl font-semibold text-accent sm:text-3xl">
        {title}
      </h2>
      {link && (
        <Link
          href={link.href}
          className="text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}

function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-accent">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{text}</p>
      </div>
    </div>
  );
}
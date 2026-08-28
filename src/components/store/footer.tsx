import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-accent-soft/40">
      <div className="container-store grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-display text-lg font-semibold text-accent">
            The Fashion Hub
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Premium clothing for modern everyday life. Thoughtful fits, honest
            fabrics, delivered across India.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Shop
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/shop" className="text-foreground/80 hover:text-accent">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/shop?sort=newest" className="text-foreground/80 hover:text-accent">
                New Arrivals
              </Link>
            </li>
            <li>
              <Link href="/shop?sort=price-asc" className="text-foreground/80 hover:text-accent">
                Under Our Picks
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Account
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/account" className="text-foreground/80 hover:text-accent">
                My Account
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className="text-foreground/80 hover:text-accent">
                My Orders
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-foreground/80 hover:text-accent">
                Cart
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Help
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/checkout" className="text-foreground/80 hover:text-accent">
                Checkout
              </Link>
            </li>
            <li>
              <Link href="/shop" className="text-foreground/80 hover:text-accent">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-store flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} The Fashion Hub. All rights reserved.</p>
          <p>Made with care in India.</p>
        </div>
      </div>
    </footer>
  );
}
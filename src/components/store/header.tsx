"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/providers/cart-provider";
import { useUser } from "@/providers/user-provider";
import { SearchBox } from "@/components/store/search-box";
import { logout } from "@/actions/auth";
import { ShoppingBag, User, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const NAV_LINKS = [
  { label: "New In", href: "/shop?sort=newest" },
  { label: "Shop", href: "/shop" },
];

export function Header({ categories }: { categories: Category[] }) {
  const { user, profile } = useUser();
  const { count, open } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container-store">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
          {/* Mobile menu toggle */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-accent lg:text-xl"
          >
            The Fashion Hub
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-accent"
              >
                {l.label}
              </Link>
            ))}
            <div className="group relative">
              <button className="flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-accent">
                Categories
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <div className="invisible absolute left-1/2 top-full z-40 w-56 -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <div className="overflow-hidden rounded-2xl border border-line bg-background p-2 shadow-xl">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-accent-soft hover:text-accent"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <SearchBox className="hidden w-56 md:block lg:w-64" />

            {/* Account */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="Account"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent-soft"
                >
                  <User className="h-5 w-5" />
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserMenuOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-2xl border border-line bg-background p-1.5 shadow-xl">
                      <div className="border-b border-line px-3 py-2">
                        <p className="truncate text-sm font-medium text-accent">
                          {profile?.full_name ?? user.email}
                        </p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                      </div>
                      <MenuItem href="/account">My Account</MenuItem>
                      <MenuItem href="/account/orders">Orders</MenuItem>
                      <MenuItem href="/account/addresses">Addresses</MenuItem>
                      {isAdmin && <MenuItem href="/admin">Admin Dashboard</MenuItem>}
                      <form
                        action={logout}
                        className="mt-1 border-t border-line pt-1"
                      >
                        <button className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">
                          Sign out
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                aria-label="Sign in"
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent-soft"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={open}
              aria-label={`Open cart, ${count} items`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent-soft"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-background">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-line transition-[max-height] duration-300 lg:hidden",
          mobileOpen ? "max-h-[26rem]" : "max-h-0 border-t-0"
        )}
      >
        <nav className="container-store flex flex-col py-4">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-sm font-medium text-foreground/80 hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
          <p className="pt-3 text-xs font-medium uppercase tracking-wider text-muted">
            Categories
          </p>
          <div className="grid grid-cols-2 gap-x-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-sm text-foreground/80 hover:text-accent"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

function MenuItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-accent-soft hover:text-accent"
    >
      {children}
    </Link>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Shirt,
  Boxes,
  Tags,
  Users,
  Settings,
  Store,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/products", label: "Products", icon: Shirt },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ horizontal }: { horizontal?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "flex",
        horizontal
          ? "items-center gap-1 overflow-x-auto"
          : "sticky top-6 flex-col gap-1"
      )}
    >
      <Link
        href="/"
        className="font-display mb-4 hidden px-3 text-lg font-semibold tracking-tight text-accent lg:block"
      >
        The Fashion Hub
      </Link>
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-background"
                : "text-foreground/70 hover:bg-accent-soft hover:text-accent"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <div
        className={cn(
          "mt-2 border-t border-line pt-2",
          horizontal && "ml-2 mt-0 border-t-0 pt-0"
        )}
      >
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-accent-soft hover:text-accent"
        >
          <Store className="h-4 w-4" />
          View store
        </Link>
        <Link
          href="/account"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-accent-soft hover:text-accent"
        >
          <LogOut className="h-4 w-4" />
          My account
        </Link>
      </div>
    </nav>
  );
}
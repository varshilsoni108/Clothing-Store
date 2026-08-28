"use client";

import { ToastProvider } from "@/components/ui/toast";
import { UserProvider, type SessionUser } from "@/providers/user-provider";
import { CartProvider } from "@/providers/cart-provider";
import { CartDrawer } from "@/components/store/cart-drawer";
import type { Profile } from "@/lib/types";

export function StoreProviders({
  user,
  profile,
  children,
}: {
  user: SessionUser | null;
  profile: Profile | null;
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <UserProvider user={user} profile={profile}>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </UserProvider>
    </ToastProvider>
  );
}
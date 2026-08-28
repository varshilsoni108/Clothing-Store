"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as cartActions from "@/actions/cart";
import { useUser } from "@/providers/user-provider";
import { useToast } from "@/components/ui/toast";
import { MAX_CART_LINE_QUANTITY } from "@/lib/constants";
import type { CartLine, CartLineInput } from "@/lib/types";

const GUEST_KEY = "tfh_guest_cart_v1";

function readGuest(): CartLineInput[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as CartLineInput[]).filter(
      (i) => i && typeof i.variantId === "string" && i.quantity > 0
    );
  } catch {
    return [];
  }
}

function writeGuest(items: CartLineInput[]) {
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable */
  }
}

function clearGuest() {
  try {
    window.localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
}

interface CartContextValue {
  lines: CartLine[];
  loading: boolean;
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { toast } = useToast();

  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const prevUserId = useRef<string | null>(null);
  const mounted = useRef(false);

  const load = useCallback(async () => {
    const uid = user?.id ?? null;
    const wasGuest = mounted.current && prevUserId.current === null && uid !== null;
    const firstRun = !mounted.current;
    if (!mounted.current) mounted.current = true;
    const currentUid = uid;
    prevUserId.current = uid;

    if (!firstRun) setLoading(true);
    try {
      if (currentUid) {
        if (wasGuest) {
          const guest = readGuest();
          const res = await cartActions.mergeServerCart(guest);
          if (res.error) throw new Error(res.error);
          clearGuest();
          setLines(res.lines);
          if (guest.length > 0) {
            toast("Your guest cart was moved to your account.", "success");
          }
        } else {
          setLines(await cartActions.getServerCartLines());
        }
      } else {
        setLines(await cartActions.hydrateCartLines(readGuest()));
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not load your cart.", "error");
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    // Data fetching on mount / login-change; state updates happen after async calls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      const qty = Math.max(1, Math.round(quantity));
      if (user) {
        const res = await cartActions.addToServerCart(variantId, qty);
        if (res.error) {
          toast(res.error, "error");
          return false;
        }
        setLines(res.lines);
        if (res.warning) toast(res.warning, "error");
        return true;
      }
      const items = readGuest();
      const idx = items.findIndex((i) => i.variantId === variantId);
      if (idx >= 0) {
        items[idx].quantity = Math.min(
          items[idx].quantity + qty,
          MAX_CART_LINE_QUANTITY
        );
      } else {
        items.push({ variantId, quantity: Math.min(qty, MAX_CART_LINE_QUANTITY) });
      }
      writeGuest(items);
      setLines(await cartActions.hydrateCartLines(items));
      return true;
    },
    [user, toast]
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      const qty = Math.max(0, Math.round(quantity));
      if (user) {
        if (qty === 0) {
          const res = await cartActions.removeServerCartLine(variantId);
          if (!res.error) setLines(res.lines);
          return;
        }
        const res = await cartActions.updateServerCartLine(variantId, qty);
        if (res.error) {
          toast(res.error, "error");
          return;
        }
        setLines(res.lines);
        if (res.warning) toast(res.warning, "error");
        return;
      }
      const items = readGuest();
      const kept: CartLineInput[] = [];
      for (const item of items) {
        if (item.variantId === variantId) {
          if (qty > 0) kept.push({ variantId, quantity: qty });
        } else {
          kept.push(item);
        }
      }
      writeGuest(kept);
      setLines(await cartActions.hydrateCartLines(kept));
    },
    [user, toast]
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      if (user) {
        const res = await cartActions.removeServerCartLine(variantId);
        if (!res.error) setLines(res.lines);
        else toast(res.error, "error");
        return;
      }
      const kept = readGuest().filter((i) => i.variantId !== variantId);
      writeGuest(kept);
      setLines(await cartActions.hydrateCartLines(kept));
    },
    [user, toast]
  );

  const clear = useCallback(async () => {
    if (user) {
      const res = await cartActions.clearServerCart();
      if (!res.error) setLines([]);
      else toast(res.error, "error");
      return;
    }
    clearGuest();
    setLines([]);
  }, [user, toast]);

  const { count, subtotal } = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    for (const line of lines) {
      if (!line.active) continue;
      count += line.quantity;
      subtotal += line.price * line.quantity;
    }
    return { count, subtotal };
  }, [lines]);

  const value: CartContextValue = {
    lines,
    loading,
    count,
    subtotal,
    isOpen,
    open,
    close,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    refresh: load,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
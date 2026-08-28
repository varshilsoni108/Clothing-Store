"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/db/helpers";
import {
  addToDbCart,
  clearDbCart,
  getDbCartLines,
  hydrateLine,
  removeFromDbCart,
  setDbLineQuantity,
} from "@/lib/db/cart";
import { MAX_CART_LINE_QUANTITY } from "@/lib/constants";
import type { CartLine, CartLineInput } from "@/lib/types";

export interface CartActionResponse {
  lines: CartLine[];
  warning?: string;
  error?: string;
}

function errorResponse(message: string): CartActionResponse {
  return { lines: [], error: message };
}

/**
 * Hydrates raw client-side (guest) cart items with fresh database data —
 * current prices, stock, availability and product details.
 */
export async function hydrateCartLines(
  items: CartLineInput[]
): Promise<CartLine[]> {
  const cleaned = items
    .filter((i) => i.variantId && i.quantity > 0)
    .slice(0, 20);

  const lines: CartLine[] = [];
  for (const item of cleaned) {
    lines.push(await hydrateLine(item));
  }
  return lines;
}

export async function getServerCartLines(): Promise<CartLine[]> {
  const user = await getSessionUser();
  if (!user) return [];
  return getDbCartLines(user.id);
}

export async function addToServerCart(
  variantId: string,
  quantity: number
): Promise<CartActionResponse> {
  const user = await getSessionUser();
  if (!user) return errorResponse("Please log in to add items to your cart.");

  const safeQty = Math.min(Math.max(1, Math.round(quantity)), MAX_CART_LINE_QUANTITY);
  try {
    const res = await addToDbCart(user.id, variantId, safeQty);
    return { lines: res.lines, warning: res.warning };
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Could not add to cart.");
  }
}

export async function updateServerCartLine(
  variantId: string,
  quantity: number
): Promise<CartActionResponse> {
  const user = await getSessionUser();
  if (!user) return errorResponse("Please log in first.");

  try {
    const res = await setDbLineQuantity(user.id, variantId, quantity);
    return { lines: res.lines, warning: res.warning };
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Could not update the cart.");
  }
}

export async function removeServerCartLine(
  variantId: string
): Promise<CartActionResponse> {
  const user = await getSessionUser();
  if (!user) return errorResponse("Please log in first.");

  const lines = await removeFromDbCart(user.id, variantId);
  return { lines };
}

export async function clearServerCart(): Promise<CartActionResponse> {
  const user = await getSessionUser();
  if (!user) return errorResponse("Please log in first.");

  await clearDbCart(user.id);
  revalidatePath("/cart");
  return { lines: [] };
}

/**
 * Merges a guest cart into the signed-in user's database cart.
 * Called client-side after login/signup.
 */
export async function mergeServerCart(
  guestItems: CartLineInput[]
): Promise<CartActionResponse> {
  const user = await getSessionUser();
  if (!user) return errorResponse("Please log in first.");

  let warning: string | undefined;
  try {
    for (const item of guestItems) {
      if (!item.variantId || item.quantity <= 0) continue;
      const res = await addToDbCart(user.id, item.variantId, item.quantity);
      if (res.warning) warning = res.warning;
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Could not merge your cart.");
  }

  const lines = await getDbCartLines(user.id);
  return { lines, warning };
}
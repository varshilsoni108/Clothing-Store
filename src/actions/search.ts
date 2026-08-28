"use server";

import { searchProducts } from "@/lib/db/products";

export async function searchProductsAction(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return [];
  return searchProducts(trimmed, 6);
}
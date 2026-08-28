import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CartLine, CartLineInput } from "@/lib/types";
import { toNumber } from "./helpers";

/**
 * Ensures a cart row exists for the user and returns its id.
 */
export async function getOrCreateCart(userId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error || !data) throw new Error("Could not create cart");
  return data.id as string;
}

/**
 * Reads a variant + product and returns a hydrated cart line.
 */
export async function hydrateLine(input: CartLineInput): Promise<CartLine> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      "id,size,color,stock_quantity,price,active,products(id,name,slug,main_image,compare_at_price,price,active)"
    )
    .eq("id", input.variantId)
    .single();

  if (error || !data || !data.products) {
    return {
      variantId: input.variantId,
      productId: "",
      name: "Unavailable item",
      slug: "",
      size: null,
      color: null,
      price: 0,
      compareAtPrice: null,
      image: "",
      quantity: 0,
      stock: 0,
      active: false,
    };
  }

  const products = Array.isArray(data.products)
    ? data.products[0]
    : data.products;

  const effectivePrice =
    data.price == null ? products.price : toNumber(data.price);

  return {
    variantId: data.id,
    productId: products.id,
    name: products.name,
    slug: products.slug,
    size: data.size ?? null,
    color: data.color ?? null,
    price: effectivePrice,
    compareAtPrice: products.compare_at_price == null ? null : toNumber(products.compare_at_price),
    image:
      products.main_image ||
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=900&q=80&auto=format&fit=crop",
    quantity: input.quantity,
    stock: toNumber(data.stock_quantity),
    active: !!data.active && !!products.active && toNumber(data.stock_quantity) > 0,
  };
}

/**
 * Reads all cart lines for a user from the persisted DB cart.
 */
export async function getDbCartLines(userId: string): Promise<CartLine[]> {
  const supabase = await createClient();
  const { data: cart, error } = await supabase
    .from("carts")
    .select(
      "id,cart_items(id,quantity,variant_id,product_id,product_variants(id,size,color,stock_quantity,price,active,products(id,name,slug,main_image,compare_at_price,active)))"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !cart) return [];

  const items = (cart.cart_items as Record<string, unknown>[]) ?? [];

  const lines: CartLine[] = [];
  for (const item of items) {
    const variant = item.product_variants as Record<string, unknown> | undefined;
    if (!variant) continue;
    const products = Array.isArray(variant.products)
      ? variant.products[0]
      : variant.products;
    if (!products) continue;

    const effectivePrice =
      variant.price == null ? products.price : toNumber(variant.price);

    lines.push({
      variantId: variant.id as string,
      productId: products.id as string,
      name: products.name as string,
      slug: products.slug as string,
      size: (variant.size as string | null) ?? null,
      color: (variant.color as string | null) ?? null,
      price: effectivePrice,
      compareAtPrice:
        products.compare_at_price == null
          ? null
          : toNumber(products.compare_at_price),
      image:
        (products.main_image as string) ||
        "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=900&q=80&auto=format&fit=crop",
      quantity: toNumber(item.quantity),
      stock: toNumber(variant.stock_quantity),
      active: !!variant.active && !!products.active && toNumber(variant.stock_quantity) > 0,
    });
  }

  return lines;
}

/**
 * Upserts a line into the user's DB cart. Enforces available stock.
 * Returns the updated hydrated cart lines.
 */
export async function addToDbCart(
  userId: string,
  variantId: string,
  quantity: number
): Promise<{ lines: CartLine[]; warning?: string }> {
  const supabase = await createClient();
  const cartId = await getOrCreateCart(userId);

  const { data: variant } = await supabase
    .from("product_variants")
    .select("id,product_id,stock_quantity,size,color,active,products(id,active)")
    .eq("id", variantId)
    .single();

  if (!variant) throw new Error("That product variant no longer exists.");
  const products = Array.isArray(variant.products) ? variant.products[0] : variant.products;
  if (!variant.active || !products?.active) {
    throw new Error("That product is not available right now.");
  }

  const stock = toNumber(variant.stock_quantity);

  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id,quantity")
    .eq("cart_id", cartId)
    .eq("variant_id", variantId)
    .maybeSingle();

  const currentQty = existingItem ? toNumber(existingItem.quantity) : 0;
  const targetQty = currentQty + quantity;

  if (stock === 0) {
    throw new Error("This item is out of stock.");
  }
  if (targetQty > stock) {
    throw new Error(`Only ${stock} ${stock === 1 ? "unit" : "units"} of this item are available.`);
  }

  if (existingItem) {
    await supabase
      .from("cart_items")
      .update({ quantity: targetQty })
      .eq("id", existingItem.id as string);
  } else {
    await supabase
      .from("cart_items")
      .insert({
        cart_id: cartId,
        product_id: variant.product_id as string,
        variant_id: variantId,
        quantity,
      });
  }

  await supabase.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", cartId);

  return { lines: await getDbCartLines(userId) };
}

export async function removeFromDbCart(
  userId: string,
  variantId: string
): Promise<CartLine[]> {
  const supabase = await createClient();
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (cart) {
    await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id as string)
      .eq("variant_id", variantId);
  }
  return getDbCartLines(userId);
}

export async function setDbLineQuantity(
  userId: string,
  variantId: string,
  quantity: number
): Promise<{ lines: CartLine[]; warning?: string }> {
  const supabase = await createClient();
  const cartId = await getOrCreateCart(userId);

  const { data: variant } = await supabase
    .from("product_variants")
    .select("id,product_id,stock_quantity")
    .eq("id", variantId)
    .single();

  if (!variant) throw new Error("That product variant no longer exists.");
  const stock = toNumber(variant.stock_quantity);

  if (quantity <= 0) {
    return { lines: await removeFromDbCart(userId, variantId) };
  }

  if (quantity > stock) {
    const clamped = await setDbLineQuantity(userId, variantId, stock);
    return {
      lines: clamped.lines,
      warning: `Only ${stock} ${stock === 1 ? "unit" : "units"} of this item are available.`,
    };
  }

  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id")
    .eq("cart_id", cartId)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existingItem) {
    await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", existingItem.id as string);
  } else {
    await supabase
      .from("cart_items")
      .insert({
        cart_id: cartId,
        product_id: variant.product_id as string,
        variant_id: variantId,
        quantity,
      });
  }

  await supabase.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", cartId);

  return { lines: await getDbCartLines(userId) };
}

export async function clearDbCart(userId: string) {
  const supabase = await createClient();
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (cart) {
    await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id as string);
  }
}
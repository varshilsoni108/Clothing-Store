import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SHIPPING_FLAT_RATE, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { generateOrderNumber } from "@/lib/utils";
import type {
  CartLineInput,
  OrderWithItems,
  ShippingAddressInput,
} from "@/lib/types";
import { toNumber } from "@/lib/db/helpers";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
} from "@/lib/payments/razorpay";

export interface PlaceOrderResult {
  order: OrderWithItems;
  paymentConfigured: boolean;
  razorpayOrderId: string | null;
  amount: number;
}

export function shippingFor(subtotal: number) {
  const amount = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  return { amount, freeThreshold: FREE_SHIPPING_THRESHOLD };
}

interface DraftOrderItem {
  variantId: string;
  productId: string | null;
  name: string;
  unitPrice: number;
  size: string | null;
  color: string | null;
  quantity: number;
  subtotal: number;
  image: string | null;
}

/**
 * Creates an order from trusted database values.
 * - Validates stock for every line
 * - Computes prices server-side (never trusts the client)
 * - Reserves inventory immediately to prevent overselling
 * - Optionally creates a Razorpay order when the gateway is configured
 *
 * If anything fails partway through, inventory is restored and no order remains.
 */
export async function placeOrder(opts: {
  userId: string;
  items: CartLineInput[];
  address: ShippingAddressInput;
}): Promise<PlaceOrderResult> {
  const supabase = await createClient();
  // Order mutation writes run through the service-role client: the
  // authenticated role has no INSERT/UPDATE privileges (nor RLS write
  // policies) on orders, order_items, or product_variants. The session
  // client is still used for all reads so RLS ownership checks apply.
  const db = createAdminClient();

  // 1. Load fixtures from the DB — the only trusted price source.
  const variantIds = opts.items.map((i) => i.variantId);
  const { data: variants, error } = await supabase
    .from("product_variants")
    .select(
      "id,product_id,size,color,stock_quantity,price,active,products(id,name,slug,main_image,price,compare_at_price,active)"
    )
    .in("id", variantIds);

  if (error || !variants || variants.length !== variantIds.length) {
    throw new Error("Some items in your order are no longer available.");
  }

  const variantMap = new Map(variants.map((v) => [v.id as string, v]));

  // 2. Build order items & totals from DB values.
  const items: DraftOrderItem[] = [];
  let subtotal = 0;

  for (const line of opts.items) {
    const v = variantMap.get(line.variantId);
    if (!v) throw new Error("Some items in your order are no longer available.");

    const product = Array.isArray(v.products) ? v.products[0] : v.products;
    if (!v.active || !product?.active) {
      throw new Error(`${product?.name ?? "A product"} is not available right now.`);
    }

    const stock = toNumber(v.stock_quantity);
    if (stock === 0) {
      throw new Error(`${product.name} is out of stock.`);
    }
    if (line.quantity > stock) {
      throw new Error(
        `Only ${stock} ${stock === 1 ? "unit" : "units"} of ${product.name} are available.`
      );
    }

    const unitPrice = toNumber(v.price ?? product.price);
    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;

    items.push({
      variantId: v.id as string,
      productId: (v.product_id as string) ?? null,
      name: product.name,
      unitPrice,
      size: (v.size as string) ?? null,
      color: (v.color as string) ?? null,
      quantity: line.quantity,
      subtotal: lineTotal,
      image: (product.main_image as string) ?? null,
    });
  }

  const shipping = shippingFor(subtotal);
  const discountAmount = 0;
  const totalAmount = subtotal + shipping.amount - discountAmount;

  // 3. Insert the order + items (one insert with items afterwards).
  const orderNumber = generateOrderNumber();
  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      user_id: opts.userId,
      order_number: orderNumber,
      subtotal,
      shipping_amount: shipping.amount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_status: "pending",
      order_status: "pending",
      shipping_address_snapshot: opts.address,
    })
    .select("*")
    .single();

  if (orderError || !order) {
    throw new Error("We could not create your order. Please try again.");
  }

  const { error: itemsError } = await db.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      variant_id: item.variantId,
      product_id: item.productId,
      product_name_snapshot: item.name,
      price_snapshot: item.unitPrice,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      subtotal: item.subtotal,
      image_url_snapshot: item.image,
    }))
  );

  if (itemsError) {
    await db.from("orders").delete().eq("id", order.id as string);
    throw new Error("We could not create your order. Please try again.");
  }

  const { data: savedItems } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id as string);

  // 4. Reserve stock. If any line cannot be reserved, roll everything back.
  try {
    for (const item of items) {
      const v = variantMap.get(item.variantId)!;
      const updated = toNumber(v.stock_quantity) - item.quantity;
      const { error } = await db
        .from("product_variants")
        .update({ stock_quantity: updated })
        .eq("id", item.variantId)
        .gte("stock_quantity", item.quantity);
      if (error) throw new Error("Could not reserve stock.");
    }
  } catch (err) {
    await restoreStockForOrder(order.id as string);
    await db.from("orders").delete().eq("id", order.id as string);
    throw err instanceof Error ? err : new Error("Could not reserve stock.");
  }

  // 5. Create the Razorpay order when configured.
  let razorpayOrderId: string | null = null;
  if (isRazorpayConfigured()) {
    try {
      const rpOrder = await createRazorpayOrder({
        amountInPaise: Math.round(totalAmount * 100),
        receipt: orderNumber,
        notes: { orderNumber, orderId: order.id as string },
      });
      razorpayOrderId = rpOrder.id;
      await db
        .from("orders")
        .update({ razorpay_order_id: rpOrder.id })
        .eq("id", order.id as string);
    } catch {
      await restoreStockForOrder(order.id as string);
      await db.from("orders").delete().eq("id", order.id as string);
      throw new Error("Payment could not be initiated. Please try again.");
    }
  }

  return {
    order: { ...(order as unknown as OrderWithItems), order_items: savedItems ?? [] },
    paymentConfigured: isRazorpayConfigured(),
    razorpayOrderId,
    amount: totalAmount,
  };
}

/**
 * Restores reserved stock for the given order id (used on cancel/failed/return).
 * Accepts an optional client so it can be used from webhooks (no user session).
 */
export async function restoreStockForOrder(
  orderId: string,
  client?: SupabaseClient
) {
  const supabase = client ?? (await createClient());
  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id,quantity")
    .eq("order_id", orderId);

  if (!items || items.length === 0) return;

  for (const item of items) {
    if (!item.variant_id) continue;
    await supabase.rpc("increment_variant_stock", {
      target_variant_id: item.variant_id,
      by_value: item.quantity as number,
    });
  }
}
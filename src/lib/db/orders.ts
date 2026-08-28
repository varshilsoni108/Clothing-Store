import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderWithItems } from "@/lib/types";
import { toNumber } from "./helpers";

function mapOrder(row: Record<string, unknown>): Order {
  return {
    ...(row as unknown as Order),
    subtotal: toNumber(row.subtotal),
    shipping_amount: toNumber(row.shipping_amount),
    discount_amount: toNumber(row.discount_amount),
    total_amount: toNumber(row.total_amount),
  };
}

function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    ...(row as unknown as OrderItem),
    price_snapshot: toNumber(row.price_snapshot),
    subtotal: toNumber(row.subtotal),
  };
}

export async function getOrdersForUser(userId: string, limit = 20): Promise<Order[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapOrder);
}

export async function getOrderForUser(
  userId: string,
  orderId: string
): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*,order_items(*)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (!data) return null;
  return {
    ...mapOrder(data),
    order_items: ((data.order_items as Record<string, unknown>[]) ?? []).map(mapOrderItem),
  };
}

/**
 * Orders lookup by order_number OR id — used by the success page.
 */
export const getOrderByNumber = cache(
  async (orderNumber: string, userId?: string | null): Promise<OrderWithItems | null> => {
    const supabase = await createClient();
    let query = supabase
      .from("orders")
      .select("*,order_items(*)")
      .eq("order_number", orderNumber)
      .order("created_at", { ascending: false })
      .limit(1);

    // Admin can look up any order; customers only their own is enforced by RLS.
    query = userId ? query.eq("user_id", userId) : query;

    const { data } = await query;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      ...mapOrder(row),
      order_items: ((row.order_items as Record<string, unknown>[]) ?? []).map(mapOrderItem),
    };
  }
);
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/db/helpers";
import { addressSchema, fieldErrors } from "@/lib/validations";
import { restoreStockForOrder } from "@/lib/orders";
import type { ActionState, Order as OrderRow } from "@/lib/types";

export async function addAddress(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = addressSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    address_line_1: formData.get("address_line_1"),
    address_line_2: formData.get("address_line_2"),
    city: formData.get("city"),
    state: formData.get("state"),
    postal_code: formData.get("postal_code"),
    country: formData.get("country") || "India",
  });

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  const isFirst = !existing || existing.length === 0;

  const { error } = await supabase.from("addresses").insert({
    user_id: user.id,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    address_line_1: parsed.data.address_line_1,
    address_line_2: parsed.data.address_line_2 || null,
    city: parsed.data.city,
    state: parsed.data.state,
    postal_code: parsed.data.postal_code,
    country: parsed.data.country,
    is_default: isFirst,
  });

  if (error) {
    return { message: "Could not save the address. Please try again." };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true, message: "Address added." };
}

export async function updateAddress(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") || "");

  const parsed = addressSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    address_line_1: formData.get("address_line_1"),
    address_line_2: formData.get("address_line_2"),
    city: formData.get("city"),
    state: formData.get("state"),
    postal_code: formData.get("postal_code"),
    country: formData.get("country") || "India",
  });

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("addresses")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      address_line_1: parsed.data.address_line_1,
      address_line_2: parsed.data.address_line_2 || null,
      city: parsed.data.city,
      state: parsed.data.state,
      postal_code: parsed.data.postal_code,
      country: parsed.data.country,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { message: "Could not update the address." };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true, message: "Address updated." };
}

export async function deleteAddress(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const supabase = await createClient();

  const { data: address } = await supabase
    .from("addresses")
    .select("id,is_default")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (address) {
    await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
  }

  if (address?.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);
    if (next && next.length > 0) {
      await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", next[0].id as string);
    }
  }

  revalidatePath("/account/addresses");
  return { success: true, message: "Address deleted." };
}

export async function setDefaultAddress(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const supabase = await createClient();

  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id);
  await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

const CANCELABLE: OrderRow["order_status"][] = ["pending"];

export async function cancelOrder(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const orderId = String(formData.get("id") || "");
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !order) return { message: "Order not found." };

  if (!CANCELABLE.includes(order.order_status as OrderRow["order_status"])) {
    return {
      message: `This order can no longer be cancelled (status: ${order.order_status}). Please contact support.`,
    };
  }

  const isPaid = order.payment_status === "paid";

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      order_status: "cancelled",
      payment_status: isPaid ? "refunded" : order.payment_status,
    })
    .eq("id", orderId)
    .eq("user_id", user.id);

  if (updateError) return { message: "Could not cancel the order." };

  await restoreStockForOrder(orderId);

  // Return the item to the user's cart so they can repurchase.
  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id,quantity")
    .eq("order_id", orderId);
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (items && cart) {
    for (const item of items) {
      if (!item.variant_id) continue;
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id,quantity")
        .eq("cart_id", cart.id as string)
        .eq("variant_id", item.variant_id as string)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: Number(existing.quantity) + (item.quantity as number) })
          .eq("id", existing.id as string);
      } else {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("product_id")
          .eq("id", item.variant_id as string)
          .single();
        await supabase.from("cart_items").insert({
          cart_id: cart.id,
          variant_id: item.variant_id,
          product_id: variant?.product_id ?? null,
          quantity: item.quantity,
        });
      }
    }
  }

  revalidatePath("/account/orders");
  revalidatePath("/account");
  return { success: true, message: "Order cancelled. The items are back in your cart." };
}
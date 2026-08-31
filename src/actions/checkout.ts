"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/db/helpers";
import { addressSchema, checkoutItemsSchema } from "@/lib/validations";
import { placeOrder, restoreStockForOrder } from "@/lib/orders";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import type {
  CartLineInput,
  ShippingAddressInput,
} from "@/lib/types";

export interface CheckoutResponse {
  success: boolean;
  error?: string;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  paymentConfigured?: boolean;
  razorpayOrderId?: string | null;
}

export async function checkoutPlaceOrder(input: {
  items: unknown;
  addressId?: string;
  address?: unknown;
  saveAddress?: boolean;
}): Promise<CheckoutResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Please log in to place an order." };
  }

  const parsedItems = checkoutItemsSchema.safeParse(input.items);
  if (!parsedItems.success) {
    return {
      success: false,
      error: "Your cart is empty or contains items that are no longer available.",
    };
  }

  const items: CartLineInput[] = parsedItems.data;
  const supabase = await createClient();

  let address: ShippingAddressInput;

  if (input.addressId) {
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", input.addressId)
      .eq("user_id", user.id)
      .single();
    if (!data) return { success: false, error: "Shipping address not found." };
    address = {
      full_name: data.full_name,
      phone: data.phone,
      address_line_1: data.address_line_1,
      address_line_2: data.address_line_2,
      city: data.city,
      state: data.state,
      postal_code: data.postal_code,
      country: data.country,
    };
  } else {
    const parsedAddress = addressSchema.safeParse(input.address);
    if (!parsedAddress.success) {
      return {
        success: false,
        error: "Please provide a complete shipping address.",
      };
    }
    address = parsedAddress.data;

    if (input.saveAddress) {
      const { data: existing } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      await supabase.from("addresses").insert({
        user_id: user.id,
        full_name: address.full_name,
        phone: address.phone,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || null,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
        is_default: !existing || existing.length === 0,
      });
    }
  }

  try {
    const result = await placeOrder({
      userId: user.id,
      items,
      address,
    });
    revalidatePath("/cart");
    return {
      success: true,
      orderId: result.order.id,
      orderNumber: result.order.order_number,
      amount: result.amount,
      paymentConfigured: result.paymentConfigured,
      razorpayOrderId: result.razorpayOrderId,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not place your order.",
    };
  }
}

export async function verifyRazorpayPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ success: boolean; error?: string; orderNumber?: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not logged in." };

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", input.orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !order) return { success: false, error: "Order not found." };

  if (order.payment_status === "paid") {
    return { success: true, orderNumber: order.order_number };
  }

  if (order.razorpay_order_id) {
    let valid = false;
    try {
      valid = verifyPaymentSignature({
        orderId: order.razorpay_order_id,
        paymentId: input.paymentId,
        signature: input.signature,
      });
    } catch {
      valid = false;
    }
    if (!valid) {
      return { success: false, error: "Payment verification failed. Please contact support." };
    }
  } else {
    // Gateway wasn't configured at order creation — allow a manual capture.
    if (!order.razorpay_payment_id) {
      return { success: false, error: "This order cannot be verified automatically." };
    }
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      order_status: "confirmed",
      razorpay_payment_id: input.paymentId,
    })
    .eq("id", input.orderId)
    .eq("payment_status", "pending");

  if (updateError) {
    return { success: false, error: "Could not update the order." };
  }

  // Remove the purchased items from the user's cart.
  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id")
    .eq("order_id", input.orderId);
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (cart && items) {
    const variantIds = items.map((i) => i.variant_id).filter(Boolean);
    if (variantIds.length > 0) {
      await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cart.id as string)
        .in("variant_id", variantIds);
    }
  }

  revalidatePath("/cart");
  revalidatePath("/account/orders");
  return { success: true, orderNumber: order.order_number };
}
export async function simulatePayment(input: {
  orderId: string;
}): Promise<{ success: boolean; error?: string; orderNumber?: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not logged in." };

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, payment_status, order_status")
    .eq("id", input.orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    return { success: false, error: "Order not found." };
  }

  if (order.payment_status === "paid") {
    return {
      success: true,
      orderNumber: order.order_number,
    };
  }

  if (order.payment_status !== "pending") {
    return {
      success: false,
      error: "This order is no longer awaiting payment.",
    };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      order_status: "confirmed",
      razorpay_payment_id: `TEST_${order.id}`,
    })
    .eq("id", order.id)
    .eq("user_id", user.id)
    .eq("payment_status", "pending");

  if (updateError) {
    return {
      success: false,
      error: "Could not complete the test payment.",
    };
  }

  // Remove purchased items from the user's cart.
  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id")
    .eq("order_id", order.id);

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cart && items) {
    const variantIds = items.map((item) => item.variant_id).filter(Boolean);

    if (variantIds.length > 0) {
      await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cart.id as string)
        .in("variant_id", variantIds);
    }
  }

  revalidatePath("/cart");
  revalidatePath("/account/orders");

  return {
    success: true,
    orderNumber: order.order_number,
  };
}
export async function abandonCheckout(input: {
  orderId: string;
}): Promise<{ success: boolean; reason?: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,payment_status,order_status")
    .eq("id", input.orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) return { success: false, reason: "not-found" };

  if (order.payment_status === "pending" && order.order_status === "pending") {
    await restoreStockForOrder(order.id as string);
    await supabase.from("orders").delete().eq("id", order.id as string);
    revalidatePath("/cart");
    return { success: true };
  }

  return { success: false, reason: "already-processed" };
}
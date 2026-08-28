import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { restoreStockForOrder } from "@/lib/orders";

/**
 * Razorpay webhook endpoint.
 * Verifies the signature, then updates the matching order. Runs with the
 * service role client so it works without a browser session.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { order_id?: string; id?: string; status?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventName = event.event ?? "";
  const paymentEntity = event.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;

  if (!razorpayOrderId) {
    // Some events (e.g. order.paid) carry the order id on the entity instead.
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id,payment_status,order_status,razorpay_order_id")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (eventName === "payment.captured" || eventName === "order.paid") {
    if (
      order.payment_status === "pending" ||
      order.payment_status === "failed"
    ) {
      await admin
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: order.order_status === "pending" ? "confirmed" : order.order_status,
          razorpay_payment_id: paymentEntity?.id ?? null,
        })
        .eq("id", order.id as string);
    }
  } else if (eventName === "payment.failed") {
    if (order.payment_status !== "paid") {
      await admin
        .from("orders")
        .update({
          payment_status: "failed",
          order_status: "cancelled",
          razorpay_payment_id: paymentEntity?.id ?? null,
        })
        .eq("id", order.id as string);
      await restoreStockForOrder(order.id as string, admin);
    }
  }

  return NextResponse.json({ received: true });
}
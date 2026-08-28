import "server-only";

import crypto from "node:crypto";
import Razorpay from "razorpay";

export function isRazorpayConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
  );
}

export function getRazorpay() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function createRazorpayOrder(opts: {
  amountInPaise: number;
  receipt: string;
  notes: Record<string, string>;
}) {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: opts.amountInPaise,
    currency: "INR",
    receipt: opts.receipt,
    notes: opts.notes,
  });
  return order;
}

/**
 * Verifies the signature returned by the Razorpay Checkout after a payment
 * (order_id | payment_id signed with the key secret).
 */
export function verifyPaymentSignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not configured.");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${opts.orderId}|${opts.paymentId}`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(opts.signature)
  );
}

/**
 * Verifies the signature on an incoming Razorpay webhook
 * (HMAC-SHA256 of the raw request body signed with the webhook secret).
 */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
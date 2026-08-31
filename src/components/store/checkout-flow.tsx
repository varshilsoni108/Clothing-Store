"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "@/providers/cart-provider";
import {
  checkoutPlaceOrder,
  verifyRazorpayPayment,
  simulatePayment,
} from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatINR } from "@/lib/utils";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT_RATE,
  DEFAULT_COUNTRY,
} from "@/lib/constants";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import type { Address } from "@/lib/types";

type RazorpayCtor = new (options: object) => { open: () => void };

interface RazorpayWindow {
  Razorpay?: RazorpayCtor;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Puducherry",
  "Chandigarh",
  "Jammu & Kashmir",
  "Ladakh",
];

export function CheckoutFlow({
  user,
  addresses,
}: {
  user: { id: string; email: string };
  addresses: Address[];
}) {
  const { lines, subtotal, refresh } = useCart();

  const [step, setStep] = useState<
    "address" | "payment" | "processing" | "success"
  >("address");

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.is_default)?.id ?? ""
  );

  const [showNewAddress, setShowNewAddress] = useState(
    !addresses.find((a) => a.is_default)
  );

  const [form, setForm] = useState({
    full_name: userIsName(user.email),
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: DEFAULT_COUNTRY,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    orderNumber: string;
    amount: number;
    paymentConfigured: boolean;
    razorpayOrderId: string | null;
  } | null>(null);

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;

  const total = subtotal + shipping;

  const validItems = useMemo(
    () =>
      lines
        .filter((l) => l.active)
        .map((l) => ({
          variantId: l.variantId,
          quantity: l.quantity,
        })),
    [lines]
  );

  // IMPORTANT: defined before the payment UI uses it.
  const placing = step === "processing";

  function previewAddress() {
    if (selectedAddressId) {
      const a = addresses.find((x) => x.id === selectedAddressId)!;

      return `${a.full_name}, ${a.address_line_1}${
        a.address_line_2 ? `, ${a.address_line_2}` : ""
      }, ${a.city}, ${a.state} ${a.postal_code}`;
    }

    return `${form.full_name}, ${form.address_line_1}${
      form.address_line_2 ? `, ${form.address_line_2}` : ""
    }, ${form.city}, ${form.state} ${form.postal_code}`;
  }

  function validateNewAddress(): boolean {
    const errors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      errors.full_name = "Full name is required";
    }

    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) {
      errors.phone = "Enter a valid phone number";
    }

    if (!form.address_line_1.trim()) {
      errors.address_line_1 = "Address is required";
    }

    if (!form.city.trim()) {
      errors.city = "City is required";
    }

    if (!form.state) {
      errors.state = "State is required";
    }

    if (!/^\d{6}$/.test(form.postal_code.trim())) {
      errors.postal_code = "Enter a valid 6-digit PIN code";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function placeOrder() {
    if (validItems.length === 0) {
      setError("Your cart is empty. Add items before checking out.");
      return;
    }

    const payload: {
      items: unknown;
      addressId?: string;
      address?: unknown;
      saveAddress?: boolean;
    } = {
      items: validItems,
    };

    if (selectedAddressId && !showNewAddress) {
      payload.addressId = selectedAddressId;
    } else {
      if (!validateNewAddress()) {
        setError(null);
        return;
      }

      payload.address = form;
    }

    setError(null);
    setStep("processing");

    try {
      const res = await checkoutPlaceOrder(payload);

      if (!res.success) {
        setStep("address");
        setError(
          res.error ?? "Something went wrong placing your order."
        );
        return;
      }

      setOrderResult({
        orderId: res.orderId!,
        orderNumber: res.orderNumber!,
        amount: res.amount!,
        paymentConfigured: res.paymentConfigured!,
        razorpayOrderId: res.razorpayOrderId ?? null,
      });

      await refresh();

      // No real payment gateway configured.
      // Send the customer to our simulated payment screen.
      if (!res.paymentConfigured) {
        setStep("payment");
        return;
      }

      await startRazorpay(
        res.orderId!,
        res.razorpayOrderId!,
        res.amount!
      );
    } catch {
      setStep("address");
      setError("Could not place your order. Please try again.");
    }
  }

  async function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (
        typeof window !== "undefined" &&
        (window as unknown as RazorpayWindow).Razorpay
      ) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  async function startRazorpay(
    orderId: string,
    rpOrderId: string,
    amount: number
  ) {
    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    const loaded = await loadRazorpayScript();

    if (!loaded || !keyId) {
      setStep("success");
      return;
    }

    const options = {
      key: keyId,
      amount: Math.round(amount * 100),
      currency: "INR",
      name: "The Fashion Hub",
      description: `Order ${orderResult?.orderNumber ?? ""}`,
      order_id: rpOrderId,

      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const res = await verifyRazorpayPayment({
          orderId,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });

        if (res.success) {
          await refresh();
          setStep("success");
        } else {
          setStep("address");
          setError(
            res.error ??
              "Payment could not be verified. Please contact support."
          );
        }
      },

      modal: {
        ondismiss: async () => {
          const { abandonCheckout } =
            await import("@/actions/checkout");

          await abandonCheckout({ orderId });

          setStep("address");
          setError(
            "Payment was cancelled. Your items are still in your cart."
          );
        },

        escape: false,
      },

      theme: {
        color: "#1c1917",
      },
    };

    try {
      const Razorpay = (window as unknown as RazorpayWindow)
        .Razorpay;

      if (!Razorpay) {
        setStep("address");
        setError("Payment gateway could not be loaded.");
        return;
      }

      const rp = new Razorpay(options);

      rp.open();
      setStep("payment");
    } catch {
      setStep("address");
      setError(
        "Could not open the payment window. Please try again."
      );
    }
  }

  // ------------------------------------------------------------
  // SIMULATED PAYMENT VIEW
  // ------------------------------------------------------------

  if (
    step === "payment" &&
    orderResult &&
    !orderResult.paymentConfigured
  ) {
    return (
      <div className="container-store flex min-h-[70dvh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl border border-line bg-background p-7 text-center shadow-sm sm:p-9">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
            <Lock className="h-6 w-6 text-accent" />
          </div>

          <h1 className="font-display mt-5 text-2xl font-semibold text-accent">
            Test Payment
          </h1>

          <p className="mt-2 text-sm text-muted">
            This store is currently using a simulated payment gateway.
          </p>

          <div className="mt-6 rounded-2xl border border-line bg-accent-soft/40 p-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order</span>

              <span className="font-medium">
                {orderResult.orderNumber}
              </span>
            </div>

            <div className="mt-3 flex justify-between border-t border-line pt-3">
              <span className="font-medium">Amount</span>

              <span className="font-semibold text-accent">
                {formatINR(orderResult.amount)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            className="mt-6"
            onClick={async () => {
              setError(null);
              setStep("processing");

              try {
                const result = await simulatePayment({
                  orderId: orderResult.orderId,
                });

                if (!result.success) {
                  setStep("payment");
                  setError(
                    result.error ?? "Test payment failed."
                  );
                  return;
                }

                await refresh();
                setStep("success");
              } catch {
                setStep("payment");
                setError(
                  "Could not complete the test payment."
                );
              }
            }}
            loading={placing}
          >
            {placing
              ? "Processing payment..."
              : "Simulate Successful Payment"}
          </Button>

          <p className="mt-4 text-[11px] text-muted">
            No real money will be charged. This is a test payment.
          </p>

          <button
            type="button"
            className="mt-4 text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
            onClick={async () => {
              const { abandonCheckout } =
                await import("@/actions/checkout");

              await abandonCheckout({
                orderId: orderResult.orderId,
              });

              setStep("address");
              setOrderResult(null);
              setError(
                "Payment cancelled. Your items are still in your cart."
              );
            }}
          >
            Cancel payment
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // SUCCESS VIEW
  // ------------------------------------------------------------

  if (step === "success" && orderResult) {
    return (
      <div className="container-store flex min-h-[70dvh] max-w-2xl flex-col items-center justify-center py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="h-8 w-8" />
        </span>

        <h1 className="font-display mt-6 text-3xl font-semibold text-accent">
          Order placed and paid
        </h1>

        <p className="mt-3 text-sm text-muted">
          Your order{" "}
          <strong className="text-foreground">
            {orderResult.orderNumber}
          </strong>{" "}
          has been received and confirmed.
        </p>

        <p className="mt-2 text-sm text-muted">
          A confirmation was sent to {user.email}.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            href={`/account/orders/${orderResult.orderId}`}
            variant="outline"
          >
            View order
          </Button>

          <Button href="/shop">
            Continue shopping
          </Button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // CHECKOUT VIEW
  // ------------------------------------------------------------

  return (
    <div className="container-store py-10">
      <h1 className="font-display text-3xl font-semibold text-accent sm:text-4xl">
        Checkout
      </h1>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {/* Address */}

          <section>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-accent">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] text-background">
                1
              </span>

              Shipping address
            </h2>

            <div className="mt-4 space-y-3">
              {addresses.length > 0 &&
                addresses.map((a) => (
                  <label
                    key={a.id}
                    onClick={() => {
                      setSelectedAddressId(a.id);
                      setShowNewAddress(false);
                    }}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      selectedAddressId === a.id &&
                      !showNewAddress
                        ? "border-accent bg-accent-soft/40"
                        : "border-line bg-background hover:border-accent/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={
                        selectedAddressId === a.id &&
                        !showNewAddress
                      }
                      onChange={() => {}}
                      className="mt-1"
                    />

                    <span className="text-sm">
                      <span className="font-medium text-accent">
                        {a.full_name} · {a.phone}
                      </span>

                      {a.is_default && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                          Default
                        </span>
                      )}

                      <br />

                      <span className="text-muted">
                        {a.address_line_1}
                        {a.address_line_2
                          ? `, ${a.address_line_2}`
                          : ""}
                        , {a.city}, {a.state} {a.postal_code},{" "}
                        {a.country}
                      </span>
                    </span>
                  </label>
                ))}

              <button
                type="button"
                onClick={() => {
                  setShowNewAddress(true);
                  setSelectedAddressId("");
                }}
                className="w-full rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
              >
                + Add a new address
              </button>
            </div>

            {showNewAddress && (
              <div className="mt-5 grid gap-4 rounded-2xl border border-line p-5 sm:grid-cols-2">
                <Input
                  label="Full name"
                  name="full_name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value,
                    })
                  }
                  error={fieldErrors.full_name}
                />

                <Input
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  error={fieldErrors.phone}
                  type="tel"
                  placeholder="10-digit mobile number"
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Address (house no, street, area)"
                    name="address_line_1"
                    value={form.address_line_1}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address_line_1: e.target.value,
                      })
                    }
                    error={fieldErrors.address_line_1}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Address line 2 (optional)"
                    name="address_line_2"
                    value={form.address_line_2}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address_line_2: e.target.value,
                      })
                    }
                  />
                </div>

                <Input
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      city: e.target.value,
                    })
                  }
                  error={fieldErrors.city}
                />

                <Select
                  label="State"
                  name="state"
                  value={form.state}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      state: e.target.value,
                    })
                  }
                  error={fieldErrors.state}
                  placeholder="Select state"
                  options={INDIAN_STATES.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />

                <Input
                  label="PIN code"
                  name="postal_code"
                  value={form.postal_code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      postal_code: e.target.value,
                    })
                  }
                  error={fieldErrors.postal_code}
                  inputMode="numeric"
                />

                <Input
                  label="Country"
                  name="country"
                  value={form.country}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      country: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </section>

          {/* Review */}

          <section className="mt-10">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-accent">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] text-background">
                2
              </span>

              Review items
            </h2>

            <ul className="mt-4 divide-y divide-line border-y border-line">
              {lines.map((line) => (
                <li
                  key={line.variantId}
                  className="flex items-center gap-4 py-4"
                >
                  <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-accent-soft">
                    {line.image && (
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-accent">
                      {line.name}
                    </p>

                    <p className="text-xs text-muted">
                      {line.size
                        ? `Size ${line.size}`
                        : "One size"}

                      {line.color
                        ? ` · ${line.color}`
                        : ""}{" "}
                      · Qty {line.quantity}
                    </p>
                  </div>

                  <p className="text-sm font-semibold">
                    {formatINR(
                      line.price * line.quantity
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-6">
            <Button
              onClick={placeOrder}
              size="lg"
              fullWidth
              loading={placing}
            >
              {placing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing order…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pay ₹{formatINR(total)} and place order
                </>
              )}
            </Button>

            <p className="mt-3 text-center text-[11px] text-muted">
              By placing this order you agree to our terms.
              Prices include all taxes.
            </p>
          </div>
        </div>

        {/* Summary */}

        <aside className="h-fit rounded-2xl border border-line p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-semibold text-accent">
            Summary
          </h2>

          <div className="mt-4 rounded-xl bg-accent-soft/60 px-4 py-3 text-xs text-muted">
            Delivering to:
            <br />

            <span className="mt-1 block text-sm text-foreground">
              {previewAddress()}
            </span>
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>

              <dd className="font-medium">
                {formatINR(subtotal)}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>

              <dd className="font-medium">
                {shipping === 0
                  ? "Free"
                  : formatINR(shipping)}
              </dd>
            </div>

            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-semibold text-accent">
                Total
              </dt>

              <dd className="font-semibold text-accent">
                {formatINR(total)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-center text-xs text-muted">
            {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
              ? "Secure payment via Razorpay"
              : "Test payment mode — no real money will be charged"}
          </p>
        </aside>
      </div>
    </div>
  );
}

function userIsName(email: string) {
  const local = email.split("@")[0] ?? "";

  return local
    .split(/[._-]/)
    .map(
      (p) =>
        p.charAt(0).toUpperCase() + p.slice(1)
    )
    .join(" ");
}
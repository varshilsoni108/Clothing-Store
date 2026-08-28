import type { Metadata } from "next";
import { requireUser } from "@/lib/db/helpers";
import { createClient } from "@/lib/supabase/server";
import { CheckoutFlow } from "@/components/store/checkout-flow";
import type { Address } from "@/lib/types";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  return (
    <CheckoutFlow
      user={{ id: user.id, email: user.email ?? "" }}
      addresses={(addresses ?? []) as Address[]}
    />
  );
}
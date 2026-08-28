import type { Metadata } from "next";
import { requireUser } from "@/lib/db/helpers";
import { createClient } from "@/lib/supabase/server";
import { AddressesClient } from "@/components/account/addresses-client";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  return <AddressesClient addresses={(addresses ?? []) as Address[]} />;
}
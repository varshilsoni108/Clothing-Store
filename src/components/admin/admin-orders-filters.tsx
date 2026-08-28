"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/types";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export function AdminOrdersFilters({
  search,
  status,
  payment,
}: {
  search: string;
  status: OrderStatus | "";
  payment: PaymentStatus | "";
}) {
  const router = useRouter();

  function navigate(name: "status" | "payment", value: string) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (name === "status") {
      if (value) params.set("status", value);
      if (payment) params.set("payment", payment);
    } else {
      if (status) params.set("status", status);
      if (value) params.set("payment", value);
    }
    const query = params.toString();
    router.push(query ? `/admin/orders?${query}` : "/admin/orders");
  }

  return (
    <>
      <Select
        value={status}
        onChange={(e) => navigate("status", e.target.value)}
        placeholder="All statuses"
        options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))}
      />
      <Select
        value={payment}
        onChange={(e) => navigate("payment", e.target.value)}
        placeholder="All payments"
        options={PAYMENT_STATUSES.map((s) => ({ value: s, label: s }))}
      />
    </>
  );
}
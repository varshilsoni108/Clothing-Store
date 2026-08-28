"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export function OrderCancelButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    const fd = new FormData();
    fd.set("id", orderId);
    const res = await cancelOrder(fd);
    setPending(false);
    setConfirmOpen(false);
    if (res.success) {
      toast(res.message ?? "Order cancelled.", "success");
      router.refresh();
    } else {
      toast(res.message ?? "Could not cancel the order.", "error");
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="flex-shrink-0"
      >
        Cancel order
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Cancel this order?"
        description="The items will be returned to your cart and any payment will be refunded."
        confirmLabel="Yes, cancel order"
        tone="danger"
        loading={pending}
      />
    </>
  );
}
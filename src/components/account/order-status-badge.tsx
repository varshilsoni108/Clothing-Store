import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case "delivered":
      return <Badge tone="success">Delivered</Badge>;
    case "cancelled":
      return <Badge tone="danger">Cancelled</Badge>;
    case "returned":
      return <Badge tone="danger">Returned</Badge>;
    case "shipped":
    case "processing":
      return <Badge tone="accent">{status}</Badge>;
    case "confirmed":
      return <Badge tone="accent">Confirmed</Badge>;
    default:
      return <Badge tone="warning">Pending</Badge>;
  }
}
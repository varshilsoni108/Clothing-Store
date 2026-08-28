import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/types";

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "paid":
      return <Badge tone="success">Paid</Badge>;
    case "refunded":
      return <Badge tone="warning">Refunded</Badge>;
    case "failed":
      return <Badge tone="danger">Failed</Badge>;
    default:
      return <Badge tone="neutral">Pending</Badge>;
  }
}
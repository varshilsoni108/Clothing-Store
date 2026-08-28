"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function SearchOrdersBox({
  initial,
  baseParams,
}: {
  initial: string;
  baseParams: { status?: string; payment?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (baseParams.status) params.set("status", baseParams.status);
      if (baseParams.payment) params.set("payment", baseParams.payment);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="Search by order number…"
      aria-label="Search orders"
      className="h-11 w-full rounded-lg border border-line bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-foreground"
    />
  );
}
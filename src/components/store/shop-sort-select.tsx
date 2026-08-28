"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/constants";

export function ShopSortSelect({
  value,
  q,
  sizes,
  colors,
  minPrice,
  maxPrice,
}: {
  value: string;
  q: string;
  sizes: string[];
  colors: string[];
  minPrice: string;
  maxPrice: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={value}
      onChange={(e) => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        sizes.forEach((s) => params.append("size", s));
        colors.forEach((c) => params.append("color", c));
        if (minPrice) params.set("min", minPrice);
        if (maxPrice) params.set("max", maxPrice);
        if (e.target.value) params.set("sort", e.target.value);
        const query = params.toString();
        router.push(query ? `/shop?${query}` : "/shop");
      }}
      options={SORT_OPTIONS}
      aria-label="Sort products"
      className="w-48"
    />
  );
}
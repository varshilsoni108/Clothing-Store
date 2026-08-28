import Link from "next/link";

type LowStockRow = {
  id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  products?: { name: string; slug: string } | { name: string; slug: string }[];
};

export function LowStockList({ items }: { items: LowStockRow[] }) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-muted">All variants are well stocked.</p>;
  }

  return (
    <ul className="mt-4 divide-y divide-line">
      {items.map((v) => {
        const product = Array.isArray(v.products) ? v.products[0] : v.products;
        return (
          <li key={v.id} className="flex items-center justify-between gap-3 py-3">
            <Link
              href={`/product/${product?.slug ?? ""}`}
              className="min-w-0 truncate text-sm font-medium text-accent hover:underline"
            >
              {product?.name ?? "Unknown product"}
            </Link>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-muted">
                {v.size ? `Size ${v.size}` : "One size"}
                {v.color ? ` · ${v.color}` : ""}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  v.stock_quantity === 0
                    ? "bg-red-100 text-red-900"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {v.stock_quantity === 0 ? "Out" : `${v.stock_quantity} left`}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
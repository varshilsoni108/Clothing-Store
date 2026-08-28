import { adminListInventory } from "@/lib/db/admin";
import { Pagination } from "@/components/store/pagination";
import { StockEditor } from "@/components/admin/stock-editor";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const lowStock = sp.low === "1";
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "") || 1);

  const result = await adminListInventory({ lowStock, search: q, page, pageSize: 20 });

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (lowStock) params.set("low", "1");
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/admin/inventory?${query}` : "/admin/inventory";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-accent">Inventory</h1>
          <p className="mt-1 text-sm text-muted">{result.total} active variants</p>
        </div>
        <a
          href={lowStock ? "/admin/inventory" : "/admin/inventory?low=1"}
          className={
            lowStock
              ? "rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-background"
              : "rounded-full border border-line px-4 py-1.5 text-xs font-medium text-muted hover:border-foreground hover:text-accent"
          }
        >
          Low stock only
        </a>
      </div>

      <form className="max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by product or SKU…"
          aria-label="Search inventory"
          className="h-11 w-full rounded-lg border border-line bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-foreground"
        />
      </form>

      {result.variants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          No variants match.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-background">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Variant</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.variants.map((v) => (
                <tr key={v.id} className="hover:bg-accent-soft/40">
                  <td className="px-4 py-3">
                    <span className="font-medium text-accent">{v.product_name}</span>
                    {!v.active_product && <span className="ml-2 text-xs text-muted">(inactive)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {v.size ? `Size ${v.size}` : "One size"}
                    {v.color ? ` · ${v.color}` : ""}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{v.sku ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StockEditor variantId={v.id} stock={v.stock_quantity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} makeHref={makeHref} />
    </div>
  );
}
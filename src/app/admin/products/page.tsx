import Image from "next/image";
import Link from "next/link";
import { adminGetProducts } from "@/lib/db/admin";
import { DeleteProductButton } from "@/components/admin/delete-buttons";
import { formatINR } from "@/lib/utils";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = typeof sp.filter === "string" ? sp.filter : "all";
  const products = await adminGetProducts();

  const visible =
    filter === "active"
      ? products.filter((p) => p.active)
      : filter === "inactive"
        ? products.filter((p) => !p.active)
        : products;

  const tabs: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-accent">Products</h1>
          <p className="mt-1 text-sm text-muted">{visible.length} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground"
        >
          + New product
        </Link>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/admin/products" : `/admin/products?filter=${t.key}`}
            className={
              filter === t.key
                ? "rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-background"
                : "rounded-full border border-line px-4 py-1.5 text-xs font-medium text-muted hover:border-foreground hover:text-accent"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          No products here. Create your first product.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-background">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-accent-soft/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      {p.main_image ? (
                        <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-accent-soft">
                          <Image src={p.main_image} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                      ) : (
                        <span className="flex h-12 w-10 shrink-0 items-center justify-center rounded bg-accent-soft text-xs text-muted">
                          No img
                        </span>
                      )}
                      <span className="truncate font-medium text-accent hover:underline">
                        {p.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{formatINR(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.total_stock === 0
                          ? "font-semibold text-red-700"
                          : p.total_stock <= 10
                            ? "font-semibold text-amber-700"
                            : "text-muted"
                      }
                    >
                      {p.total_stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.active
                          ? "text-xs font-medium text-emerald-700"
                          : "text-xs font-medium text-muted"
                      }
                    >
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-sm text-accent hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteProductButton productId={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
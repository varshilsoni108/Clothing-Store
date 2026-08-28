import Link from "next/link";
import { listCustomers } from "@/lib/db/admin";
import { formatINR, formatDate } from "@/lib/utils";

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-accent">Customers</h1>
        <p className="mt-1 text-sm text-muted">{customers.length} registered customers</p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          No customers yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-background">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Total spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-accent-soft/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {c.full_name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {c.email ?? ""}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3 font-medium">{c.orders_count}</td>
                  <td className="px-4 py-3 font-semibold">{formatINR(c.total_spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
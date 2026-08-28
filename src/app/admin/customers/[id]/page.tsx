import Link from "next/link";
import { notFound } from "next/navigation";
import {
  adminGetAddressesForUser,
  getCustomerDetail,
} from "@/lib/db/admin";
import { formatINR, formatDateTime } from "@/lib/utils";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, orders } = await getCustomerDetail(id);
  if (!profile) notFound();
  const addresses = await adminGetAddressesForUser(id);

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-xs text-muted hover:text-accent hover:underline">
        ← All customers
      </Link>

      <div>
        <h1 className="font-display text-3xl font-semibold text-accent">
          {profile.full_name ?? "Customer"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {profile.email ?? ""}
          {profile.phone ? ` · ${profile.phone}` : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line p-6">
          <h2 className="font-display text-lg font-semibold text-accent">Profile</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Role</dt>
              <dd className="font-medium capitalize">{profile.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Joined</dt>
              <dd className="font-medium">{formatDateTime(profile.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Orders</dt>
              <dd className="font-medium">{orders.length}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-line p-6">
          <h2 className="font-display text-lg font-semibold text-accent">Addresses</h2>
          {addresses.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No saved addresses.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {addresses.map((a) => (
                <li key={a.id} className="rounded-xl bg-accent-soft/50 p-4">
                  <p className="font-medium text-accent">{a.full_name}</p>
                  <p className="text-foreground/70">
                    {a.address_line_1}
                    {a.address_line_2 ? `, ${a.address_line_2}` : ""}, {a.city},{" "}
                    {a.state} {a.postal_code}
                  </p>
                  {a.is_default && (
                    <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-background">
                      Default
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-line p-6">
        <h2 className="font-display text-lg font-semibold text-accent">Order history</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-2 py-2 font-medium">Order</th>
                  <th className="px-2 py-2 font-medium">Placed</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-2 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-muted">{formatDateTime(o.created_at)}</td>
                    <td className="px-2 py-3 capitalize text-muted">{o.order_status}</td>
                    <td className="px-2 py-3 font-semibold">{formatINR(o.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
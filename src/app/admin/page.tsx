import Link from "next/link";
import { getDashboardStats } from "@/lib/db/admin";
import { formatINR, formatDate } from "@/lib/utils";
import { LowStockList } from "@/components/admin/low-stock-list";
import {
  IndianRupee,
  Package,
  Users,
  Shirt,
  Boxes,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-accent">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Store overview at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="Revenue (paid)"
          value={formatINR(stats.revenue)}
        />
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Total orders"
          value={String(stats.totalOrders)}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Customers"
          value={String(stats.totalCustomers)}
        />
        <StatCard
          icon={<Shirt className="h-4 w-4" />}
          label="Active products"
          value={String(stats.totalProducts)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusStat label="Pending" count={stats.pendingOrders} tone="warning" />
        <StatusStat label="Processing" count={stats.processingOrders} tone="accent" />
        <StatusStat label="Shipped" count={stats.shippedOrders} tone="accent" />
        <StatusStat label="Delivered" count={stats.deliveredOrders} tone="success" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-line p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-accent">
              Recent orders
            </h2>
            <Link href="/admin/orders" className="text-sm text-muted hover:text-accent">
              View all →
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {stats.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between py-3 hover:bg-accent-soft/40"
                  >
                    <div>
                      <p className="text-sm font-medium text-accent">
                        {o.order_number}
                      </p>
                      <p className="text-xs text-muted">{formatDate(o.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatINR(o.total_amount)}
                      </p>
                      <p className="text-xs capitalize text-muted">
                        {o.order_status}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-accent">
              <Boxes className="h-4 w-4" />
              Low stock
            </h2>
            <Link href="/admin/inventory" className="text-sm text-muted hover:text-accent">
              Manage →
            </Link>
          </div>
          <LowStockList items={stats.lowStock} />
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-background p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </span>
      <p className="mt-4 text-2xl font-semibold text-accent">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

function StatusStat({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "warning" | "accent" | "success";
}) {
  const dot =
    tone === "success"
      ? "bg-emerald-600"
      : tone === "warning"
        ? "bg-amber-500"
        : "bg-accent";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-background px-5 py-4">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <div className="flex-1">
        <p className="text-lg font-semibold text-accent">{count}</p>
        <p className="text-xs text-muted">{label} orders</p>
      </div>
    </div>
  );
}
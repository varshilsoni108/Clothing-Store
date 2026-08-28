import { adminListUsers } from "@/lib/db/admin";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { formatDate } from "@/lib/utils";

export default async function AdminSettingsPage() {
  const users = await adminListUsers();
  const admins = users.filter((u) => u.role === "admin");
  const customers = users.filter((u) => u.role === "customer");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-accent">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Manage team roles — {admins.length} admin{admins.length === 1 ? "" : "s"},{" "}
          {customers.length} customer{customers.length === 1 ? "" : "s"}.
        </p>
      </div>

      <section className="rounded-2xl border border-line p-6">
        <h2 className="font-display text-lg font-semibold text-accent">User roles</h2>
        <p className="mt-1 text-sm text-muted">
          Promote or demote users. Only admins can reach the admin area.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-2 py-2 font-medium">User</th>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Joined</th>
                <th className="px-2 py-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-accent-soft/40">
                  <td className="px-2 py-3 font-medium text-accent">
                    {u.full_name ?? "—"}
                  </td>
                  <td className="px-2 py-3 text-muted">{u.email ?? ""}</td>
                  <td className="px-2 py-3 text-muted">{formatDate(u.created_at)}</td>
                  <td className="px-2 py-3">
                    <UserRoleSelect userId={u.id} role={u.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-line p-6">
        <h2 className="font-display text-lg font-semibold text-accent">Store details</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Store name</dt>
            <dd className="font-medium">The Fashion Hub</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Currency</dt>
            <dd className="font-medium">INR (₹)</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Free shipping threshold</dt>
            <dd className="font-medium">₹1,999</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Flat shipping rate</dt>
            <dd className="font-medium">₹99</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
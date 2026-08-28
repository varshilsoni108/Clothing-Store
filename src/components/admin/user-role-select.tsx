"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/actions/admin";
import { useToast } from "@/components/ui/toast";
import type { UserRole } from "@/lib/types";

export function UserRoleSelect({ userId, role }: { userId: string; role: UserRole }) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(role);
  const [saving, setSaving] = useState(false);

  async function change(next: UserRole) {
    if (next === value) return;
    setSaving(true);
    try {
      const res = await setUserRole(userId, next);
      if (res.ok) {
        setValue(next);
        toast(`Role updated to ${next}.`, "success");
        router.refresh();
      } else {
        toast(res.error ?? "Could not update role.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        disabled={saving}
        onChange={(e) => change(e.target.value as UserRole)}
        className="h-9 rounded-lg border border-line bg-background px-2.5 text-sm outline-none focus:border-foreground"
      >
        <option value="customer">customer</option>
        <option value="admin">admin</option>
      </select>
      {saving && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      )}
    </div>
  );
}
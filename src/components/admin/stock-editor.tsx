"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateVariantStock } from "@/actions/admin";
import { useToast } from "@/components/ui/toast";

export function StockEditor({ variantId, stock }: { variantId: string; stock: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(String(stock));
  const [saving, setSaving] = useState(false);

  async function save() {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) {
      toast("Enter a valid stock number.", "error");
      setValue(String(stock));
      return;
    }
    if (next === stock) return;
    setSaving(true);
    try {
      const res = await updateVariantStock(variantId, next);
      if (res.ok) {
        toast("Stock updated.", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Could not update stock.", "error");
        setValue(String(stock));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-32 items-center gap-1">
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="h-9 w-full rounded-lg border border-line bg-background px-3 text-sm outline-none focus:border-foreground"
      />
      {saving && (
        <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      )}
    </div>
  );
}
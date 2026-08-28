"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({ initial }: { initial: { full_name: string; phone: string } }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateProfile, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);

  return (
    <form action={action}>
      <div className="space-y-4">
        <Input
          label="Full name"
          name="full_name"
          defaultValue={initial.full_name}
          required
          error={state.errors?.full_name?.[0]}
        />
        <Input
          label="Phone (optional)"
          name="phone"
          defaultValue={initial.phone}
          type="tel"
          placeholder="10-digit mobile number"
          error={state.errors?.phone?.[0]}
        />
      </div>
      {state.message && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {state.message}
        </p>
      )}
      <Button type="submit" className="mt-6" loading={pending}>
        Save changes
      </Button>
    </form>
  );
}
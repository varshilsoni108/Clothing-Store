"use client";

import { useActionState, useState } from "react";
import { addAddress, deleteAddress, setDefaultAddress, updateAddress } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Address } from "@/lib/types";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Puducherry", "Chandigarh", "Jammu & Kashmir", "Ladakh",
];

export function AddressesClient({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(addresses.length === 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-accent">
          Addresses
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
        >
          {showForm && !editing ? "Cancel" : "Add address"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-6 rounded-2xl border border-line p-6">
          <AddressForm
            initial={editing}
            onDone={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          No saved addresses yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li
              key={a.id}
              className={`rounded-2xl border p-5 ${
                a.is_default ? "border-accent" : "border-line"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-accent">{a.full_name}</p>
                {a.is_default && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted">
                {a.address_line_1}
                {a.address_line_2 ? `, ${a.address_line_2}` : ""}, {a.city},{" "}
                {a.state} {a.postal_code}, {a.country}
                <br />
                <span className="text-foreground/70">{a.phone}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <button
                  onClick={() => {
                    setEditing(a);
                    setShowForm(true);
                  }}
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  Edit
                </button>
                {!a.is_default && (
                  <form action={async (fd) => { await setDefaultAddress(fd); }}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="font-medium text-muted underline-offset-2 hover:text-accent hover:underline">
                      Make default
                    </button>
                  </form>
                )}
                <form action={async (fd) => { await deleteAddress(fd); }}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    className="font-medium text-red-700 underline-offset-2 hover:underline"
                    onClick={(e) => {
                      if (!confirm("Delete this address?")) e.preventDefault();
                    }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddressForm({
  initial,
  onDone,
}: {
  initial: Address | null;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(
    initial ? updateAddress : addAddress,
    {}
  );

  return (
    <form action={action}>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="full_name" defaultValue={initial?.full_name} required error={state.errors?.full_name?.[0]} />
        <Input label="Phone" name="phone" defaultValue={initial?.phone} required type="tel" error={state.errors?.phone?.[0]} />
        <div className="sm:col-span-2">
          <Input label="Address line 1" name="address_line_1" defaultValue={initial?.address_line_1} required error={state.errors?.address_line_1?.[0]} />
        </div>
        <div className="sm:col-span-2">
          <Input label="Address line 2 (optional)" name="address_line_2" defaultValue={initial?.address_line_2 ?? ""} />
        </div>
        <Input label="City" name="city" defaultValue={initial?.city} required error={state.errors?.city?.[0]} />
        <Select
          label="State"
          name="state"
          defaultValue={initial?.state}
          required
          placeholder="Select state"
          options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
          error={state.errors?.state?.[0]}
        />
        <Input label="PIN code" name="postal_code" defaultValue={initial?.postal_code} required inputMode="numeric" error={state.errors?.postal_code?.[0]} />
        <Input label="Country" name="country" defaultValue={initial?.country ?? "India"} />
      </div>
      {state.message && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button type="submit" loading={pending}>
          {initial ? "Save changes" : "Add address"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
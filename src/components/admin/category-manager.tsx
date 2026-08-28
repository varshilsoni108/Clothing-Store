"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveCategory } from "@/actions/admin";
import { DeleteCategoryButton } from "@/components/admin/delete-buttons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";
import type { Category } from "@/lib/types";

type Errors = Partial<Record<string, string[]>>;

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [active, setActive] = useState(true);
  const slugTouched = useRef(false);

  function openNew() {
    setEditing(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setActive(true);
    slugTouched.current = false;
    setErrors({});
    setOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description ?? "");
    setImage(c.image ?? "");
    setActive(c.active);
    slugTouched.current = true;
    setErrors({});
    setOpen(true);
  }

  async function submit() {
    setSaving(true);
    setErrors({});
    try {
      const res = await saveCategory(
        { name, slug, description, image, active },
        editing?.id
      );
      if (res.ok) {
        toast(editing ? "Category updated." : "Category created.", "success");
        setOpen(false);
        router.refresh();
      } else {
        setErrors(res.data ?? {});
        toast(res.error ?? "Could not save the category.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const err = (key: string) => errors[key]?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-accent">Categories</h1>
          <p className="mt-1 text-sm text-muted">{categories.length} categories</p>
        </div>
        <Button onClick={openNew}>+ New category</Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          No categories yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="flex flex-col rounded-2xl border border-line p-5">
              <div className="flex items-start justify-between gap-3">
                {c.image ? (
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-accent-soft">
                    <Image src={c.image} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-muted">
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-sm text-accent hover:underline"
                  >
                    Edit
                  </button>
                  <DeleteCategoryButton categoryId={c.id} name={c.name} />
                </div>
              </div>
              <p className="mt-3 font-display text-lg font-semibold text-accent">{c.name}</p>
              <p className="text-xs text-muted">/{c.slug}</p>
              {c.description && (
                <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{c.description}</p>
              )}
              <span
                className={
                  c.active
                    ? "mt-3 w-fit rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
                    : "mt-3 w-fit rounded-full bg-line px-2.5 py-0.5 text-[11px] font-semibold text-muted"
                }
              >
                {c.active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit category" : "New category"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched.current) setSlug(slugify(e.target.value));
            }}
            error={err("name")}
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => {
              slugTouched.current = true;
              setSlug(slugify(e.target.value));
            }}
            error={err("slug")}
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={err("description")}
          />
          <Input
            label="Image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            error={err("image")}
            hint="Paste a hosted image URL used on the category banner."
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Active
          </label>
        </div>
      </Dialog>
    </div>
  );
}
"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveProduct } from "@/actions/admin";
import { ProductImageUpload } from "@/components/admin/product-image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import type { Category, ProductWithRelations } from "@/lib/types";

type VariantDraft = {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: string;
  price: string;
  active: boolean;
};

type ImageDraft = { id?: string; image_url: string };

type FieldErrors = Partial<Record<string, string[]>>;

export function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: ProductWithRelations | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isNew = !initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [compareAt, setCompareAt] = useState(
    initial?.compare_at_price != null ? String(initial.compare_at_price) : ""
  );
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [featured, setFeatured] = useState(initial?.featured ?? false);

  const [variants, setVariants] = useState<VariantDraft[]>(
    initial?.product_variants?.map((v) => ({
      id: v.id,
      size: v.size ?? "",
      color: v.color ?? "",
      sku: v.sku ?? "",
      stock: String(v.stock_quantity),
      price: v.price != null ? String(v.price) : "",
      active: v.active,
    })) ?? [emptyVariant()]
  );
  const [images, setImages] = useState<ImageDraft[]>(
    initial?.product_images?.length
      ? initial.product_images.map((i) => ({ id: i.id, image_url: i.image_url }))
      : initial?.main_image
        ? [{ image_url: initial.main_image }]
        : []
  );

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const slugTouched = useRef(!!initial);

  const categoryOptions = useMemo(
    () =>
      [...categories]
        .sort((a, b) => Number(b.active) - Number(a.active))
        .map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched.current) setSlug(slugify(value));
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  async function submit() {
    setSaving(true);
    setErrors({});
    try {
      const res = await saveProduct(
        {
          name,
          slug,
          description,
          price: price === "" ? "" : Number(price),
          compare_at_price: compareAt === "" ? "" : Number(compareAt),
          category_id: categoryId,
          main_image: images[0]?.image_url ?? "",
          active,
          featured,
          variants: variants.map((v) => ({
            id: v.id,
            size: v.size || "",
            color: v.color || "",
            sku: v.sku || "",
            stock_quantity: Number(v.stock || 0),
            price: v.price === "" ? "" : Number(v.price),
            active: v.active,
          })),
          images: images.map((img, i) => ({
            id: img.id,
            image_url: img.image_url,
            sort_order: i,
          })),
        },
        initial?.id
      );
      if (res.ok) {
        toast(isNew ? "Product created." : "Product updated.", "success");
        router.push("/admin/products");
        router.refresh();
      } else {
        setErrors(res.data ?? {});
        toast(res.error ?? "Could not save the product.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const err = (key: string) => errors[key]?.[0];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-accent">
            {isNew ? "New product" : "Edit product"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isNew ? "Add a new product to your catalogue." : `Editing ${initial?.name}`}
          </p>
        </div>
        <Button onClick={submit} loading={saving}>
          Save product
        </Button>
      </div>

      <section className="grid gap-5 rounded-2xl border border-line p-6 lg:grid-cols-2">
        <Input
          label="Name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          error={err("name")}
          placeholder="Relaxed Fit Linen Shirt"
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => {
            slugTouched.current = true;
            setSlug(slugify(e.target.value));
          }}
          error={err("slug")}
          placeholder="relaxed-fit-linen-shirt"
        />
        <div className="lg:col-span-2">
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={err("description")}
            hint="Markdown is supported on the product page."
          />
        </div>
        <Input
          label="Price (₹)"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={err("price")}
          placeholder="1299"
        />
        <Input
          label="Compare-at price (₹)"
          type="number"
          min="0"
          step="0.01"
          value={compareAt}
          onChange={(e) => setCompareAt(e.target.value)}
          error={err("compare_at_price")}
          hint="Original price shown struck-through when higher than the price."
        />
        <Select
          label="Category"
          options={categoryOptions}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Select a category"
          error={err("category_id")}
        />
        <div className="flex items-end gap-6 pb-1">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Featured on home page
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-line p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-accent">Images</h2>
            <p className="mt-0.5 text-xs text-muted">
              The first image is used as the cover. Add multiple for a gallery.
            </p>
          </div>
          <ProductImageUpload onUploaded={(url) => setImages((prev) => [...prev, { image_url: url }])} />
        </div>
        {images.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            No images yet — upload one to get started.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <span className="relative block h-24 w-20 overflow-hidden rounded-lg bg-accent-soft">
                  <Image src={img.image_url} alt="" fill sizes="80px" className="object-cover" />
                </span>
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-background">
                    Cover
                  </span>
                )}
                <button
                  onClick={() => setImages((prev) => prev.filter((_, x) => x !== i))}
                  aria-label="Remove image"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-700 text-white hover:bg-red-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-accent">Variants</h2>
            <p className="mt-0.5 text-xs text-muted">
              Add one line per size/color combination. Leave size and color empty for a single variant.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
          >
            <Plus className="h-4 w-4" /> Add variant
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2 lg:grid-cols-6">
              <Input label="Size" value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })} placeholder="M" />
              <Input label="Color" value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })} placeholder="Olive" />
              <Input label="SKU" value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} placeholder="TFH-001-M" />
              <Input
                label="Stock"
                type="number"
                min="0"
                step="1"
                value={v.stock}
                onChange={(e) => updateVariant(i, { stock: e.target.value })}
              />
              <Input
                label="Price (₹)"
                type="number"
                min="0"
                step="0.01"
                value={v.price}
                onChange={(e) => updateVariant(i, { price: e.target.value })}
                hint={v.price === "" ? "Inherits product price" : undefined}
              />
              <div className="flex items-end justify-between pb-1">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={v.active}
                    onChange={(e) => updateVariant(i, { active: e.target.checked })}
                    className="h-4 w-4 accent-accent"
                  />
                  Active
                </label>
                <button
                  onClick={() => setVariants((prev) => prev.filter((_, x) => x !== i))}
                  aria-label="Remove variant"
                  className="text-muted transition-colors hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <Button onClick={submit} loading={saving}>
          Save product
        </Button>
      </div>
    </div>
  );
}

function emptyVariant(): VariantDraft {
  return { size: "", color: "", sku: "", stock: "0", price: "", active: true };
}
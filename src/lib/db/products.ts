import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";
import type {
  Category,
  Product,
  ProductImage,
  ProductVariant,
  ProductWithRelations,
} from "@/lib/types";
import { escapeLike, toNumber } from "./helpers";

export interface ProductFilters {
  q?: string;
  categoryId?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
}

export interface ProductsResult {
  products: (Product & { product_variants: ProductVariant[] })[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sizes: string[];
  colors: string[];
}

const PRODUCT_COLUMNS =
  "id,name,slug,description,price,compare_at_price,category_id,main_image,active,featured,created_at,updated_at";

const VARIANT_COLUMNS = "id,product_id,size,color,sku,stock_quantity,price,active";

function mapProduct(row: Record<string, unknown>): Product {
  return {
    ...(row as unknown as Product),
    price: toNumber(row.price),
    compare_at_price: row.compare_at_price == null ? null : toNumber(row.compare_at_price),
  };
}

function mapVariant(row: Record<string, unknown>): ProductVariant {
  return {
    ...(row as unknown as ProductVariant),
    price: row.price == null ? null : toNumber(row.price),
    stock_quantity: toNumber(row.stock_quantity),
  };
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `${PRODUCT_COLUMNS},categories(id,name,slug,description,image,active),
       product_variants(${VARIANT_COLUMNS}),product_images(id,image_url,sort_order)`
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  return {
    ...mapProduct(data),
    category: data.categories as unknown as Category | null,
    product_variants: ((data.product_variants as Record<string, unknown>[]) ?? [])
      .map(mapVariant)
      .sort((a, b) =>
        a.active === b.active ? 0 : a.active ? -1 : 1
      ),
    product_images: (data.product_images as unknown as ProductImage[]) ?? [],
  };
}

export async function getFacets(options?: { categoryId?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("product_variants")
    .select("size,color,products!inner(category_id,active,active)")
    .eq("products.active", true)
    .eq("active", true);

  if (options?.categoryId) {
    query = query.eq("products.category_id", options.categoryId);
  }

  const { data } = await query;
  const sizes = new Set<string>();
  const colors = new Set<string>();
  for (const row of data ?? []) {
    if (row.size) sizes.add(row.size);
    if (row.color) colors.add(row.color);
  }
  return {
    sizes: Array.from(sizes).sort(
      (a, b) =>
        ["S", "M", "L", "XL", "XXL"].indexOf(a) - ["S", "M", "L", "XL", "XXL"].indexOf(b) || a.localeCompare(b)
    ),
    colors: Array.from(colors).sort((a, b) => a.localeCompare(b)),
  };
}

export const getProducts = cache(
  async (filters: ProductFilters): Promise<ProductsResult> => {
    const supabase = await createClient();

    const page = Math.max(1, filters.page ?? 1);
    const pageSize = PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("products")
      .select(`${PRODUCT_COLUMNS},product_variants(${VARIANT_COLUMNS})`, {
        count: "exact",
      })
      .eq("active", true);

    if (filters.q) {
      query = query.ilike("name", `%${escapeLike(filters.q)}%`);
    }
    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }
    if (filters.sizes?.length) {
      query = query.in("product_variants.size", filters.sizes);
    }
    if (filters.colors?.length) {
      query = query.in("product_variants.color", filters.colors);
    }
    if (filters.minPrice != null) {
      query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice != null) {
      query = query.lte("price", filters.maxPrice);
    }

    const sort = filters.sort ?? "newest";
    switch (sort) {
      case "price-asc":
        query = query.order("price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("price", { ascending: false });
        break;
      case "name-asc":
        query = query.order("name", { ascending: true });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return { products: [], total: 0, page, pageSize, totalPages: 0, sizes: [], colors: [] };
    }

    const products = (data ?? []).map((row) => ({
      ...mapProduct(row),
      product_variants: ((row.product_variants as Record<string, unknown>[]) ?? []).map(mapVariant),
    }));

    const facets = await getFacets(filters.categoryId ? { categoryId: filters.categoryId } : undefined);

    return {
      products,
      total: count ?? products.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      sizes: facets.sizes,
      colors: facets.colors,
    };
  }
);

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("active", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(8);
  return (data ?? []).map(mapProduct);
}

export async function getNewArrivals(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(8);
  return (data ?? []).map(mapProduct);
}

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("active", true)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (product.category_id) {
    query = query.eq("category_id", product.category_id);
  }

  const { data } = await query;
  const related = (data ?? []).map(mapProduct);
  if (related.length < limit && product.category_id) {
    const { data: fallback } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("active", true)
      .neq("id", product.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    const existing = new Set(related.map((p) => p.id));
    for (const row of fallback ?? []) {
      const p = mapProduct(row);
      if (!existing.has(p.id)) {
        related.push(p);
        existing.add(p.id);
        if (related.length >= limit) break;
      }
    }
  }
  return related;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  return (data as Category | null) ?? null;
}

export async function searchProducts(q: string, limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("active", true)
    .ilike("name", `%${escapeLike(q)}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapProduct);
}

export async function getVariantsForProducts(
  productIds: string[]
): Promise<Record<string, ProductVariant[]>> {
  if (productIds.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_variants")
    .select(VARIANT_COLUMNS)
    .in("product_id", productIds);
  const grouped: Record<string, ProductVariant[]> = {};
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const v = mapVariant(row);
    const pid = v.product_id;
    if (!grouped[pid]) grouped[pid] = [];
    grouped[pid].push(v);
  }
  return grouped;
}
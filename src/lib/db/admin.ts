import "server-only";

import { createClient } from "@/lib/supabase/server";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import type {
  Address,
  Category,
  Order,
  OrderStatus,
  OrderWithItems,
  PaymentStatus,
  Product,
  ProductVariant,
  ProductWithRelations,
  Profile,
} from "@/lib/types";
import { toNumber } from "./helpers";

function mapOrder(row: Record<string, unknown>): Order {
  return {
    ...(row as unknown as Order),
    subtotal: toNumber(row.subtotal),
    shipping_amount: toNumber(row.shipping_amount),
    discount_amount: toNumber(row.discount_amount),
    total_amount: toNumber(row.total_amount),
  };
}

export async function listAdminOrders(opts: {
  search?: string;
  orderStatus?: OrderStatus | "";
  paymentStatus?: PaymentStatus | "";
  page?: number;
  pageSize?: number;
}): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
  const supabase = await createClient();
  const pageSize = opts.pageSize ?? 15;
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (opts.orderStatus) query = query.eq("order_status", opts.orderStatus);
  if (opts.paymentStatus) query = query.eq("payment_status", opts.paymentStatus);
  if (opts.search) {
    const term = `%${opts.search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    query = query.or(`order_number.ilike.${term}`);
  }

  const { data, count } = await query.range(from, from + pageSize - 1);
  return {
    orders: (data ?? []).map(mapOrder),
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function getAdminOrder(orderId: string): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*,order_items(*)")
    .eq("id", orderId)
    .single();
  if (!data) return null;

  // The `orders -> profiles` customer join is fetched separately: PostgREST
  // cannot embed `profiles` from `orders` because the FK targets `auth.users`
  // (no FK from `orders` to `profiles`). Read the profile by the order owner.
  let customer: Pick<Profile, "full_name" | "email" | "phone"> | null = null;
  if (data.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,email,phone")
      .eq("id", data.user_id as string)
      .single();
    customer = profile;
  }

  return {
    ...mapOrder(data),
    order_items: (data.order_items as Record<string, unknown>[]) ?? [],
    customer,
  } as unknown as OrderWithItems;
}

export async function listCustomers(): Promise<
  (Profile & { orders_count: number; total_spent: number })[]
> {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,role,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const customers = (profiles ?? []).filter(
    (p) => p.role === "customer"
  ) as unknown as Profile[];

  const { data: orders } = await supabase.from("orders").select("user_id,total_amount,order_status");

  const stats = new Map<string, { count: number; spent: number }>();
  for (const row of orders ?? []) {
    const s = stats.get(row.user_id as string) ?? { count: 0, spent: 0 };
    s.count += 1;
    if ((row.order_status as string) !== "cancelled") {
      s.spent += toNumber(row.total_amount);
    }
    stats.set(row.user_id as string, s);
  }

  return customers.map((c) => ({
    ...c,
    orders_count: stats.get(c.id)?.count ?? 0,
    total_spent: stats.get(c.id)?.spent ?? 0,
  }));
}

export async function getCustomerDetail(
  customerId: string
): Promise<{ profile: Profile | null; orders: Order[] }> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", customerId)
    .single();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);
  return {
    profile: (profile as Profile | null) ?? null,
    orders: (orders ?? []).map(mapOrder),
  };
}

export async function getDashboardStats() {
  const supabase = await createClient();

  const [ordersRes, profilesRes, productsRes, lowStockRes, recentOrdersRes, recentCustomersRes] =
    await Promise.all([
      supabase.from("orders").select("total_amount,payment_status,order_status"),
      supabase.from("profiles").select("id,role,created_at,full_name,email").eq("role", "customer"),
      supabase.from("products").select("id").eq("active", true),
      supabase
        .from("product_variants")
        .select("id,product_id,size,color,stock_quantity,products(name,slug)")
        .lte("stock_quantity", LOW_STOCK_THRESHOLD)
        .order("stock_quantity", { ascending: true })
        .limit(10),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(8),
      supabase
        .from("profiles")
        .select("id,full_name,email,created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const orders = ordersRes.data ?? [];
  const revenue = orders
    .filter((o) => (o.payment_status as string) === "paid")
    .reduce((sum, o) => sum + toNumber(o.total_amount), 0);

  const statusCount = (status: string) =>
    orders.filter((o) => (o.order_status as string) === status).length;

  return {
    totalOrders: orders.length,
    revenue,
    pendingOrders: statusCount("pending"),
    processingOrders: statusCount("processing"),
    shippedOrders: statusCount("shipped"),
    deliveredOrders: statusCount("delivered"),
    totalCustomers: profilesRes.data?.length ?? 0,
    totalProducts: productsRes.data?.length ?? 0,
    lowStock: lowStockRes.data ?? [],
    recentOrders: (recentOrdersRes.data ?? []).map(mapOrder),
    recentCustomers: recentCustomersRes.data ?? [],
  };
}

export async function adminGetProducts(): Promise<
  (Product & { category: Category | null; total_stock: number })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*,categories(id,name,slug),product_variants(id,stock_quantity)")
    .order("created_at", { ascending: false });

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const variants = (row.product_variants as Record<string, unknown>[]) ?? [];
    return {
      ...(row as unknown as Product),
      category: (row.categories as unknown as Category) ?? null,
      total_stock: variants.reduce(
        (sum, v) => sum + toNumber(v.stock_quantity),
        0
      ),
    };
  });
}

export async function adminGetProduct(
  productId: string
): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*,categories(*),product_variants(*),product_images(*)")
    .eq("id", productId)
    .single();
  if (!data) return null;
  return {
    ...(data as unknown as ProductWithRelations),
    price: toNumber(data.price),
    compare_at_price: data.compare_at_price == null ? null : toNumber(data.compare_at_price),
    product_variants: ((data.product_variants as Record<string, unknown>[]) ?? []).map((v) => ({
      ...(v as unknown as ProductVariant),
      price: v.price == null ? null : toNumber(v.price),
      stock_quantity: toNumber(v.stock_quantity),
    })),
    category: data.categories as unknown as Category,
  };
}

export async function adminGetCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });
  return (data ?? []) as Category[];
}

export async function adminGetAddressesForUser(userId: string): Promise<Address[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  return (data ?? []) as Address[];
}

export type InventoryVariant = ProductVariant & {
  product_name: string;
  product_slug: string;
  active_product: boolean;
};

export async function adminListInventory(opts: {
  lowStock?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ variants: InventoryVariant[]; total: number; page: number; totalPages: number }> {
  const supabase = await createClient();
  const pageSize = opts.pageSize ?? 20;
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("product_variants")
    .select("*,products(name,slug,active)", { count: "exact" })
    .eq("active", true)
    .order("id", { ascending: false });

  if (opts.lowStock) {
    query = query.lte("stock_quantity", LOW_STOCK_THRESHOLD);
  }
  if (opts.search) {
    const term = `%${opts.search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    query = query.or(`products.name.ilike.${term},sku.ilike.${term}`);
  }

  const { data, count } = await query.range(from, from + pageSize - 1);

  const variants = ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const product = (row.products as { name: string; slug: string; active: boolean } | null) ?? null;
    const v = row as unknown as ProductVariant;
    return {
      ...v,
      stock_quantity: toNumber(v.stock_quantity),
      product_name: product?.name ?? "Unknown product",
      product_slug: product?.slug ?? "",
      active_product: product?.active ?? false,
    };
  });

  return {
    variants,
    total: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function adminSearchOrders(query: string): Promise<Order[]> {
  const supabase = await createClient();
  const q = query.trim();
  if (!q) return [];
  const term = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const { data } = await supabase
    .from("orders")
    .select("*")
    .or(`order_number.ilike.${term}`)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map(mapOrder);
}

export async function adminListUsers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,role,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []) as Profile[];
}
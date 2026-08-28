export type UserRole = "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  main_image: string | null;
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock_quantity: number;
  price: number | null;
  active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
}

export interface ProductWithRelations extends Product {
  product_variants: ProductVariant[];
  product_images: ProductImage[];
  category: Category | null;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  price_snapshot: number;
  size: string | null;
  color: string | null;
  quantity: number;
  subtotal: number;
  image_url_snapshot: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  shipping_address_snapshot: unknown;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  customer?: Pick<Profile, "full_name" | "email" | "phone"> | null;
}

/**
 * A hydrated, human-readable cart line used across the storefront UI.
 */
export interface CartLine {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  size: string | null;
  color: string | null;
  price: number;
  compareAtPrice: number | null;
  image: string;
  quantity: number;
  stock: number;
  active: boolean;
}

export interface CartLineInput {
  variantId: string;
  quantity: number;
}

export interface ShippingAddressInput {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
}

export interface OrderTimelineStep {
  key: OrderStatus;
  label: string;
  description: string;
}

export const ORDER_TIMELINE: OrderTimelineStep[] = [
  { key: "pending", label: "Order Placed", description: "We've received your order." },
  { key: "confirmed", label: "Confirmed", description: "Payment verified and order confirmed." },
  { key: "processing", label: "Processing", description: "Your items are being packed." },
  { key: "shipped", label: "Shipped", description: "Your order is on its way." },
  { key: "delivered", label: "Delivered", description: "Order delivered successfully." },
];

export type FieldErrors<T extends string = string> = Partial<
  Record<T, string[]>
>;

export interface ActionState<T extends string = string> {
  errors?: FieldErrors<T>;
  message?: string;
  success?: boolean;
  session?: boolean;
}
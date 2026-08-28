import { z } from "zod";

const name = z
  .string({ error: "Name is required" })
  .trim()
  .min(2, { error: "Name must be at least 2 characters" })
  .max(90, { error: "Name must be under 90 characters" });

export const signupSchema = z.object({
  full_name: name,
  email: z.email({ error: "Enter a valid email address" }).trim(),
  password: z
    .string({ error: "Password is required" })
    .min(8, { error: "Password must be at least 8 characters" })
    .max(1000),
});

export const loginSchema = z.object({
  email: z.email({ error: "Enter a valid email address" }).trim(),
  password: z.string({ error: "Password is required" }).min(1, { error: "Password is required" }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Enter a valid email address" }).trim(),
});

export const resetPasswordSchema = z.object({
  password: z
    .string({ error: "Password is required" })
    .min(8, { error: "Password must be at least 8 characters" }),
});

export const profileSchema = z.object({
  full_name: name,
  phone: z
    .string()
    .trim()
    .max(20, { error: "Phone number too long" })
    .optional()
    .or(z.literal("")),
});

export const addressSchema = z.object({
  full_name: name,
  phone: z
    .string({ error: "Phone is required" })
    .trim()
    .min(7, { error: "Enter a valid phone number" })
    .max(20),
  address_line_1: z
    .string({ error: "Address is required" })
    .trim()
    .min(4, { error: "Address must be at least 4 characters" })
    .max(255),
  address_line_2: z
    .string()
    .trim()
    .max(255)
    .optional()
    .or(z.literal("")),
  city: z.string({ error: "City is required" }).trim().min(2).max(90),
  state: z.string({ error: "State is required" }).trim().min(2).max(90),
  postal_code: z
    .string({ error: "Postal code is required" })
    .trim()
    .min(3)
    .max(10),
  country: z.string().trim().min(2).max(60).default("India"),
});

export const cartItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
});

export const checkoutItemsSchema = z.array(cartItemSchema).min(1, {
  error: "Your cart is empty",
});

export const productSchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(2).max(190),
  slug: z
    .string({ error: "Slug is required" })
    .trim()
    .min(2)
    .max(190)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: "Slug must be lowercase, hyphenated (e.g. slim-fit-jeans)",
    }),
  description: z.string().trim().max(10000).optional().or(z.literal("")),
  price: z.coerce.number({ error: "Price is required" }).positive(),
  compare_at_price: z.coerce.number().positive().optional().or(z.literal("")).or(z.literal(0)),
  category_id: z.string().uuid({ error: "Select a category" }),
  main_image: z.string().trim().max(2000).optional().or(z.literal("")),
  active: z.boolean(),
  featured: z.boolean(),
  variants: z.array(
    z.object({
      id: z.string().uuid().optional(),
      size: z.string().trim().max(20).optional().or(z.literal("")),
      color: z.string().trim().max(60).optional().or(z.literal("")),
      sku: z.string().trim().max(60).optional().or(z.literal("")),
      stock_quantity: z.coerce.number().int().min(0),
      price: z.coerce.number().positive().optional().or(z.literal("")),
      active: z.boolean(),
    })
  ),
  images: z.array(
    z.object({
      id: z.string().uuid().optional(),
      image_url: z.string().trim().max(2000),
      sort_order: z.number().int().min(0),
    })
  ),
});

export const categorySchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(2).max(120),
  slug: z
    .string({ error: "Slug is required" })
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: "Slug must be lowercase, hyphenated",
    }),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  image: z.string().trim().max(2000).optional().or(z.literal("")),
  active: z.boolean(),
});

/**
 * Converts a ZodError into a `FieldErrors` record for use in ActionState.
 */
export function fieldErrors<T extends string>(
  error: z.ZodError
): Partial<Record<T, string[]>> {
  const map: Partial<Record<T, string[]>> = {};
  for (const issue of error.issues) {
    const key = (issue.path.join(".") || "_root") as T;
    (map[key] ??= []).push(issue.message);
  }
  return map;
}
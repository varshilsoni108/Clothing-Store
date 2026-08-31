"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/db/helpers";
import { categorySchema, fieldErrors, productSchema } from "@/lib/validations";
import { generateSku } from "@/lib/utils";
import { restoreStockForOrder } from "@/lib/orders";
import type {
  OrderStatus,
  PaymentStatus,
  UserRole,
} from "@/lib/types";

type ActionResponse = {
  ok: boolean;
  error?: string;
  id?: string;
  data?: Partial<Record<string, string[]>>;
};

const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["pending", "processing", "cancelled"],
  processing: ["confirmed", "shipped", "cancelled"],
  shipped: ["processing", "delivered", "cancelled"],
  delivered: ["shipped", "returned"],
  cancelled: [],
  returned: [],
};

const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["paid", "failed"],
  paid: ["refunded"],
  failed: ["pending", "paid"],
  refunded: ["paid"],
};

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus
): Promise<ActionResponse> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,order_status")
    .eq("id", orderId)
    .single();

  if (!order) return { ok: false, error: "Order not found." };

  const allowedFrom = order.order_status as OrderStatus;
  if (!ALLOWED_STATUS_TRANSITIONS[allowedFrom]?.includes(nextStatus)) {
    return {
      ok: false,
      error: `Cannot change an order from "${allowedFrom}" to "${nextStatus}".`,
    };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ order_status: nextStatus })
    .eq("id", orderId);

  if (updateError) return { ok: false, error: "Could not update the order." };

  // Restore stock when an order is cancelled or returned.
  if (nextStatus === "cancelled" || nextStatus === "returned") {
    await restoreStockForOrder(orderId);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updatePaymentStatus(
  orderId: string,
  nextStatus: PaymentStatus
): Promise<ActionResponse> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,payment_status,order_status")
    .eq("id", orderId)
    .single();

  if (!order) return { ok: false, error: "Order not found." };

  const from = order.payment_status as PaymentStatus;
  if (!ALLOWED_PAYMENT_TRANSITIONS[from]?.includes(nextStatus)) {
    return {
      ok: false,
      error: `Cannot change payment from "${from}" to "${nextStatus}".`,
    };
  }

  const updates: Record<string, unknown> = { payment_status: nextStatus };
  if (nextStatus === "paid" && (order.order_status as string) === "pending") {
    updates.order_status = "confirmed";
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) return { ok: false, error: "Could not update payment status." };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}

export async function saveProduct(
  payload: unknown,
  productId?: string
): Promise<ActionResponse> {
  await requireAdmin();

  const parsed = productSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid product data.",
      data: fieldErrors(parsed.error),
    };
  }

  const d = parsed.data;

  // requireAdmin() has already verified the user.
  // Admin client avoids RLS failures for admin CRUD operations.
  const supabase = createAdminClient();

  const base = {
    name: d.name,
    slug: d.slug,
    description: d.description || null,
    price: d.price,
    compare_at_price: d.compare_at_price || null,
    category_id: d.category_id || null,
    main_image: d.main_image || d.images[0]?.image_url || null,
    active: d.active,
    featured: d.featured,
  };

  let savedId = productId;

  // --------------------------------------------------
  // CREATE / UPDATE PRODUCT
  // --------------------------------------------------

  if (productId) {
    const { error } = await supabase
      .from("products")
      .update({
        ...base,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) {
      console.error("Product update error:", error);

      return {
        ok: false,
        error: `Could not update the product: ${error.message}`,
      };
    }
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(base)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Product creation error:", error);

      return {
        ok: false,
        error: error
          ? `Could not create the product: ${error.message}`
          : "Could not create the product.",
      };
    }

    savedId = data.id as string;
  }

  if (!savedId) {
    return {
      ok: false,
      error: "Product ID was not created.",
    };
  }

  // --------------------------------------------------
  // VARIANTS
  // --------------------------------------------------

  const keptVariantIds: string[] = [];

  for (const v of d.variants) {
    const variantData = {
      size: v.size || null,
      color: v.color || null,
      sku:
        v.sku ||
        generateSku(
          d.name,
          v.size ?? null,
          v.color ?? null
        ),
      stock_quantity: v.stock_quantity,
      price: v.price || null,
      active: v.active,
    };

    if (v.id) {
      const { error } = await supabase
        .from("product_variants")
        .update(variantData)
        .eq("id", v.id)
        .eq("product_id", savedId);

      if (error) {
        console.error("Variant update error:", error);

        return {
          ok: false,
          error: `Could not update variant: ${error.message}`,
        };
      }

      keptVariantIds.push(v.id);
    } else {
      const { data: inserted, error } = await supabase
        .from("product_variants")
        .insert({
          product_id: savedId,
          ...variantData,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        console.error("Variant creation error:", error);

        return {
          ok: false,
          error: error
            ? `Could not create variant: ${error.message}`
            : "Could not create variant.",
        };
      }

      keptVariantIds.push(inserted.id as string);
    }
  }

  // Deactivate variants removed from the form.
  if (keptVariantIds.length > 0) {
    const { error } = await supabase
      .from("product_variants")
      .update({ active: false })
      .eq("product_id", savedId)
      .not("id", "in", `(${keptVariantIds.join(",")})`);

    if (error) {
      console.error("Variant cleanup error:", error);

      return {
        ok: false,
        error: `Could not update old variants: ${error.message}`,
      };
    }
  }

  // --------------------------------------------------
  // PRODUCT IMAGES
  // --------------------------------------------------

  const { error: deleteImagesError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", savedId);

  if (deleteImagesError) {
    console.error(
      "Product image cleanup error:",
      deleteImagesError
    );

    return {
      ok: false,
      error: `Could not update product images: ${deleteImagesError.message}`,
    };
  }

  if (d.images.length > 0) {
    const { error: imageInsertError } = await supabase
      .from("product_images")
      .insert(
        d.images.map((img, i) => ({
          product_id: savedId,
          image_url: img.image_url,
          sort_order: img.sort_order ?? i,
        }))
      );

    if (imageInsertError) {
      console.error(
        "Product image insert error:",
        imageInsertError
      );

      return {
        ok: false,
        error: `Could not save product images: ${imageInsertError.message}`,
      };
    }
  }

  // --------------------------------------------------
  // CACHE REFRESH
  // --------------------------------------------------

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  revalidatePath("/product");
  revalidatePath("/");

  return {
    ok: true,
    id: savedId,
  };
}

export async function deleteProduct(
  productId: string
): Promise<ActionResponse> {
  await requireAdmin();

  const supabase = createAdminClient();

  // 1. Make sure the product exists.
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return {
      ok: false,
      error: "Product not found.",
    };
  }

  // 2. Get all variants belonging to this product.
  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  if (variantsError) {
    return {
      ok: false,
      error: "Could not check the product variants.",
    };
  }

  const variantIds = (variants ?? []).map((v) => v.id as string);

  // 3. Check whether any of those variants have appeared in an order.
  let hasOrderHistory = false;

  if (variantIds.length > 0) {
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("id")
      .in("variant_id", variantIds)
      .limit(1);

    if (orderItemsError) {
      return {
        ok: false,
        error: "Could not check the product order history.",
      };
    }

    hasOrderHistory = (orderItems?.length ?? 0) > 0;
  }

  // 4. If the product has order history, NEVER hard-delete it.
  //    Keep it for historical orders and simply deactivate it.
  if (hasOrderHistory) {
    const { error: archiveError } = await supabase
      .from("products")
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (archiveError) {
      return {
        ok: false,
        error: "Could not archive the product.",
      };
    }

    // Also deactivate all its variants.
    if (variantIds.length > 0) {
      await supabase
        .from("product_variants")
        .update({ active: false })
        .in("id", variantIds);
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/shop");
    revalidatePath("/");

    return {
      ok: true,
    };
  }

  // 5. Product has never been ordered.
  //    Remove it completely.

  // Remove variants from carts first.
  if (variantIds.length > 0) {
    const { error: cartError } = await supabase
      .from("cart_items")
      .delete()
      .in("variant_id", variantIds);

    if (cartError) {
      return {
        ok: false,
        error: "Could not remove the product from carts.",
      };
    }
  }

  // Remove product images.
  const { error: imagesError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  if (imagesError) {
    return {
      ok: false,
      error: "Could not remove the product images.",
    };
  }

  // Remove variants.
  const { error: variantsDeleteError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);

  if (variantsDeleteError) {
    return {
      ok: false,
      error: "Could not remove the product variants.",
    };
  }

  // Finally remove the product itself.
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (deleteError) {
    return {
      ok: false,
      error: "Could not delete the product.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  revalidatePath("/");

  return {
    ok: true,
  };
}

export async function saveCategory(
  payload: unknown,
  categoryId?: string
): Promise<ActionResponse> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid category data.", data: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const admin = createAdminClient();
  const base = {
    name: d.name,
    slug: d.slug,
    description: d.description || null,
    image: d.image || null,
    active: d.active,
  };

  if (categoryId) {
    const { error } = await admin
      .from("categories")
      .update(base)
      .eq("id", categoryId);
    if (error) return { ok: false, error: "Could not update the category." };
  } else {
    const { data, error } = await admin
      .from("categories")
      .insert(base)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: "Could not create the category." };
    categoryId = data.id as string;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true, id: categoryId };
}

export async function deleteCategory(categoryId: string): Promise<ActionResponse> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);
  if (error) return { ok: false, error: "Could not delete the category." };

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  return { ok: true };
}

export async function updateVariantStock(
  variantId: string,
  stock: number
): Promise<ActionResponse> {
  await requireAdmin();

  if (!Number.isFinite(stock) || stock < 0) {
    return {
      ok: false,
      error: "Stock must be a valid number.",
    };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("product_variants")
    .update({
      stock_quantity: Math.floor(stock),
    })
    .eq("id", variantId);

  if (error) {
    console.error("Stock update error:", error);

    return {
      ok: false,
      error: `Could not update stock: ${error.message}`,
    };
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");

  return { ok: true };
}

export async function setUserRole(
  userId: string,
  role: UserRole
): Promise<ActionResponse> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { ok: false, error: "Could not update the user role." };

  revalidatePath("/admin/customers");
  revalidatePath("/admin/settings");
  return { ok: true };
}

/**
 * Uploads a product image to the public 'product-images' Supabase bucket
 * using the service-role client so RLS admin-only policies are satisfied.
 * Returns the public URL.
 */
export async function uploadProductImage(
  formData: FormData
): Promise<ActionResponse> {
  await requireAdmin();

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      error: "No file provided.",
    };
  }

  if (!file.type.startsWith("image/")) {
    return {
      ok: false,
      error: "Please upload an image file.",
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      ok: false,
      error: "Image must be under 5MB.",
    };
  }

  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-80);

  const ext =
    safeName.split(".").pop()?.toLowerCase() || "jpg";

  const folder = String(formData.get("folder") || "general")
    .replace(/\W/g, "_");

  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  try {
    const admin = createAdminClient();

    const { error: uploadError } = await admin.storage
      .from("product-images")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);

      return {
        ok: false,
        error: `Image upload failed: ${uploadError.message}`,
      };
    }

    const { data } = admin.storage
      .from("product-images")
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      return {
        ok: false,
        error: "Could not generate the image URL.",
      };
    }

    revalidatePath("/admin/products");

    return {
      ok: true,
      id: data.publicUrl,
    };
  } catch (error) {
    console.error("Product image upload exception:", error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not upload the image.",
    };
  }
}
import { adminGetCategories } from "@/lib/db/admin";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await adminGetCategories();
  return <ProductForm categories={categories} />;
}
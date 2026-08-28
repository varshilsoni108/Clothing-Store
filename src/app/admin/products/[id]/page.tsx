import { notFound } from "next/navigation";
import { adminGetCategories, adminGetProduct } from "@/lib/db/admin";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    adminGetProduct(id),
    adminGetCategories(),
  ]);
  if (!product) notFound();
  return <ProductForm categories={categories} initial={product} />;
}
import { adminGetCategories } from "@/lib/db/admin";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const categories = await adminGetCategories();
  return <CategoryManager categories={categories} />;
}
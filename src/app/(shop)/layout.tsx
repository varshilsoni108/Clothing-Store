import { getCategories } from "@/lib/db/products";
import { getOwnProfile, getSessionUser } from "@/lib/db/helpers";
import { StoreProviders } from "@/providers/store-providers";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const [user, categories] = await Promise.all([getSessionUser(), getCategories()]);
  const profile = user ? await getOwnProfile() : null;

  return (
    <StoreProviders
      user={user ? { id: user.id, email: user.email ?? "" } : null}
      profile={profile}
    >
      <div className="flex min-h-dvh flex-col">
        <Header categories={categories} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </StoreProviders>
  );
}
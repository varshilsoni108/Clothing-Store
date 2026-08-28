import type { Metadata } from "next";
import { AuthForm } from "@/components/store/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const redirectTo =
    typeof sp.next === "string" ? sp.next : undefined;

  return <AuthForm mode="login" redirectTo={redirectTo} />;
}
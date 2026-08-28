import type { Metadata } from "next";
import { AuthForm } from "@/components/store/auth-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return <AuthForm mode="reset-password" />;
}
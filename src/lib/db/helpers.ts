import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export function toNumber(value: unknown): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function escapeLike(input: string) {
  return input.replace(/[%_\\]/g, (m) => `\\${m}`);
}

export type SessionUser = {
  id: string;
  email: string | null;
};

/**
 * Returns the authenticated user, or null. Lightweight — used by layouts
 * and components that render for both guests and logged-in visitors.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
});

/**
 * Requires an authenticated user; redirects to /login otherwise.
 */
export const requireUser = cache(async (): Promise<SessionUser> => {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
});

/**
 * Returns the user's profile (own row) or null when logged out.
 */
export const getOwnProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data as Profile | null;
});

/**
 * Requires an admin role; redirects to home otherwise.
 */
export const requireAdmin = cache(async (): Promise<Profile> => {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");
  return profile;
});
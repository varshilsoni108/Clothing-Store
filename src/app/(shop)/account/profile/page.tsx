import type { Metadata } from "next";
import { getOwnProfile, requireUser } from "@/lib/db/helpers";
import { ProfileForm } from "@/components/account/profile-form";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getOwnProfile();

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-accent">Profile</h2>
      <div className="mt-6 max-w-lg rounded-2xl border border-line p-6">
        <ProfileForm initial={{ full_name: profile?.full_name ?? "", phone: profile?.phone ?? "" }} />
      </div>
      <p className="mt-4 text-xs text-muted">
        Member since {profile ? formatDate(profile.created_at) : "—"} · Email{" "}
        {user.email}
      </p>
    </div>
  );
}
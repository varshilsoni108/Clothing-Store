"use client";

import { createContext, useContext } from "react";
import type { Profile } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string;
}

const UserContext = createContext<{
  user: SessionUser | null;
  profile: Profile | null;
}>({ user: null, profile: null });

export function UserProvider({
  user,
  profile,
  children,
}: {
  user: SessionUser | null;
  profile: Profile | null;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user, profile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
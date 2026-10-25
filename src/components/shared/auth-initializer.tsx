"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import type { User } from "@prisma/client";

interface AuthInitializerProps {
  user: User | null;
}

export function AuthInitializer({ user }: AuthInitializerProps) {
  const initialized = useRef(false);
  const setUser = useAuthStore((state) => state.setUser);

  // Initialize store with server data on mount
  useEffect(() => {
    if (!initialized.current) {
      setUser(user);
      initialized.current = true;
    }
  }, [user, setUser]);

  // Keep store in sync if the server data changes via layout revalidation
  useEffect(() => {
    if (initialized.current) {
      setUser(user);
    }
  }, [user, setUser]);

  return null;
}

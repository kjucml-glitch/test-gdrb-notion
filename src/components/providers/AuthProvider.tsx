"use client";

import { useEffect } from "react";
import { onAuthChange, supabaseUserToUser } from "@/lib/supabase/auth";
import { useAuthStore } from "@/stores/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthChange((authUser) => {
      if (authUser) {
        setUser(supabaseUserToUser(authUser));
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return <>{children}</>;
}

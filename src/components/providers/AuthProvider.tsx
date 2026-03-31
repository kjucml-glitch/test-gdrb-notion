"use client";

import { useEffect } from "react";
import { onAuthChange, firebaseUserToUser } from "@/lib/firebase/auth";
import { useAuthStore } from "@/stores/authStore";
import { isConfigured } from "@/lib/firebase/config";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onAuthChange((fbUser) => {
      if (fbUser) {
        setUser(firebaseUserToUser(fbUser));
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return <>{children}</>;
}

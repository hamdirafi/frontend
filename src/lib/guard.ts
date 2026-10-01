"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Role, User } from "./api";
import { useAuth } from "./auth";

/**
 * Melindungi halaman: belum login -> /login, peran tidak sesuai -> /dashboard.
 * `ready` bernilai true hanya saat pengguna boleh melihat halaman.
 */
export function useRequireRole(roles?: Role[]): { user: User | null; ready: boolean } {
  const router = useRouter();
  const { user, loading } = useAuth();
  const allowed = !!user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace("/dashboard");
  }, [loading, user, allowed, router]);

  return { user, ready: !loading && allowed };
}
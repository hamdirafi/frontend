"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, ApiError, User } from "./api";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api<{ data: User }>("/me")
      .then((res) => {
        if (active) setUser(res.data);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Sesi habis di tengah pemakaian -> kosongkan status login (halaman terlindungi akan ke /login)
  useEffect(() => {
    const onUnauthenticated = () => setUser(null);
    window.addEventListener("auth:unauthenticated", onUnauthenticated);
    return () => window.removeEventListener("auth:unauthenticated", onUnauthenticated);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ data: User }>("/login", {
      method: "POST",
      body: { email, password },
    });
    setUser(res.data);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/logout", { method: "POST" });
    } catch (e) {
      // 401/419 = sesi memang sudah berakhir, artinya tujuan logout sudah tercapai
      if (!(e instanceof ApiError && (e.status === 401 || e.status === 419))) {
        throw e;
      }
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
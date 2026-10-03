"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type MenuItem = { label: string; href?: string };

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  panitia: "Panitia",
  peserta: "Peserta",
};

const ROLE_MENU: Record<Role, MenuItem[]> = {
  admin: [
    { label: "Semua kegiatan", href: "/events" },
    { label: "Buat kegiatan", href: "/events/new" },
    { label: "Scan QR absen", href: "/scan" },
    { label: "Kelola akun", href: "/admin/users" },
  ],
  panitia: [
    { label: "Kegiatan saya", href: "/events" },
    { label: "Buat kegiatan", href: "/events/new" },
    { label: "Scan QR absen", href: "/scan" },
  ],
  peserta: [
    { label: "Scan QR absen", href: "/scan" },
    { label: "Riwayat kehadiran", href: "/history" },
  ],
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function onLogout() {
    setBusy(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Memuat...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-700">Hadir.in</h1>
          <p className="mt-1 text-slate-600">
            Halo, <span className="font-semibold">{user.name}</span>
          </p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          {ROLE_LABEL[user.role]}
        </span>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Menu untuk {ROLE_LABEL[user.role]}
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {ROLE_MENU[user.role].map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="block rounded-xl bg-white p-4 text-sm font-medium shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-400"
                >
                  {item.label}
                </Link>
              ) : (
                <div className="rounded-xl bg-white p-4 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
                  {item.label} <span className="text-xs">(segera)</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <button
        onClick={onLogout}
        disabled={busy}
        className="mt-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60"
      >
        {busy ? "Keluar..." : "Keluar"}
      </button>
    </main>
  );
}
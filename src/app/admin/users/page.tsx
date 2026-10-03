"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loading, Shell } from "@/components/Shell";
import { btnPrimary, card, inputCls } from "@/components/ui";
import { api, ApiError, Role } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRequireRole } from "@/lib/guard";
import type { UserRow } from "@/lib/types";

const ROLES: { value: Role; label: string }[] = [
  { value: "peserta", label: "Peserta" },
  { value: "panitia", label: "Panitia" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsersPage() {
  const { ready } = useRequireRole(["admin"]);
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("peserta");
  const [identity, setIdentity] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ data: UserRow[] }>("/users");
      setUsers(res.data);
      setError(null);
    } catch {
      setError("Gagal memuat daftar akun.");
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  async function changeRole(id: number, newRole: Role) {
    setSavingId(id);
    setNotice(null);
    setError(null);
    try {
      await api(`/users/${id}/role`, { method: "PATCH", body: { role: newRole } });
      setNotice("Peran berhasil diubah.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal mengubah peran.");
    } finally {
      await load();
      setSavingId(null);
    }
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setFormErrors({});
    setNotice(null);
    setError(null);
    try {
      await api("/users", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          identity_number: identity.trim() || null,
        },
      });
      setNotice(`Akun ${email.trim()} berhasil dibuat.`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("peserta");
      setIdentity("");
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setFormErrors(err.errors ?? {});
      } else {
        setError(err instanceof ApiError ? err.message : "Gagal membuat akun.");
      }
    } finally {
      setCreating(false);
    }
  }

  const fieldError = (f: string) => formErrors[f]?.[0];

  if (!ready) return <Loading />;

  return (
    <Shell title="Kelola akun" back={{ href: "/dashboard", label: "Dashboard" }}>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}

      <details className={card}>
        <summary className="cursor-pointer text-sm font-semibold">+ Tambah akun</summary>
        <form onSubmit={create} className="mt-4 space-y-3">
          <div>
            <label htmlFor="u-name" className="block text-sm font-medium">Nama</label>
            <input id="u-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            {fieldError("name") && <p className="mt-1 text-xs text-red-600">{fieldError("name")}</p>}
          </div>
          <div>
            <label htmlFor="u-email" className="block text-sm font-medium">Email</label>
            <input id="u-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            {fieldError("email") && <p className="mt-1 text-xs text-red-600">{fieldError("email")}</p>}
          </div>
          <div>
            <label htmlFor="u-password" className="block text-sm font-medium">Password awal (minimal 8 karakter)</label>
            <input id="u-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
            {fieldError("password") && <p className="mt-1 text-xs text-red-600">{fieldError("password")}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="u-role" className="block text-sm font-medium">Peran</label>
              <select id="u-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputCls}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {fieldError("role") && <p className="mt-1 text-xs text-red-600">{fieldError("role")}</p>}
            </div>
            <div>
              <label htmlFor="u-identity" className="block text-sm font-medium">NIM / nomor anggota (opsional)</label>
              <input id="u-identity" maxLength={50} value={identity} onChange={(e) => setIdentity(e.target.value)} className={inputCls} />
              {fieldError("identity_number") && <p className="mt-1 text-xs text-red-600">{fieldError("identity_number")}</p>}
            </div>
          </div>
          <button type="submit" disabled={creating} className={btnPrimary}>
            {creating ? "Menyimpan..." : "Buat akun"}
          </button>
        </form>
      </details>

      <section className={`${card} mt-4`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Daftar akun {users ? `(${users.length})` : ""}
        </h2>
        {!users && !error && <p className="mt-3 text-sm text-slate-500">Memuat...</p>}
        {users && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Nama</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Identitas</th>
                  <th className="py-2">Peran</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = me?.id === u.id;
                  return (
                    <tr key={u.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 font-medium">
                        {u.name} {isMe && <span className="text-xs text-slate-400">(Anda)</span>}
                      </td>
                      <td className="py-2 pr-3">{u.email}</td>
                      <td className="py-2 pr-3">{u.identity_number ?? "-"}</td>
                      <td className="py-2">
                        <select
                          aria-label={`Peran ${u.name}`}
                          value={u.role}
                          disabled={isMe || savingId === u.id}
                          onChange={(e) => changeRole(u.id, e.target.value as Role)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-60"
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">Peran akun Anda sendiri tidak bisa diubah dari sini.</p>
      </section>
    </Shell>
  );
}
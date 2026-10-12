"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { btnPrimary, inputCls } from "@/components/ui";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [kode, setKode] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fieldError = (f: string) => errors[f]?.[0];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setGeneral(null);

    if (password !== confirm) {
      setErrors({ password_confirmation: ["Konfirmasi password tidak sama."] });
      return;
    }

    setBusy(true);
    try {
      await api("/register", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim(),
          identity_number: identity.trim() || null,
          password,
          password_confirmation: confirm,
          kode: kode.trim() || null,
        },
      });
      // Server sudah membuat sesi login; muat ulang penuh agar status login terbaca
      window.location.assign("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setErrors(err.errors ?? {});
      } else if (err instanceof ApiError && err.status === 429) {
        setGeneral("Terlalu banyak percobaan. Coba lagi sebentar lagi.");
      } else {
        setGeneral(err instanceof ApiError ? err.message : "Tidak dapat terhubung ke server.");
      }
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-indigo-700">Daftar akun</h1>
        <p className="mt-1 text-sm text-slate-500">Buat akun peserta untuk absen di kegiatan.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="r-name" className="block text-sm font-medium">Nama lengkap</label>
            <input id="r-name" required maxLength={255} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            {fieldError("name") && <p className="mt-1 text-xs text-red-600">{fieldError("name")}</p>}
          </div>
          <div>
            <label htmlFor="r-email" className="block text-sm font-medium">Email</label>
            <input id="r-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            {fieldError("email") && <p className="mt-1 text-xs text-red-600">{fieldError("email")}</p>}
          </div>
          <div>
            <label htmlFor="r-identity" className="block text-sm font-medium">NIM / nomor anggota (opsional)</label>
            <input id="r-identity" maxLength={50} value={identity} onChange={(e) => setIdentity(e.target.value)} className={inputCls} />
            {fieldError("identity_number") && <p className="mt-1 text-xs text-red-600">{fieldError("identity_number")}</p>}
          </div>
          <div>
            <label htmlFor="r-password" className="block text-sm font-medium">Password (minimal 8 karakter)</label>
            <input id="r-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
            {fieldError("password") && <p className="mt-1 text-xs text-red-600">{fieldError("password")}</p>}
          </div>
          <div>
            <label htmlFor="r-confirm" className="block text-sm font-medium">Ulangi password</label>
            <input id="r-confirm" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
            {fieldError("password_confirmation") && <p className="mt-1 text-xs text-red-600">{fieldError("password_confirmation")}</p>}
          </div>
          <div>
            <label htmlFor="r-kode" className="block text-sm font-medium">Kode pendaftaran (jika diminta panitia)</label>
            <input id="r-kode" autoComplete="off" value={kode} onChange={(e) => setKode(e.target.value)} className={inputCls} />
            {fieldError("kode") && <p className="mt-1 text-xs text-red-600">{fieldError("kode")}</p>}
          </div>

          {general && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{general}</p>
          )}

          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            {busy ? "Mendaftar..." : "Daftar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">Masuk</Link>
        </p>
      </div>
    </main>
  );
}
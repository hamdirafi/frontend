"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { Loading } from "@/components/Shell";
import { btnDanger, btnGhost } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useRequireRole } from "@/lib/guard";
import type { EventItem, QrToken } from "@/lib/types";

export default function QrPage() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useRequireRole(["admin", "panitia"]);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [token, setToken] = useState<QrToken | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sessionId = event?.active_session?.id ?? null;
  const isDev = process.env.NODE_ENV !== "production";

  const loadEvent = useCallback(async () => {
    try {
      const res = await api<{ data: EventItem }>(`/events/${id}`);
      setEvent(res.data);
    } catch {
      setError("Kegiatan tidak ditemukan atau bukan milikmu.");
    }
  }, [id]);

  // Data kegiatan (jumlah hadir, status sesi) diperbarui tiap 5 detik
  useEffect(() => {
    if (!ready) return;
    loadEvent();
    const timer = setInterval(loadEvent, 5000);
    return () => clearInterval(timer);
  }, [ready, loadEvent]);

  // Jam untuk animasi hitung mundur
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  // Ambil token baru tepat saat token lama habis (tiap 30 detik)
  useEffect(() => {
    if (!sessionId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        const res = await api<{ data: QrToken }>(`/sessions/${sessionId}/token`);
        if (stopped) return;
        setToken(res.data);
        setExpiresAt(Date.now() + res.data.expires_in * 1000);
        setError(null);
        timer = setTimeout(tick, res.data.expires_in * 1000 + 200);
      } catch (e) {
        if (stopped) return;
        if (e instanceof ApiError && e.code === "session_closed") {
          setToken(null);
          loadEvent();
          return;
        }
        setError("Gagal memuat QR. Mencoba lagi...");
        timer = setTimeout(tick, 3000);
      }
    }

    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [sessionId, loadEvent]);

  async function closeSession() {
    if (!sessionId) return;
    if (!window.confirm("Tutup sesi absen? Peserta tidak bisa scan lagi setelah ini.")) return;
    setBusy(true);
    try {
      await api(`/sessions/${sessionId}/close`, { method: "PATCH" });
      setToken(null);
      await loadEvent();
    } catch {
      setError("Gagal menutup sesi.");
    } finally {
      setBusy(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token.token);
    setNotice("Kode disalin");
    setTimeout(() => setNotice(null), 2000);
  }

  if (!ready) return <Loading />;

  if (!event) {
    return error ? (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        <Link href="/events" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">← Daftar kegiatan</Link>
      </main>
    ) : (
      <Loading />
    );
  }

  if (!sessionId) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">{event.title}</h1>
        <p className="mt-3 text-sm text-slate-500">Tidak ada sesi absen yang terbuka.</p>
        <Link href={`/events/${id}`} className={`${btnGhost} mt-6 inline-block`}>Kembali ke detail kegiatan</Link>
      </main>
    );
  }

  const remaining = Math.max(0, expiresAt - now);
  const total = (token?.window_seconds ?? 30) * 1000;
  const pct = Math.min(100, (remaining / total) * 100);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center px-4 py-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Scan untuk absen</p>
      <h1 className="mt-1 text-2xl font-bold">{event.title}</h1>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
        {token ? (
          <QRCodeSVG value={token.token} size={320} level="M" marginSize={1} />
        ) : (
          <div className="flex h-[320px] w-[320px] items-center justify-center text-sm text-slate-400">
            Memuat QR...
          </div>
        )}
      </div>

      <div className="mt-4 w-full max-w-xs">
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-600 transition-all duration-200" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-500">QR berganti dalam {Math.ceil(remaining / 1000)} detik</p>
      </div>

      <p className="mt-6 text-4xl font-bold text-indigo-700">{event.attendances_count ?? 0}</p>
      <p className="text-sm text-slate-500">orang sudah hadir</p>

      {error && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{error}</p>}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/events/${id}`} className={btnGhost}>Detail &amp; daftar hadir</Link>
        <button onClick={closeSession} disabled={busy} className={btnDanger}>Tutup sesi</button>
        {isDev && token && (
          <button onClick={copyToken} className={btnGhost}>
            {notice ?? "Salin kode (mode uji)"}
          </button>
        )}
      </div>
    </main>
  );
}
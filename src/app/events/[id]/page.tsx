"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loading, Shell } from "@/components/Shell";
import { btnDanger, btnGhost, btnPrimary, card } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, formatTime } from "@/lib/format";
import { useRequireRole } from "@/lib/guard";
import type { AttendanceRow, EventItem } from "@/lib/types";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready } = useRequireRole(["admin", "panitia"]);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ev, att] = await Promise.all([
        api<{ data: EventItem }>(`/events/${id}`),
        api<{ data: AttendanceRow[] }>(`/events/${id}/attendances`),
      ]);
      setEvent(ev.data);
      setRows(att.data);
      setError(null);
    } catch (e) {
      setError(
        e instanceof ApiError && (e.status === 403 || e.status === 404)
          ? "Kegiatan tidak ditemukan atau bukan milikmu."
          : "Gagal memuat data.",
      );
    }
  }, [id]);

  // Muat sekarang, lalu perbarui otomatis tiap 5 detik (daftar hadir real-time)
  useEffect(() => {
    if (!ready) return;
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [ready, load]);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  function openSession() {
    return act(async () => {
      await api(`/events/${id}/sessions`, { method: "POST" });
    });
  }

  function closeSession() {
    if (!event?.active_session) return;
    if (!window.confirm("Tutup sesi absen? Peserta tidak bisa scan lagi setelah ini.")) return;
    const sessionId = event.active_session.id;
    return act(async () => {
      await api(`/sessions/${sessionId}/close`, { method: "PATCH" });
    });
  }

  async function remove() {
    if (!window.confirm("Hapus kegiatan ini beserta seluruh data absensinya? Tindakan ini tidak bisa dibatalkan.")) return;
    setBusy(true);
    try {
      await api(`/events/${id}`, { method: "DELETE" });
      router.replace("/events");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menghapus kegiatan.");
      setBusy(false);
    }
  }

  if (!ready) return <Loading />;

  if (!event) {
    return error ? (
      <Shell title="Detail kegiatan" back={{ href: "/events", label: "Daftar kegiatan" }}>
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      </Shell>
    ) : (
      <Loading />
    );
  }

  const active = event.active_session;

  return (
    <Shell
      title={event.title}
      back={{ href: "/events", label: "Daftar kegiatan" }}
      actions={
        <div className="flex gap-2">
          <Link href={`/events/${id}/edit`} className={btnGhost}>Ubah</Link>
          <button onClick={remove} disabled={busy} className={btnDanger}>Hapus</button>
        </div>
      }
    >
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className={card}>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Mulai</dt>
            <dd className="font-medium">{formatDateTime(event.starts_at)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Selesai</dt>
            <dd className="font-medium">{formatDateTime(event.ends_at)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Lokasi</dt>
            <dd className="font-medium">{event.location ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Dibuat oleh</dt>
            <dd className="font-medium">{event.creator?.name ?? "-"}</dd>
          </div>
        </dl>
        {event.description && <p className="mt-4 text-sm text-slate-600">{event.description}</p>}
      </section>

      <section className={`${card} mt-4`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sesi absen</h2>
        {active ? (
          <div className="mt-3">
            <p className="text-sm">
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                Terbuka
              </span>{" "}
              sejak {formatTime(active.opens_at)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/events/${id}/qr`} className={btnPrimary}>Tampilkan QR</Link>
              <button onClick={closeSession} disabled={busy} className={btnDanger}>Tutup sesi</button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-slate-500">Sesi absen belum dibuka.</p>
            <button onClick={openSession} disabled={busy} className={`${btnPrimary} mt-3`}>
              {busy ? "Memproses..." : "Buka sesi absen"}
            </button>
          </div>
        )}
      </section>

      <section className={`${card} mt-4`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Daftar hadir ({rows.length})
        </h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Belum ada yang absen.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3">No</th>
                  <th className="py-2 pr-3">Nama</th>
                  <th className="py-2 pr-3">Identitas</th>
                  <th className="py-2 pr-3">Waktu</th>
                  <th className="py-2">Metode</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{i + 1}</td>
                    <td className="py-2 pr-3 font-medium">{r.user.name}</td>
                    <td className="py-2 pr-3">{r.user.identity_number ?? "-"}</td>
                    <td className="py-2 pr-3">{formatTime(r.scanned_at)}</td>
                    <td className="py-2">{r.method === "qr" ? "QR" : "Manual"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Shell>
  );
}
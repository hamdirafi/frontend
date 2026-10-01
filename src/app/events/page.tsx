"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loading, Shell } from "@/components/Shell";
import { btnPrimary, card } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useRequireRole } from "@/lib/guard";
import type { EventItem } from "@/lib/types";

export default function EventsPage() {
  const { user, ready } = useRequireRole(["admin", "panitia"]);
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    api<{ data: EventItem[] }>("/events")
      .then((res) => setEvents(res.data))
      .catch(() => setError("Gagal memuat daftar kegiatan."));
  }, [ready]);

  if (!ready) return <Loading />;

  return (
    <Shell
      title={user?.role === "admin" ? "Semua kegiatan" : "Kegiatan saya"}
      back={{ href: "/dashboard", label: "Dashboard" }}
      actions={<Link href="/events/new" className={btnPrimary}>+ Buat kegiatan</Link>}
    >
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!events && !error && <p className="text-sm text-slate-500">Memuat...</p>}
      {events && events.length === 0 && (
        <p className="text-sm text-slate-500">Belum ada kegiatan. Klik &quot;Buat kegiatan&quot; untuk memulai.</p>
      )}

      <ul className="space-y-3">
        {events?.map((ev) => (
          <li key={ev.id}>
            <Link href={`/events/${ev.id}`} className={`${card} block transition hover:ring-indigo-400`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{ev.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDateTime(ev.starts_at)}
                    {ev.location ? ` · ${ev.location}` : ""}
                  </p>
                  {user?.role === "admin" && ev.creator && (
                    <p className="mt-1 text-xs text-slate-400">Oleh {ev.creator.name}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {ev.active_session && (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      Sesi terbuka
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{ev.attendances_count ?? 0} hadir</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
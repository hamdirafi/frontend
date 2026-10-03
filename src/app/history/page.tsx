"use client";

import { useEffect, useState } from "react";
import { Loading, Shell } from "@/components/Shell";
import { card } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useRequireRole } from "@/lib/guard";
import type { HistoryRow } from "@/lib/types";

export default function HistoryPage() {
  const { ready } = useRequireRole();
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    api<{ data: HistoryRow[] }>("/me/attendances")
      .then((res) => setRows(res.data))
      .catch(() => setError("Gagal memuat riwayat kehadiran."));
  }, [ready]);

  if (!ready) return <Loading />;

  return (
    <Shell title="Riwayat kehadiran" back={{ href: "/dashboard", label: "Dashboard" }}>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!rows && !error && <p className="text-sm text-slate-500">Memuat...</p>}
      {rows && rows.length === 0 && (
        <p className="text-sm text-slate-500">Belum ada kehadiran yang tercatat.</p>
      )}
      {rows && rows.length > 0 && (
        <p className="mb-3 text-sm text-slate-500">Total {rows.length} kehadiran</p>
      )}

      <ul className="space-y-3">
        {rows?.map((r) => (
          <li key={r.id} className={card}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.event.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDateTime(r.event.starts_at)}
                  {r.event.location ? ` - ${r.event.location}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  Hadir
                </span>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(r.scanned_at)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
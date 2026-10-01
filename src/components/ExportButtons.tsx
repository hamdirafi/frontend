"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { btnGhost } from "./ui";

type Format = "xlsx" | "pdf";

export default function ExportButtons({
  eventId,
  disabled,
}: {
  eventId: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(format: Format) {
    setBusy(format);
    setError(null);
    try {
      await downloadFile(`/events/${eventId}/export?format=${format}`, `rekap-kehadiran.${format}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal mengunduh file.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          onClick={() => run("xlsx")}
          disabled={disabled || busy !== null}
          title={disabled ? "Belum ada data kehadiran" : "Unduh rekap Excel"}
          className={btnGhost}
        >
          {busy === "xlsx" ? "Menyiapkan..." : "Excel"}
        </button>
        <button
          onClick={() => run("pdf")}
          disabled={disabled || busy !== null}
          title={disabled ? "Belum ada data kehadiran" : "Unduh rekap PDF"}
          className={btnGhost}
        >
          {busy === "pdf" ? "Menyiapkan..." : "PDF"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
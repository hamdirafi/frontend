"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { Loading, Shell } from "@/components/Shell";
import { btnGhost, btnPrimary, card, inputCls } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useRequireRole } from "@/lib/guard";

type Result = { tone: "success" | "warn" | "error"; title: string; message: string };

const TITLE_BY_CODE: Record<string, string> = {
  invalid_token: "QR tidak valid",
  expired_token: "QR kedaluwarsa",
  session_closed: "Sesi sudah ditutup",
  already_attended: "Kamu sudah absen",
};

const TONE_CLASS: Record<Result["tone"], string> = {
  success: "bg-green-50 text-green-800 ring-green-200",
  warn: "bg-amber-50 text-amber-800 ring-amber-200",
  error: "bg-red-50 text-red-800 ring-red-200",
};

const TONE_ICON: Record<Result["tone"], string> = { success: "✅", warn: "⚠️", error: "❌" };

function QrScanner({ onDecoded }: { onDecoded: (text: string) => void }) {
  const handled = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      scanner = new Html5Qrcode("qr-reader");
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (w, h) => {
              const size = Math.floor(Math.min(w, h) * 0.8);
              return { width: size, height: size };
            },
          },
          (text) => {
            if (handled.current) return;
            handled.current = true;
            onDecoded(text);
          },
          () => {},
        );
        if (cancelled) await scanner.stop();
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        setCameraError(
          name === "NotAllowedError" || String(err).includes("Permission")
            ? "Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, lalu muat ulang halaman."
            : "Kamera tidak bisa dibuka. Pastikan perangkat punya kamera dan halaman dibuka lewat HTTPS (atau localhost).",
        );
      }
    })();

    return () => {
      cancelled = true;
      const s = scanner;
      if (s) {
        try {
          s.stop().then(() => s.clear()).catch(() => {});
        } catch {
          /* kamera memang belum berjalan */
        }
      }
    };
    // onDecoded sengaja tidak jadi dependency: scanner hanya dibuat sekali per tampilan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div id="qr-reader" className="w-full overflow-hidden rounded-xl bg-black" />
      {cameraError && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{cameraError}</p>
      )}
    </div>
  );
}

export default function ScanPage() {
  const { ready } = useRequireRole();
  const [result, setResult] = useState<Result | null>(null);
  const [sending, setSending] = useState(false);
  const [manual, setManual] = useState("");
  const isDev = process.env.NODE_ENV !== "production";

  async function submit(token: string) {
    setSending(true);
    try {
      const res = await api<{ message: string; data: { event: { id: number; title: string }; scanned_at: string } }>(
        "/attendance/scan",
        { method: "POST", body: { token } },
      );
      setResult({
        tone: "success",
        title: "Absen berhasil",
        message: `${res.data.event.title} · ${formatDateTime(res.data.scanned_at)}`,
      });
    } catch (e) {
      if (e instanceof ApiError) {
        setResult({
          tone: e.code === "already_attended" ? "warn" : "error",
          title: TITLE_BY_CODE[e.code ?? ""] ?? "Gagal absen",
          message: e.status === 429 ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi." : e.message,
        });
      } else {
        setResult({ tone: "error", title: "Gagal absen", message: "Tidak dapat terhubung ke server." });
      }
    } finally {
      setSending(false);
    }
  }

  if (!ready) return <Loading />;

  return (
    <Shell title="Scan QR absen" back={{ href: "/dashboard", label: "Dashboard" }}>
      {result ? (
        <div className={`rounded-xl p-6 text-center ring-1 ${TONE_CLASS[result.tone]}`}>
          <p className="text-4xl">{TONE_ICON[result.tone]}</p>
          <h2 className="mt-2 text-lg font-bold">{result.title}</h2>
          <p className="mt-1 text-sm">{result.message}</p>
          <button
            onClick={() => {
              setResult(null);
              setManual("");
            }}
            className={`${btnPrimary} mt-5`}
          >
            Scan lagi
          </button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-600">Arahkan kamera ke QR yang tampil di layar panitia.</p>
          <div className="relative">
            <QrScanner onDecoded={submit} />
            {sending && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 text-sm font-medium">
                Memproses...
              </div>
            )}
          </div>

          {isDev && (
            <details className={`${card} mt-6`}>
              <summary className="cursor-pointer text-sm font-medium">Mode uji: tempel kode manual</summary>
              <p className="mt-2 text-xs text-slate-500">
                Hanya muncul saat development. Salin kode dari layar QR panitia lalu tempel di sini.
              </p>
              <textarea
                rows={3}
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                className={inputCls}
                placeholder="Tempel kode QR..."
              />
              <button
                onClick={() => manual.trim() && submit(manual.trim())}
                disabled={sending || !manual.trim()}
                className={`${btnGhost} mt-2`}
              >
                Kirim kode
              </button>
            </details>
          )}
        </>
      )}
    </Shell>
  );
}
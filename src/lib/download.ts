import { ApiError } from "./api";

function filenameFrom(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Mengunduh file dari API (membawa cookie sesi) dan memicu penyimpanan di browser. */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const res = await fetch("/api" + path, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json, */*;q=0.8",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!res.ok) {
    let message = "Gagal mengunduh file.";
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      /* respons bukan JSON */
    }
    throw new ApiError(res.status, message);
  }

  const blob = await res.blob();
  const name = filenameFrom(res.headers.get("Content-Disposition")) ?? fallbackName;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
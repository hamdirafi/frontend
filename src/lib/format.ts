export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { timeStyle: "medium" }).format(
    new Date(iso),
  );
}

// ISO dari server -> nilai untuk <input type="datetime-local"> (jam lokal)
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Nilai <input type="datetime-local"> (jam lokal) -> ISO UTC untuk dikirim ke server
export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}
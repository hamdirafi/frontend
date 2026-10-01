"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api";
import { fromLocalInput, toLocalInput } from "@/lib/format";
import type { EventItem } from "@/lib/types";
import { btnGhost, btnPrimary, inputCls } from "./ui";

export type EventPayload = {
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
};

type Props = {
  initial?: EventItem;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (payload: EventPayload) => Promise<void>;
};

export default function EventForm({ initial, submitLabel, cancelHref, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startsAt, setStartsAt] = useState(initial ? toLocalInput(initial.starts_at) : "");
  const [endsAt, setEndsAt] = useState(initial ? toLocalInput(initial.ends_at) : "");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fieldError = (name: string) => errors[name]?.[0];

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneral(null);
    setErrors({});

    if (new Date(endsAt) <= new Date(startsAt)) {
      setErrors({ ends_at: ["Waktu selesai harus setelah waktu mulai."] });
      return;
    }

    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        starts_at: fromLocalInput(startsAt),
        ends_at: fromLocalInput(endsAt),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setErrors(err.errors ?? {});
      } else {
        setGeneral(err instanceof ApiError ? err.message : "Tidak dapat terhubung ke server.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handle} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">Nama kegiatan</label>
        <input id="title" required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        {fieldError("title") && <p className="mt-1 text-xs text-red-600">{fieldError("title")}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">Deskripsi (opsional)</label>
        <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
        {fieldError("description") && <p className="mt-1 text-xs text-red-600">{fieldError("description")}</p>}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium">Lokasi (opsional)</label>
        <input id="location" maxLength={255} value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
        {fieldError("location") && <p className="mt-1 text-xs text-red-600">{fieldError("location")}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="block text-sm font-medium">Mulai</label>
          <input id="starts_at" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
          {fieldError("starts_at") && <p className="mt-1 text-xs text-red-600">{fieldError("starts_at")}</p>}
        </div>
        <div>
          <label htmlFor="ends_at" className="block text-sm font-medium">Selesai</label>
          <input id="ends_at" type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
          {fieldError("ends_at") && <p className="mt-1 text-xs text-red-600">{fieldError("ends_at")}</p>}
        </div>
      </div>

      {general && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{general}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Menyimpan..." : submitLabel}</button>
        <Link href={cancelHref} className={btnGhost}>Batal</Link>
      </div>
    </form>
  );
}
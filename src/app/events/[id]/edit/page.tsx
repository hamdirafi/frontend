"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EventForm from "@/components/EventForm";
import { Loading, Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { useRequireRole } from "@/lib/guard";
import type { EventItem } from "@/lib/types";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready } = useRequireRole(["admin", "panitia"]);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    api<{ data: EventItem }>(`/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch(() => setError("Kegiatan tidak ditemukan atau bukan milikmu."));
  }, [ready, id]);

  if (!ready) return <Loading />;

  if (error) {
    return (
      <Shell title="Ubah kegiatan" back={{ href: "/events", label: "Daftar kegiatan" }}>
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      </Shell>
    );
  }

  if (!event) return <Loading />;

  return (
    <Shell title="Ubah kegiatan" back={{ href: `/events/${id}`, label: "Detail kegiatan" }}>
      <EventForm
        initial={event}
        submitLabel="Simpan perubahan"
        cancelHref={`/events/${id}`}
        onSubmit={async (payload) => {
          await api(`/events/${id}`, { method: "PUT", body: payload });
          router.replace(`/events/${id}`);
        }}
      />
    </Shell>
  );
}
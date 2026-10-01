"use client";

import { useRouter } from "next/navigation";
import EventForm from "@/components/EventForm";
import { Loading, Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { useRequireRole } from "@/lib/guard";
import type { EventItem } from "@/lib/types";

export default function NewEventPage() {
  const router = useRouter();
  const { ready } = useRequireRole(["admin", "panitia"]);

  if (!ready) return <Loading />;

  return (
    <Shell title="Buat kegiatan" back={{ href: "/events", label: "Daftar kegiatan" }}>
      <EventForm
        submitLabel="Simpan kegiatan"
        cancelHref="/events"
        onSubmit={async (payload) => {
          const res = await api<{ data: EventItem }>("/events", { method: "POST", body: payload });
          router.replace(`/events/${res.data.id}`);
        }}
      />
    </Shell>
  );
}
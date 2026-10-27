"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEventDate, formatSeats } from "@/lib/seats";
import { CITY_LABELS, TRACK_LABELS, type EventSummary } from "@/lib/types";

// TALLER, paso 5: esta tarjeta no necesita ser un Client Component. Auditoría de fronteras.
export function EventCard({ event }: { event: EventSummary }) {
  const [open, setOpen] = useState(false);
  const soldOut = event.seatsLeft === 0;
  return (
    <article
      aria-labelledby={`event-${event.id}`}
      className="flex h-full flex-col rounded-lg border border-stone-200 bg-white p-5"
    >
      <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">
        {TRACK_LABELS[event.track]}
      </p>
      <h2 id={`event-${event.id}`} className="mt-1 text-lg leading-snug font-bold">
        <Link href={`/events/${event.id}`} className="hover:text-teal-800 hover:underline">
          {event.title}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-zinc-700">{event.speaker}</p>
      <p className="mt-3 text-sm text-zinc-600">
        {formatEventDate(event.startsAt)} en {CITY_LABELS[event.city]}
      </p>
      <p className={`mt-3 text-sm font-semibold ${soldOut ? "text-red-700" : "text-emerald-800"}`}>
        {formatSeats(event.seatsLeft)}
      </p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mt-3 self-start text-sm font-medium text-zinc-800 underline"
      >
        {open ? "Ocultar descripción" : "Ver descripción"}
      </button>
      {open && <p className="mt-2 text-sm text-zinc-700">{event.description}</p>}
    </article>
  );
}

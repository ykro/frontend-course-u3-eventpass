import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";
import { getEventsRepository } from "@/lib/repository";
import { formatEventDate } from "@/lib/seats";
import { CITY_LABELS, TRACK_LABELS } from "@/lib/types";
import { registerAction } from "../actions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventsRepository().getEvent((await params).id);
  return { title: event ? event.title : "Evento no encontrado" };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventsRepository().getEvent(id);
  if (!event) notFound();

  return (
    <article aria-labelledby="event-title" className="max-w-2xl">
      <Link href="/events" className="text-sm font-medium text-teal-800 underline">
        Volver al catálogo
      </Link>
      <p className="mt-4 text-xs font-semibold tracking-wide text-teal-800 uppercase">
        {TRACK_LABELS[event.track]}
      </p>
      <h1 id="event-title" className="mt-1 text-3xl font-bold tracking-tight">
        {event.title}
      </h1>
      <p className="mt-2 text-zinc-700">
        {event.speaker}. {formatEventDate(event.startsAt)}, {event.venue}, {CITY_LABELS[event.city]}
        .
      </p>
      <p className="mt-4 text-zinc-800">{event.description}</p>
      <RegisterForm
        eventId={event.id}
        eventTitle={event.title}
        seatsLeft={event.seatsLeft}
        action={registerAction}
      />
    </article>
  );
}

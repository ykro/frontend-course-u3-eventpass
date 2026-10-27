import type { Metadata } from "next";
import type { SearchParams } from "@/lib/filters";

export const metadata: Metadata = { title: "Eventos" };

type Props = { searchParams: Promise<SearchParams> };

// TALLER, paso 2: conviértelo en un Server Component async que lea los eventos de
// getEventsRepository() y pinte un <EventCard> por evento.
// RETO: aplica los filtros de searchParams (parseEventFilters, filterEvents, FilterBar).
export default async function EventsPage(_props: Props) {
  return (
    <section aria-labelledby="catalog-title">
      <h1 id="catalog-title" className="text-3xl font-bold tracking-tight">
        Próximos eventos
      </h1>
      <p className="mt-2 text-zinc-700">Pendiente: taller, paso 2.</p>
    </section>
  );
}

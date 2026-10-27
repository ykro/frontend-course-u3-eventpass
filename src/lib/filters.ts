import type { City, EventSummary, Track } from "@/lib/types";

/** Filtros del catálogo. Viven en la URL (searchParams), no en useState. */
export type EventFilters = {
  q: string;
  track: Track | "todos";
  city: City | "todas";
  onlyAvailable: boolean;
};

export type SearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_FILTERS: EventFilters = {
  q: "",
  track: "todos",
  city: "todas",
  onlyAvailable: false,
};

export const MAX_QUERY_LENGTH = 60;

/** RETO: convierte los searchParams (texto sin validar) en filtros válidos; nunca lanza. */
export function parseEventFilters(_searchParams: SearchParams): EventFilters {
  return DEFAULT_FILTERS;
}

/** RETO: tema, ciudad, solo con lugares y búsqueda por título o ponente. */
export function filterEvents(
  events: readonly EventSummary[],
  _filters: EventFilters,
): EventSummary[] {
  return [...events];
}

/**
 * Ya viene hecho. URL compartible de una búsqueda: omite los valores por defecto,
 * codifica con URLSearchParams y usa siempre el orden q, tema, ciudad, disponibles.
 */
export function buildEventsHref(filters: EventFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.track !== "todos") params.set("tema", filters.track);
  if (filters.city !== "todas") params.set("ciudad", filters.city);
  if (filters.onlyAvailable) params.set("disponibles", "1");
  const query = params.toString();
  return query ? `/events?${query}` : "/events";
}

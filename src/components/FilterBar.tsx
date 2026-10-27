import Link from "next/link";
import { buildEventsHref, type EventFilters } from "@/lib/filters";
import { CITIES, CITY_LABELS, TRACKS, TRACK_LABELS } from "@/lib/types";

/**
 * Server Component: un formulario GET escribe los filtros en la URL. Funciona sin
 * JavaScript, se puede compartir y el botón Atrás del navegador lo respeta.
 */
export function FilterBar({ filters }: { filters: EventFilters }) {
  const active: { label: string; href: string }[] = [];
  if (filters.q)
    active.push({ label: `"${filters.q}"`, href: buildEventsHref({ ...filters, q: "" }) });
  if (filters.track !== "todos") {
    active.push({
      label: TRACK_LABELS[filters.track],
      href: buildEventsHref({ ...filters, track: "todos" }),
    });
  }
  if (filters.city !== "todas") {
    active.push({
      label: CITY_LABELS[filters.city],
      href: buildEventsHref({ ...filters, city: "todas" }),
    });
  }
  if (filters.onlyAvailable) {
    active.push({
      label: "Con lugares",
      href: buildEventsHref({ ...filters, onlyAvailable: false }),
    });
  }

  return (
    <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
      <form
        method="get"
        action="/events"
        role="search"
        aria-label="Filtrar eventos"
        className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end"
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          Buscar
          <input
            name="q"
            type="search"
            defaultValue={filters.q}
            maxLength={60}
            placeholder="Título o ponente"
            className="rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tema
          <select
            name="tema"
            defaultValue={filters.track === "todos" ? "" : filters.track}
            className="rounded-md border border-stone-300 bg-white px-3 py-2"
          >
            <option value="">Todos los temas</option>
            {TRACKS.map((track) => (
              <option key={track} value={track}>
                {TRACK_LABELS[track]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Ciudad
          <select
            name="ciudad"
            defaultValue={filters.city === "todas" ? "" : filters.city}
            className="rounded-md border border-stone-300 bg-white px-3 py-2"
          >
            <option value="">Todas las ciudades</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {CITY_LABELS[city]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium sm:pb-2">
          <input
            name="disponibles"
            type="checkbox"
            value="1"
            defaultChecked={filters.onlyAvailable}
          />
          Solo con lugares
        </label>
        <button
          type="submit"
          className="rounded-md bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900"
        >
          Filtrar
        </button>
      </form>
      {active.length > 0 && (
        <ul aria-label="Filtros activos" className="mt-3 flex flex-wrap gap-2 text-sm">
          {active.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-label={`Quitar el filtro ${item.label}`}
                className="inline-block rounded-full border border-teal-700 px-3 py-1 text-teal-900 hover:bg-teal-50"
              >
                {item.label} (quitar)
              </Link>
            </li>
          ))}
          <li>
            <Link href="/events" className="inline-block px-2 py-1 text-zinc-700 underline">
              Limpiar filtros
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

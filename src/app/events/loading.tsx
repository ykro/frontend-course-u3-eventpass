/** Next.js envuelve la página en <Suspense fallback={<Loading />}> mientras se resuelve. */
export default function Loading() {
  return (
    <section aria-busy="true">
      <p role="status" className="text-zinc-700">
        Cargando eventos...
      </p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <li
            key={n}
            className="h-48 animate-pulse rounded-lg border border-stone-200 bg-stone-100"
          />
        ))}
      </ul>
    </section>
  );
}

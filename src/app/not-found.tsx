import Link from "next/link";

export default function NotFound() {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-8">
      <h1 className="text-2xl font-bold">No encontramos esa página</h1>
      <p className="mt-2 text-zinc-700">El evento que buscas no existe o cambió de dirección.</p>
      <Link href="/events" className="mt-4 inline-block font-medium text-teal-800 underline">
        Ver todos los eventos
      </Link>
    </section>
  );
}

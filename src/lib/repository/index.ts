import "server-only";

import type { EventsRepository } from "./events-repository";
import { InMemoryEventsRepository } from "./in-memory";
import { seedEvents } from "./seed";

let repository: EventsRepository | null = null;

/**
 * Repositorio compartido por las páginas y las Server Actions. Vive en la memoria del
 * proceso: en Vercel cada instancia tiene su propia copia y se reinicia en frío.
 */
export function getEventsRepository(): EventsRepository {
  repository ??= new InMemoryEventsRepository(seedEvents());
  return repository;
}

/** Reemplaza el repositorio (pruebas o una implementación persistente). */
export function setEventsRepository(next: EventsRepository): void {
  repository = next;
}

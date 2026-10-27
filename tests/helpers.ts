import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { EventsRepository } from "@/lib/repository/events-repository";
import type { SeedEvent } from "@/lib/repository/in-memory";
import type { Attendee, EventSummary, ReserveResult } from "@/lib/types";

export const TEST_SECRET = "secreto-solo-para-pruebas";

export function formDataOf(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

/** Promesa que la prueba resuelve cuando quiere, para observar el estado pendiente. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Evento de prueba con valores por defecto; cada prueba cambia solo lo que le importa. */
export function makeEvent(overrides: Partial<SeedEvent> = {}): SeedEvent {
  return {
    id: "evento-prueba",
    title: "Evento de prueba",
    speaker: "Persona Ponente",
    track: "frontend",
    city: "guatemala",
    venue: "Sala 1",
    startsAt: "2027-05-01T09:00:00-06:00",
    capacity: 10,
    description: "Descripción de prueba.",
    ...overrides,
  };
}

/** Repositorio falso que responde lo que la prueba indique y registra las llamadas. */
export function fakeRepository(result: ReserveResult) {
  const calls: { eventId: string; attendee: Attendee }[] = [];
  const repository: EventsRepository = {
    async listEvents(): Promise<EventSummary[]> {
      return [];
    },
    async getEvent(): Promise<EventSummary | null> {
      return null;
    },
    async reserveSeat(eventId, attendee) {
      calls.push({ eventId, attendee });
      return result;
    },
  };
  return { repository, calls };
}

/** Lee un archivo de src/ (las pruebas corren desde la raíz del proyecto). */
export function readSource(path: string): string {
  return readFileSync(join(process.cwd(), "src", path), "utf8");
}

/** true si el archivo declara la directiva 'use client' (antes de cualquier import). */
export function isClientModule(code: string): boolean {
  return /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/.test(code);
}

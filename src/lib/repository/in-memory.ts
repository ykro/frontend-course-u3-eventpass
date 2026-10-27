import type { Attendee, EventRecord, EventSummary, ReserveResult } from "@/lib/types";
import type { EventsRepository } from "./events-repository";

export type SeedEvent = EventRecord & { attendees?: readonly Attendee[] };

type StoredEvent = { event: EventRecord; attendees: Attendee[] };

export class InMemoryEventsRepository implements EventsRepository {
  private readonly events = new Map<string, StoredEvent>();

  constructor(seed: readonly SeedEvent[]) {
    for (const { attendees = [], ...event } of seed) {
      this.events.set(event.id, {
        event: { ...event },
        attendees: [...attendees],
      });
    }
  }

  async listEvents(): Promise<EventSummary[]> {
    return [...this.events.values()]
      .map((stored) => this.toSummary(stored))
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  }

  async getEvent(id: string): Promise<EventSummary | null> {
    const stored = this.events.get(id);
    return stored ? this.toSummary(stored) : null;
  }

  async reserveSeat(eventId: string, attendee: Attendee): Promise<ReserveResult> {
    // RETO: hoy aparta el lugar sin verificar nada: vende de más y acepta correos repetidos.
    // Implementa las reglas del README (NOT_FOUND, ALREADY_REGISTERED, SOLD_OUT) de forma atómica.
    const stored = this.events.get(eventId);
    if (!stored) throw new Error("Pendiente (reto): responde NOT_FOUND.");
    stored.attendees.push({ name: attendee.name, email: attendee.email });
    return { ok: true, seatsLeft: stored.event.capacity - stored.attendees.length };
  }

  private toSummary({ event, attendees }: StoredEvent): EventSummary {
    return { ...event, seatsLeft: Math.max(0, event.capacity - attendees.length) };
  }
}

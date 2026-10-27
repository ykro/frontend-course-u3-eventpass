import type { Attendee, EventSummary, ReserveResult } from "@/lib/types";

/**
 * Puerto de datos de EventPass. La interfaz no sabe si los datos viven en memoria,
 * en Firestore o en Postgres: las páginas y las Server Actions solo conocen este contrato.
 */
export interface EventsRepository {
  /** Todos los eventos, ordenados por fecha de inicio ascendente. */
  listEvents(): Promise<EventSummary[]>;
  /** Un evento por id, o null si no existe. */
  getEvent(id: string): Promise<EventSummary | null>;
  /**
   * Aparta un lugar de forma atómica: verifica que el evento exista, que quede cupo y que
   * el correo (normalizado) no esté inscrito, y escribe, sin que otra reserva se intercale.
   */
  reserveSeat(eventId: string, attendee: Attendee): Promise<ReserveResult>;
}

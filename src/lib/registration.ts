import "server-only";

import type { EventsRepository } from "@/lib/repository/events-repository";
import type { RegisterState, ReserveResult } from "@/lib/types";

/** Dependencias inyectadas: en producción las arma actions.ts; en las pruebas, fakes. */
export type RegistrationDeps = {
  repository: EventsRepository;
  revalidate: (path: string) => void;
  ticketSecret: string;
};

export const VALIDATION_MESSAGE = "Revisa los datos marcados.";

export const REGISTER_ERROR_MESSAGES = {
  NOT_FOUND: "Ese evento no existe.",
  SOLD_OUT: "Ya no quedan lugares para este evento.",
  ALREADY_REGISTERED: "Ese correo ya está inscrito en este evento.",
} as const;

/** RETO: traduce el rechazo del repositorio al estado exacto que pide la guía del reto. */
export function rejectionToState(
  reason: Extract<ReserveResult, { ok: false }>["reason"],
): RegisterState {
  return { status: "error", code: reason, message: "No se pudo completar la inscripción." };
}

/**
 * TALLER, paso 3: valida el formulario con RegistrationSchema, aparta el lugar con
 * deps.repository.reserveSeat, revalida el catálogo y devuelve el estado para useActionState.
 */
export async function submitRegistration(
  _deps: RegistrationDeps,
  _prev: RegisterState,
  _formData: FormData,
): Promise<RegisterState> {
  return { status: "error", code: "VALIDATION", message: "Pendiente: taller, paso 3." };
}

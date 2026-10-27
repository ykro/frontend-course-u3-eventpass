"use client";

import { formatSeats } from "@/lib/seats";
import type { RegisterAction } from "@/lib/types";

type Props = {
  eventId: string;
  eventTitle: string;
  seatsLeft: number;
  /** Server Action que recibe el formulario; la página se la pasa como prop. */
  action: RegisterAction;
};

// TALLER, paso 4: conecta el formulario a la Server Action con useActionState.
// RETO: descuenta el lugar al instante con useOptimistic y respeta la respuesta del servidor.
export function RegisterForm({ eventId, eventTitle, seatsLeft, action: _action }: Props) {
  return (
    <form
      noValidate
      aria-label={`Inscripción a ${eventTitle}`}
      className="mt-6 space-y-4 rounded-lg border border-stone-200 bg-white p-6"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <p aria-live="polite" className="text-lg font-semibold text-emerald-800">
        {formatSeats(seatsLeft)}
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre completo
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={80}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-teal-800 px-4 py-2 font-semibold text-white hover:bg-teal-900"
      >
        Inscribirme
      </button>
    </form>
  );
}

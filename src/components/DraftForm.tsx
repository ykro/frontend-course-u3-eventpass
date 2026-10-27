"use client";

import { useActionState } from "react";
import { CITIES, CITY_LABELS, TRACKS, TRACK_LABELS, type DraftState } from "@/lib/types";

type Props = {
  action: (prev: DraftState, formData: FormData) => Promise<DraftState>;
  enabled: boolean;
};

export function DraftForm({ action, enabled }: Props) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" } as DraftState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form
      action={formAction}
      noValidate
      aria-label="Borrador de evento"
      className="mt-6 space-y-4 rounded-lg border border-stone-200 bg-white p-6"
    >
      {!enabled && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          El asistente está apagado en este servidor. Puedes ver el formulario, pero para generar
          borradores hay que configurar GEMINI_API_KEY.
        </p>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Título de la charla
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={90}
          aria-invalid={fieldErrors?.title ? true : undefined}
          className="rounded-md border border-stone-300 px-3 py-2"
        />
        {fieldErrors?.title && <p className="text-sm text-red-700">{fieldErrors.title[0]}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tema
          <select name="track" className="rounded-md border border-stone-300 bg-white px-3 py-2">
            {TRACKS.map((track) => (
              <option key={track} value={track}>
                {TRACK_LABELS[track]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Ciudad
          <select name="city" className="rounded-md border border-stone-300 bg-white px-3 py-2">
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {CITY_LABELS[city]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-teal-800 px-4 py-2 font-semibold text-white hover:bg-teal-900 disabled:bg-stone-400"
      >
        {isPending ? "Generando..." : "Sugerir descripción"}
      </button>
      {(state.status === "error" || state.status === "disabled") && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <div role="status" className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-semibold">Borrador sugerido por {state.model}</p>
          <p className="mt-2">{state.draft.description}</p>
          <p className="mt-2">Cupo sugerido: {state.draft.suggestedCapacity} personas.</p>
        </div>
      )}
    </form>
  );
}

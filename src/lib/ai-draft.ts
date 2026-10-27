import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { CITIES, CITY_LABELS, TRACKS, TRACK_LABELS, type DraftState } from "@/lib/types";

export const DraftRequestSchema = z.object({
  title: z
    .string({ error: "Escribe un título de 5 a 90 caracteres." })
    .trim()
    .min(5, "Escribe un título de 5 a 90 caracteres.")
    .max(90, "Escribe un título de 5 a 90 caracteres."),
  track: z.enum(TRACKS, { error: "Elige un tema de la lista." }),
  city: z.enum(CITIES, { error: "Elige una ciudad de la lista." }),
});

/** Lo que pedimos al modelo; se valida igual que cualquier entrada externa. */
export const EventDraftSchema = z.object({
  description: z.string().trim().min(20).max(400),
  suggestedCapacity: z.number().int().min(10).max(500),
});

/** Generador de texto inyectable: en las pruebas es un fake y nunca hay red. */
export type GenerateJson = (args: {
  apiKey: string;
  model: string;
  prompt: string;
}) => Promise<string>;

export type DraftDeps = { apiKey: string | null; model: string; generate?: GenerateJson };

export const DISABLED_MESSAGE =
  "El asistente con Gemini está apagado: configura GEMINI_API_KEY en el servidor para usarlo.";

/** Solicitudes al asistente por persona (IP) y por instancia en cada ventana. */
export const DRAFT_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };

export const RATE_LIMITED_MESSAGE =
  "Hiciste muchas solicitudes seguidas al asistente. Espera unos minutos e intenta de nuevo.";

/**
 * Límite simple por clave dentro de una instancia. `/organizar` es público y cada solicitud
 * gasta la cuota de tu GEMINI_API_KEY: sin límite, cualquiera podría agotarla. En producción
 * real iría en un almacén compartido (Redis, Firestore) o detrás de un inicio de sesión.
 */
export function createRateLimiter(
  max: number,
  windowMs: number,
  now: () => number = Date.now,
): (key: string) => boolean {
  const hits = new Map<string, number[]>();
  return (key) => {
    const at = now();
    const recent = (hits.get(key) ?? []).filter((time) => at - time < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    if (hits.size >= 1000) hits.clear();
    hits.set(key, [...recent, at]);
    return true;
  };
}

const generateWithGemini: GenerateJson = async ({ apiKey, model, prompt }) => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(EventDraftSchema),
    },
  });
  return response.text ?? "";
};

function buildPrompt(input: z.infer<typeof DraftRequestSchema>): string {
  return [
    "Eres el editor de EventPass, una plataforma de charlas técnicas en Guatemala.",
    "Escribe en español de Guatemala una descripción breve (máximo 400 caracteres),",
    "sin promesas exageradas ni emojis, y sugiere un cupo razonable.",
    `Título: ${input.title}`,
    `Tema: ${TRACK_LABELS[input.track]}`,
    `Ciudad: ${CITY_LABELS[input.city]}`,
  ].join("\n");
}

/** Power-up opcional: autocompleta la descripción de un evento con Gemini. */
export async function draftEventDescription(input: unknown, deps: DraftDeps): Promise<DraftState> {
  const parsed = DraftRequestSchema.safeParse(input);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return { status: "error", message: "Revisa los datos marcados.", fieldErrors };
  }
  if (!deps.apiKey) return { status: "disabled", message: DISABLED_MESSAGE };

  const generate = deps.generate ?? generateWithGemini;
  try {
    const raw = await generate({
      apiKey: deps.apiKey,
      model: deps.model,
      prompt: buildPrompt(parsed.data),
    });
    const draft = EventDraftSchema.safeParse(JSON.parse(raw));
    if (!draft.success) {
      return { status: "error", message: "La respuesta del modelo no tiene el formato esperado." };
    }
    return { status: "success", draft: draft.data, model: deps.model };
  } catch {
    // Nunca devolvemos el error crudo: podría incluir la petición o datos del proveedor.
    return { status: "error", message: "No se pudo generar la descripción. Intenta de nuevo." };
  }
}

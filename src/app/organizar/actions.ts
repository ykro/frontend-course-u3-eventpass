"use server";

import { headers } from "next/headers";
import {
  DRAFT_LIMIT,
  RATE_LIMITED_MESSAGE,
  createRateLimiter,
  draftEventDescription,
} from "@/lib/ai-draft";
import { getServerConfig } from "@/lib/config";
import type { DraftState } from "@/lib/types";

const allowDraft = createRateLimiter(DRAFT_LIMIT.max, DRAFT_LIMIT.windowMs);

/** Power-up opcional: la clave de Gemini se lee aquí, en el servidor, y nunca viaja al cliente. */
export async function draftEventAction(_prev: DraftState, formData: FormData): Promise<DraftState> {
  const config = getServerConfig();
  if (config.geminiApiKey) {
    // Una Server Action es un POST público: sin límite, cualquiera gasta la cuota de tu clave.
    const forwarded = (await headers()).get("x-forwarded-for") ?? "";
    const client = forwarded.split(",")[0]?.trim() || "sin-ip";
    if (!allowDraft(client)) return { status: "error", message: RATE_LIMITED_MESSAGE };
  }
  return draftEventDescription(
    {
      title: formData.get("title"),
      track: formData.get("track"),
      city: formData.get("city"),
    },
    { apiKey: config.geminiApiKey, model: config.geminiModel },
  );
}

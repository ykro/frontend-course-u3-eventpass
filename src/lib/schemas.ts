import { z } from "zod";

export const NAME_ERROR = "Escribe tu nombre (2 a 80 caracteres).";
export const EMAIL_ERROR = "Escribe un correo válido.";

/** Normaliza un correo para compararlo: sin espacios al borde y en minúsculas. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const RegistrationSchema = z.object({
  eventId: z.string().trim().min(1).max(100),
  name: z.string({ error: NAME_ERROR }).trim().min(2, NAME_ERROR).max(80, NAME_ERROR),
  email: z
    .string({ error: EMAIL_ERROR })
    .trim()
    .toLowerCase()
    .max(254, EMAIL_ERROR)
    .pipe(z.email({ error: EMAIL_ERROR })),
});

export type RegistrationInput = z.infer<typeof RegistrationSchema>;

import { createHmac } from "node:crypto";

/**
 * Código de boleto verificable: HMAC-SHA256 del evento y el correo con un secreto del
 * servidor. Quien conozca el secreto puede fabricar boletos, por eso nunca va al cliente.
 */
export function signTicket(secret: string, eventId: string, email: string): string {
  const digest = createHmac("sha256", secret)
    .update(`${eventId}:${email}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `EP-${digest.slice(0, 4)}-${digest.slice(4)}`;
}

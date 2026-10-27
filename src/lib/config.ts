import { randomBytes } from "node:crypto";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export const MISSING_SECRET_MESSAGE =
  "Falta TICKET_SIGNING_SECRET en este despliegue. Configúrala en Vercel (Settings > Environment Variables) para Production y Preview, y vuelve a desplegar.";

/** Variables de entorno (process.env o un objeto de prueba). */
export type Env = Readonly<Record<string, string | undefined>>;

export type ServerConfig = {
  /** owner/repo en minúsculas; "local" si no hay despliegue. */
  owner: string;
  /** SHA completo (40 hex) del commit desplegado; null en local. */
  commit: string | null;
  geminiApiKey: string | null;
  geminiModel: string;
};

let ephemeralSecret: string | null = null;

/** Entornos desplegados en Vercel: ahí el secreto es obligatorio. */
const DEPLOYED_ENVS = new Set(["production", "preview"]);

/**
 * Secreto que firma los códigos de boleto. Se lee en cada inscripción, nunca al importar
 * el módulo ni durante `next build`. En un despliegue (Production o Preview) sin secreto
 * falla: cada instancia serverless generaría su propia clave y un boleto firmado en una no
 * verificaría en otra, y un Preview también es una URL pública. Solo en local y en tests
 * (sin VERCEL_ENV) usa una clave aleatoria por proceso.
 */
export function getTicketSecret(env: Env = process.env): string {
  const configured = env.TICKET_SIGNING_SECRET?.trim();
  if (configured) return configured;
  if (DEPLOYED_ENVS.has(env.VERCEL_ENV ?? "")) throw new Error(MISSING_SECRET_MESSAGE);
  ephemeralSecret ??= randomBytes(32).toString("hex");
  return ephemeralSecret;
}

/** Prefiere el repositorio que Vercel conoce por Git; OWNER solo si no hay vínculo con Git. */
export function resolveOwner(env: Env): string {
  const owner = env.VERCEL_GIT_REPO_OWNER?.trim();
  const slug = env.VERCEL_GIT_REPO_SLUG?.trim();
  if (owner && slug) return `${owner}/${slug}`.toLowerCase();
  const explicit = env.OWNER?.trim().toLowerCase();
  if (explicit) return explicit;
  return "local";
}

/** SHA del commit: el que Vercel recibió de Git o el inyectado al desplegar con la CLI. */
export function resolveCommit(env: Env): string | null {
  for (const value of [env.VERCEL_GIT_COMMIT_SHA, env.COMMIT_SHA]) {
    const sha = value?.trim().toLowerCase();
    if (sha && /^[0-9a-f]{40}$/.test(sha)) return sha;
  }
  return null;
}

/** Se lee en cada petición (no al importar) para respetar las variables de Vercel. */
export function getServerConfig(env: Env = process.env): ServerConfig {
  return {
    owner: resolveOwner(env),
    commit: resolveCommit(env),
    geminiApiKey: env.GEMINI_API_KEY?.trim() || null,
    geminiModel: env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
  };
}

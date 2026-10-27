import { getServerConfig } from "@/lib/config";

// Siempre en tiempo de petición: owner y commit salen de las variables del despliegue.
export const dynamic = "force-dynamic";

export function GET(): Response {
  const { owner, commit } = getServerConfig();
  return Response.json(
    { status: "ok", owner, commit },
    { headers: { "Cache-Control": "no-store" } },
  );
}

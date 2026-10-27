// Demo de la unidad: en verde desde el starter. No se modifica.
import { GET } from "@/app/api/health/route";
import { DEFAULT_GEMINI_MODEL, getServerConfig } from "@/lib/config";
import {
  DISABLED_MESSAGE,
  DRAFT_LIMIT,
  createRateLimiter,
  draftEventDescription,
} from "@/lib/ai-draft";
import { DEFAULT_FILTERS, buildEventsHref } from "@/lib/filters";

describe("demo", () => {
  test("GET /api/health responde ok, el repositorio y el commit del despliegue", async () => {
    for (const name of ["OWNER", "VERCEL_GIT_REPO_OWNER", "VERCEL_GIT_REPO_SLUG"]) {
      vi.stubEnv(name, "");
    }
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
    vi.stubEnv("COMMIT_SHA", "");
    const local = GET();
    expect(local.status).toBe(200);
    expect(await local.json()).toEqual({ status: "ok", owner: "local", commit: null });

    // Con la CLI no hay vínculo con Git: valen OWNER y COMMIT_SHA (inyectado al desplegar).
    const sha = "3f2a9c1e7b4d5a6f8e9d0c1b2a3f4e5d6c7b8a90";
    vi.stubEnv("OWNER", "  Ana-Lopez/Mi-EventPass ");
    vi.stubEnv("COMMIT_SHA", sha.toUpperCase());
    expect(await GET().json()).toEqual({
      status: "ok",
      owner: "ana-lopez/mi-eventpass",
      commit: sha,
    });

    // Con Git, Vercel define VERCEL_GIT_*, que gana sobre lo escrito a mano.
    vi.stubEnv("VERCEL_GIT_REPO_OWNER", "AWA-2027-Galileo");
    vi.stubEnv("VERCEL_GIT_REPO_SLUG", "awa-frontend-u3-eventpass-Luis");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "no-es-un-sha");
    expect(await GET().json()).toEqual({
      status: "ok",
      owner: "awa-2027-galileo/awa-frontend-u3-eventpass-luis",
      commit: sha,
    });
  });

  test("el asistente con Gemini es opcional y en las pruebas nunca usa la red", async () => {
    const input = { title: "Accesibilidad en formularios", track: "frontend", city: "antigua" };
    expect(await draftEventDescription(input, { apiKey: null, model: "x" })).toEqual({
      status: "disabled",
      message: DISABLED_MESSAGE,
    });

    vi.stubEnv("GEMINI_MODEL", "");
    const model = getServerConfig().geminiModel;
    expect(model).toBe(DEFAULT_GEMINI_MODEL);
    expect(model).toBe("gemini-3.8-flash");

    const generate = vi.fn(async () =>
      JSON.stringify({
        description: "Cómo construir formularios que todas las personas puedan usar.",
        suggestedCapacity: 40,
      }),
    );
    const result = await draftEventDescription(input, { apiKey: "clave-falsa", model, generate });
    expect(result).toEqual({
      status: "success",
      model: "gemini-3.8-flash",
      draft: {
        description: "Cómo construir formularios que todas las personas puedan usar.",
        suggestedCapacity: 40,
      },
    });
    expect(generate).toHaveBeenCalledOnce();
  });

  test("buildEventsHref (ya hecho) arma una URL compartible sin valores por defecto", () => {
    expect(buildEventsHref(DEFAULT_FILTERS)).toBe("/events");
    expect(
      buildEventsHref({ q: "react", track: "frontend", city: "todas", onlyAvailable: true }),
    ).toBe("/events?q=react&tema=frontend&disponibles=1");
    expect(buildEventsHref({ ...DEFAULT_FILTERS, q: "C# & .NET", city: "antigua" })).toBe(
      "/events?q=C%23+%26+.NET&ciudad=antigua",
    );
  });

  test("el asistente limita las solicitudes por persona", () => {
    let now = 0;
    const allow = createRateLimiter(DRAFT_LIMIT.max, DRAFT_LIMIT.windowMs, () => now);
    for (let i = 0; i < DRAFT_LIMIT.max; i += 1) expect(allow("203.0.113.7")).toBe(true);
    expect(allow("203.0.113.7")).toBe(false);
    expect(allow("198.51.100.4")).toBe(true);
    now = DRAFT_LIMIT.windowMs;
    expect(allow("203.0.113.7")).toBe(true);
  });
});

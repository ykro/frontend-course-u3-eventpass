// Verificaciones de seguridad que corren DESPUÉS de `npm run build:probe` (ver package.json).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { NextRequest } from "next/server";
import nextConfig, { apiContentSecurityPolicy } from "../../next.config";
import { MISSING_SECRET_MESSAGE, getTicketSecret } from "../../src/lib/config";
import { buildContentSecurityPolicy } from "../../src/lib/csp";
import { proxy } from "../../src/proxy";

const ROOT = process.cwd();
const NEXT_DIR = join(ROOT, ".next");

function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

function probeValues(): string[] {
  const text = readFileSync(join(ROOT, "tests/security/probe.env"), "utf8");
  return text
    .split("\n")
    .filter((line) => /^(TICKET_SIGNING_SECRET|GEMINI_API_KEY)=/.test(line))
    .map((line) => line.slice(line.indexOf("=") + 1).trim());
}

/** Lo que el navegador puede descargar: JS/CSS estáticos y HTML/RSC prerenderizados. */
function clientVisibleFiles(): string[] {
  const staticFiles = filesUnder(join(NEXT_DIR, "static"));
  const prerendered = filesUnder(join(NEXT_DIR, "server", "app")).filter((path) =>
    /\.(html|rsc|body|meta)$/.test(path),
  );
  return [...staticFiles, ...prerendered];
}

const sourceFiles = filesUnder(join(ROOT, "src")).filter((path) => /\.(ts|tsx)$/.test(path));
const isClientModule = (code: string) =>
  /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/.test(code);

describe("secretos fuera del navegador", () => {
  test("existe un build de verificación (npm run build:probe)", () => {
    expect(existsSync(join(NEXT_DIR, "BUILD_ID")), "Ejecuta npm run build:probe primero").toBe(
      true,
    );
    expect(clientVisibleFiles().length).toBeGreaterThan(0);
  });

  test("ningún valor secreto del build aparece en lo que descarga el navegador", () => {
    const secrets = probeValues();
    expect(secrets).toHaveLength(2);
    const leaks = clientVisibleFiles().flatMap((path) => {
      const content = readFileSync(path, "utf8");
      return secrets.filter((secret) => content.includes(secret)).map(() => relative(ROOT, path));
    });
    expect(leaks).toEqual([]);
  });

  test("ningún archivo 'use client' importa módulos de servidor ni lee variables privadas", () => {
    const offenders = sourceFiles
      .filter((path) => isClientModule(readFileSync(path, "utf8")))
      .filter((path) => {
        const code = readFileSync(path, "utf8");
        return (
          /from\s+["'](@\/lib\/(config|tickets|registration|ai-draft|repository)|server-only|node:)/.test(
            code,
          ) || /process\.env\.(?!NEXT_PUBLIC_)/.test(code)
        );
      })
      .map((path) => relative(ROOT, path));
    expect(offenders).toEqual([]);
  });

  test("todo módulo que lee secretos del entorno importa server-only", () => {
    const offenders = sourceFiles
      .filter((path) =>
        /process\.env\.(TICKET_SIGNING_SECRET|GEMINI_API_KEY)|env\.(TICKET_SIGNING_SECRET|GEMINI_API_KEY)/.test(
          readFileSync(path, "utf8"),
        ),
      )
      .filter((path) => !/^import "server-only";/m.test(readFileSync(path, "utf8")))
      .map((path) => relative(ROOT, path));
    expect(offenders).toEqual([]);
  });

  test("no hay variables NEXT_PUBLIC_ con nombre de secreto", () => {
    const all = sourceFiles.map((path) => readFileSync(path, "utf8")).join("\n");
    expect(all).not.toMatch(/NEXT_PUBLIC_\w*(SECRET|KEY|TOKEN|PASSWORD)/);
  });
});

describe("superficie web", () => {
  test("ningún componente usa dangerouslySetInnerHTML", () => {
    const offenders = sourceFiles
      .filter((path) => readFileSync(path, "utf8").includes("dangerouslySetInnerHTML"))
      .map((path) => relative(ROOT, path));
    expect(offenders).toEqual([]);
  });

  test("next.config.ts envía cabeceras de seguridad en todas las rutas y cierra la API", async () => {
    const rules = await nextConfig.headers!();
    const headersOf = (source: string) =>
      Object.fromEntries(
        (rules.find((rule) => rule.source === source)?.headers ?? []).map((h) => [h.key, h.value]),
      );
    const all = headersOf("/:path*");
    expect(all["X-Content-Type-Options"]).toBe("nosniff");
    expect(all["X-Frame-Options"]).toBe("DENY");
    expect(all["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headersOf("/api/:path*")["Content-Security-Policy"]).toBe(apiContentSecurityPolicy);
    expect(apiContentSecurityPolicy).toContain("default-src 'none'");
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  test("proxy.ts fija una CSP con un nonce nuevo en cada petición", () => {
    const visit = () => proxy(new NextRequest("http://localhost:3000/events"));
    const nonceOf = (policy: string) => /'nonce-([^']+)'/.exec(policy)?.[1];
    const first = visit();
    const second = visit();
    const policy = first.headers.get("Content-Security-Policy") ?? "";
    const nonce = nonceOf(policy);
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]{20,}$/);
    expect(nonceOf(second.headers.get("Content-Security-Policy") ?? "")).not.toBe(nonce);
    // La petición que llega a Next.js lleva el mismo nonce para que lo ponga en sus scripts.
    expect(first.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
    for (const directive of [
      "default-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ]) {
      expect(policy).toContain(directive);
    }
    expect(policy).not.toMatch(/\*|https?:/);
  });

  test("en producción script-src y style-src no permiten 'unsafe-inline' ni 'unsafe-eval'", () => {
    const directive = (policy: string, name: string) =>
      policy.split("; ").find((part) => part.startsWith(`${name} `)) ?? "";
    const production = buildContentSecurityPolicy("abc123", false);
    for (const name of ["script-src", "style-src"]) {
      expect(directive(production, name)).toContain("'nonce-abc123'");
      expect(directive(production, name)).not.toMatch(/unsafe-inline|unsafe-eval/);
    }
    expect(directive(production, "script-src")).toContain("'strict-dynamic'");
    // En desarrollo React necesita eval para sus trazas; nunca 'unsafe-inline'.
    const development = buildContentSecurityPolicy("abc123", true);
    expect(directive(development, "script-src")).toContain("'unsafe-eval'");
    expect(development).not.toContain("unsafe-inline");
  });
});

describe("secreto de los boletos", () => {
  test("en un despliegue (Production o Preview) sin TICKET_SIGNING_SECRET falla", () => {
    for (const vercelEnv of ["production", "preview"]) {
      expect(() => getTicketSecret({ VERCEL_ENV: vercelEnv, TICKET_SIGNING_SECRET: " " })).toThrow(
        MISSING_SECRET_MESSAGE,
      );
      expect(() => getTicketSecret({ VERCEL_ENV: vercelEnv })).toThrow(MISSING_SECRET_MESSAGE);
      expect(getTicketSecret({ VERCEL_ENV: vercelEnv, TICKET_SIGNING_SECRET: " s3creto " })).toBe(
        "s3creto",
      );
    }
  });

  test("solo en local y en tests (sin VERCEL_ENV) usa una clave aleatoria estable", () => {
    const local = getTicketSecret({});
    expect(local).toMatch(/^[0-9a-f]{64}$/);
    expect(getTicketSecret({})).toBe(local);
  });
});

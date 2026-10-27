# SECURITY_AND_QUALITY.md (Unidad 3)

Marca cada casilla solo si lo verificaste en tu código y escribe en una línea cómo lo comprobaste (test, comando o archivo).

## Fronteras y secretos

- [ ] `'use client'` aparece solo en hojas interactivas; ninguna página ni layout la lleva. Evidencia:
- [ ] Los módulos que leen secretos o datos del servidor empiezan con `import "server-only";`. Evidencia:
- [ ] `npm run build:probe` y `npm run test:security` pasan: ningún secreto aparece en `.next/static`. Evidencia:
- [ ] Ninguna variable secreta usa `NEXT_PUBLIC_` y ningún secreto tiene un valor por defecto en el código; en un despliegue (Production o Preview), sin `TICKET_SIGNING_SECRET` la inscripción falla. Evidencia:
- [ ] Ningún secreto está en el repositorio, en `DEPLOYMENT.md` ni en capturas. Evidencia:

## Server Actions

- [ ] `registerAction` valida con Zod en el servidor; un POST sin pasar por el formulario recibe `VALIDATION`. Evidencia:
- [ ] Una inscripción exitosa revalida `/events` y `/events/<id>`; un rechazo no revalida. Evidencia:
- [ ] 12 reservas simultáneas para 3 lugares venden exactamente 3 (test propio o explicación). Evidencia:
- [ ] El mismo correo con otras mayúsculas o espacios no se inscribe dos veces. Evidencia:
- [ ] El asistente de `/organizar` (un POST público que gasta la cuota de `GEMINI_API_KEY`) tiene un límite de solicitudes por persona (`createRateLimiter` en `src/lib/ai-draft.ts`). Evidencia:

## Superficie web

- [ ] Ningún componente usa `dangerouslySetInnerHTML`; un título con HTML se muestra como texto. Evidencia:
- [ ] Las páginas llevan una CSP con nonce por petición, sin `'unsafe-inline'` ni `'unsafe-eval'` en `script-src`, además de `X-Content-Type-Options`, `X-Frame-Options` y `Referrer-Policy` (revisado en el navegador o con `curl -I`). Evidencia:
- [ ] Un `searchParams` inválido (`?tema=<script>`) muestra el catálogo completo, sin error. Evidencia:

## Calidad y despliegue

- [ ] `npm run verify` pasa en local. Evidencia:
- [ ] `DEPLOYMENT.md` tiene la URL de producción y `/api/health` devuelve mi repositorio en `owner` y, en `commit`, un commit que está en mi repositorio. Evidencia:

# AGENTS.md: reglas para asistentes de IA en EventPass

Este archivo es la base. Como parte de la entrega debes ampliarlo con al menos 3 reglas verificables propias del reto (sección 4) y explicar en `ARCHITECTURE_DECISIONS.md` qué cambió en las respuestas de tu asistente al usarlo.

## 1. Fronteras cliente y servidor (no negociable)

1. Todo componente es Server Component salvo que necesite hooks de React (`useState`, `useActionState`, `useOptimistic`), eventos del navegador (`onClick`) o APIs del navegador (`navigator`, `window`). `'use client'` va solo en esas hojas, nunca en una página ni en un layout.
2. Un archivo `'use client'` nunca importa `@/lib/config`, `@/lib/tickets`, `@/lib/registration`, `@/lib/ai-draft` ni `@/lib/repository`, y nunca lee `process.env`.
3. Todo módulo que lea un secreto o los datos del servidor empieza con `import "server-only";`.
4. Ninguna variable secreta lleva el prefijo `NEXT_PUBLIC_`. A un Client Component se le pasan datos ya decididos (por ejemplo un booleano `enabled`), nunca la clave.
5. Prohibido `dangerouslySetInnerHTML` y cualquier valor por defecto de un secreto escrito en el código.
6. La CSP de las páginas sale de `src/proxy.ts` con un nonce por petición. No agregues `'unsafe-inline'` ni `'unsafe-eval'` (este último solo existe en desarrollo) y no quites `dynamic = "force-dynamic"` del layout raíz: una página prerenderizada no tiene nonce.

## 2. Server Actions

1. Toda Server Action valida su entrada con Zod en el servidor (`safeParse`), aunque el formulario tenga `required`: cualquiera puede invocarla con un POST.
2. La lógica vive en una función pura con dependencias inyectadas (`submitRegistration(deps, prev, formData)`); el archivo `'use server'` solo arma las dependencias.
3. Los errores esperados se devuelven como estado (`{ status: "error", code, message }`), no se lanzan.
4. Toda mutación exitosa llama a `revalidatePath` para cada ruta que pinta los datos que cambió.

## 3. Verificación obligatoria antes de proponer un cambio

```bash
npm run verify
```

No modifiques `tests/*.test.ts(x)`, `tests/setup.ts`, `tests/helpers.ts`, `tests/security/`, la configuración (`package.json`, `next.config.ts`, `vitest.config.ts`, `eslint.config.js`) ni `.github/workflows/`.

## 4. Reglas del reto (complétalas tú)

<!-- Escribe aquí al menos 3 reglas verificables (comprobables en el código o con un test)
     que tu asistente debe respetar al trabajar en reserveSeat, RegisterForm y filters.ts:
     dónde no puede haber un await, de dónde sale la cifra de lugares, cómo se normaliza el
     correo, qué parámetros acepta la URL, etc. -->

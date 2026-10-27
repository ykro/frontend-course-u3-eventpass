# EventPass (Unidad 3)

Catálogo de charlas técnicas en Guatemala con inscripción en línea, construido con Next.js 16 (App Router), React 19, Server Components y Server Actions, y desplegado en Vercel.

## Puesta en marcha

En la raíz de tu repositorio (Node.js 24, ver `.nvmrc`):

```bash
npm ci
cp .env.example .env.local     # opcional en local; nunca subas .env.local
npm run dev
```

- Catálogo: `http://localhost:3000/events`. Detalle e inscripción: `http://localhost:3000/events/<id>`.
- Salud del despliegue: `http://localhost:3000/api/health` responde `{"status":"ok","owner":"local","commit":null}`. En Vercel, `owner` es tu repositorio y `commit` el SHA desplegado.
- Organizar (power-up opcional con Gemini): `http://localhost:3000/organizar`. Sin `GEMINI_API_KEY` el asistente queda apagado y la app funciona igual.
- Los datos viven en memoria (`InMemoryEventsRepository`): se reinician cada vez que arranca el servidor.

El codelab paso a paso, la guía de la unidad y la guía de despliegue en Vercel están en el material de la unidad.

## Verificación local

```bash
npm run verify
```

Corre, en orden: `typecheck` (`next typegen` y `tsc --noEmit`), `lint` (ESLint 10 con las reglas de Next.js, de los hooks de React y de TypeScript, sin advertencias), `format:check` (Prettier), `test` (Vitest), `build:probe` (`next build` con secretos canario) y `test:security` (busca esos secretos en lo que descarga el navegador y revisa la CSP con nonce, las cabeceras, las fronteras y que el secreto de los boletos no tenga valor por defecto en producción).

Estado inicial de `npm test`: `tests/demo.test.ts` en verde (4: salud del despliegue, power-up sin red, límite de solicitudes del power-up y `buildEventsHref`, que ya viene hecho), `tests/workshop.test.tsx` en rojo (11), `tests/challenge.test.tsx` en rojo (11) y `tests/student/` en rojo (2 plantillas). El proyecto compila (`typecheck`, `lint` y `build` en verde) desde el primer día.

## Mapa del trabajo

| Parte                                                    | Dónde                                                                                                                                            | Cuándo       |
| :------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| Taller, paso 1: arranque y recorrido                     | `src/lib/repository/`, `src/app/`                                                                                                                | En el taller |
| Taller, paso 2: catálogo con un Server Component async   | `src/app/events/page.tsx`                                                                                                                        | En el taller |
| Taller, paso 3: Server Action con Zod y `revalidatePath` | `src/lib/registration.ts` (`submitRegistration`)                                                                                                 | En el taller |
| Taller, paso 4: formulario con `useActionState`          | `src/components/RegisterForm.tsx`                                                                                                                | En el taller |
| Taller, paso 5: auditoría de fronteras y secretos        | `src/components/EventCard.tsx`, `src/lib/config.ts`, `src/lib/tickets.ts`                                                                        | En el taller |
| Despliegue guiado en Vercel                              | `DEPLOYMENT.md`                                                                                                                                  | En el taller |
| Reto autónomo                                            | `src/lib/repository/in-memory.ts`, `src/lib/registration.ts`, `src/components/RegisterForm.tsx`, `src/lib/filters.ts`, `src/app/events/page.tsx` | Tarea        |
| Tests propios                                            | `tests/student/my-scenarios.test.tsx`                                                                                                            | Tarea        |
| ADR y checklist                                          | `ARCHITECTURE_DECISIONS.md`, `SECURITY_AND_QUALITY.md`, `AGENTS.md`, `DEPLOYMENT.md`                                                             | Tarea        |

## Reto autónomo: inscripción confiable, optimista y filtros compartibles

Al terminar el taller la inscripción funciona, pero vende de más, acepta correos repetidos y el catálogo no se puede filtrar. El reto tiene tres partes. El contrato es exacto: los tests públicos y los ocultos lo verifican al pie de la letra.

### Parte A. Reglas de cupo en el servidor (`InMemoryEventsRepository.reserveSeat`)

1. **Orden de las reglas.** Si el evento no existe: `{ ok: false, reason: "NOT_FOUND" }`. Si el correo ya está inscrito en ese evento: `"ALREADY_REGISTERED"`, aunque el evento esté lleno. Si no quedan lugares: `"SOLD_OUT"`. Si todo está bien, guarda la inscripción y responde `{ ok: true, seatsLeft }` con los lugares que quedan después de reservar.
2. **Correo normalizado.** Dos correos son el mismo si coinciden tras quitar espacios al inicio y al final y pasar a minúsculas (usa `normalizeEmail` de `src/lib/schemas.ts`). La regla vale aunque quien llame no haya normalizado, y también para los asistentes sembrados en el constructor.
3. **Cupo.** Nunca hay más inscripciones que `capacity`; los asistentes sembrados cuentan.
4. **Atomicidad.** Si llegan N reservas a la vez (`Promise.all`), el resultado es el mismo que si llegaran una por una: nunca se vende de más ni se inscribe dos veces el mismo correo. JavaScript corre en un solo hilo, pero cada `await` cede el turno a otra petición: entre verificar y escribir no puede haber ninguno.

### Parte B. Del servidor a la pantalla: respuesta de la acción e inscripción optimista (`src/lib/registration.ts` y `src/components/RegisterForm.tsx`)

5. `rejectionToState(reason)` devuelve exactamente `{ status: "error", code: reason, message }` con el mensaje de `REGISTER_ERROR_MESSAGES`, y para `SOLD_OUT` agrega `seatsLeft: 0`. Ningún otro rechazo lleva `seatsLeft`.
6. **Revalidación.** Solo una inscripción exitosa revalida, y revalida dos rutas: `/events` y `/events/<eventId>`. Un rechazo o un error de validación no revalida nada.
7. **Optimismo.** Al enviar, el contador muestra un lugar menos al instante (`useOptimistic`) y aparece un `role="status"` con el texto `Apartando tu lugar...` mientras la acción está pendiente. Con un solo lugar, el contador optimista muestra `Agotado`.
8. **Verdad del servidor.** Cuando la acción termina, el contador muestra los lugares que informó el servidor (`state.seatsLeft` en éxito o en `SOLD_OUT`); si el rechazo no trae `seatsLeft`, vuelve al valor que recibió la página (rollback). Con 0 lugares, el botón dice `Agotado` y queda deshabilitado.
9. Usa `formatSeats` (`src/lib/seats.ts`) para el texto: `Quedan 3 lugares`, `Queda 1 lugar`, `Agotado`.

### Parte C. Filtros en la URL (`src/lib/filters.ts` y `src/app/events/page.tsx`)

`buildEventsHref(filters)` ya viene hecho: arma la URL compartible de una búsqueda, omite los valores por defecto y usa siempre el orden `q`, `tema`, `ciudad`, `disponibles` (sin filtros devuelve `/events`). `FilterBar` y `CopyLinkButton` también están hechos.

10. `parseEventFilters(searchParams)` nunca lanza. Parámetros: `q` (texto, sin espacios al borde, máximo `MAX_QUERY_LENGTH` = 60 caracteres), `tema` (uno de `frontend`, `backend`, `movil`, `ia`, `nube`; si no, `"todos"`), `ciudad` (uno de `guatemala`, `antigua`, `quetzaltenango`; si no, `"todas"`) y `disponibles` (solo `"1"` activa el filtro). Si un parámetro viene repetido, cuenta el primer valor.
11. `filterEvents(events, filters)` conserva el orden y combina todas las condiciones: tema, ciudad, solo eventos con lugares y búsqueda de `q` en el título o en el ponente, sin distinguir mayúsculas ni tildes (`programacion` encuentra `Programación`).
12. La página `/events` lee `searchParams` (una promesa), aplica los filtros en el servidor y muestra `FilterBar` con los filtros leídos, un contador `1 evento` o `N eventos`, el botón `CopyLinkButton` con la URL de `buildEventsHref` y, si no hay resultados, el texto `Ningún evento coincide con tus filtros.`

### Tests propios (`tests/student/`)

Escribe al menos 2 tests nuevos (unos 45 minutos). Tus tests propios suman si pasan contra la solución de referencia y detectan mutantes que la suite pública no detecta (errores sembrados en el reto). Reescribir un test público no suma. Los errores sembrados se agrupan por concepto: varios errores del mismo concepto cuentan como uno, así que dos tests que atrapan el mismo concepto valen la mitad. Para el puntaje completo, detecta errores de 2 conceptos distintos del reto. Un test que no puede fallar no detecta nada. Puedes usar los ayudantes de `tests/helpers.ts`; no leas archivos ni uses la red.

### Carga estimada

Reto de 2 a 3 horas, más unos 45 minutos de tests propios y 45 minutos de documentos (ADR, checklist, `AGENTS.md` y `DEPLOYMENT.md`). En total, de 3 h 30 min a 4 h 30 min (270 minutos como máximo). El despliegue no se suma: lo haces en el codelab.

## Rúbrica (100 puntos)

| Componente           | Puntos | Cómo se mide                                                                                                                                                                          |
| :------------------- | -----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Taller guiado        |     20 | `tests/workshop.test.tsx`, proporcional                                                                                                                                               |
| Reto, tests públicos |     10 | `tests/challenge.test.tsx`, proporcional                                                                                                                                              |
| Reto, tests ocultos  |     25 | tests ocultos con más bordes y datos distintos, proporcional                                                                                                                          |
| Tests propios        |     10 | pasan contra la referencia y detectan mutantes que la suite pública no detecta; los errores sembrados se agrupan por concepto: 2 conceptos distintos detectados = completo, 1 = mitad |
| Despliegue (Vercel)  |     10 | `DEPLOYMENT.md` con la URL de producción; `GET /api/health` responde 200 con `"owner"` igual a tu repositorio y `"commit"` igual a un commit de tu repositorio                        |
| ADR y checklist      |     15 | revisión manual: ADR 10, checklist `SECURITY_AND_QUALITY.md` 2, sección propia de `AGENTS.md` 2 y declaración de uso de IA 1                                                          |
| Calidad e integridad |     10 | `typecheck`, `lint` y `format:check` limpios (5) + sin sospechas de integridad (5)                                                                                                    |

La CI de GitHub es retroalimentación, no la nota. El calificador del curso trabaja sobre una copia limpia: los tests oficiales, `tests/setup.ts`, `tests/helpers.ts`, `package.json`, `package-lock.json` y la configuración salen de su copia, y además corre tests ocultos. Modificar tests oficiales o workflows, que el código de `src/` lea archivos, ejecute procesos, use `eval` o importe módulos dinámicamente, o consulte si está corriendo en una prueba, se reporta como sospecha de integridad.

<!-- texto-escaner:inicio (generado por scripts/texto_escaner.py; no editar a mano) -->

### Qué marca el escáner del calificador

El calificador revisa tu código y tus tests antes de correrlos. Si encuentra algo de esta lista, tu nota queda **retenida** hasta que el docente la revise: no pierdes puntos automáticamente, pero tampoco se publica. Nada de esto hace falta para resolver los retos.

**Por qué existe.** Tus tests corren en la misma máquina que los tests ocultos. Lo que se marca es lo que permitiría leer esos tests, cambiar el resultado de las pruebas o salir a internet desde el calificador.

**En este proyecto (TypeScript).**

- Se marca: importar módulos de Node con acceso al sistema (`fs`, `child_process`, `os`, `net`, `http`, `vm`, `worker_threads`…; sí puedes `crypto`, `path`, `url`, `util`, `events`, `buffer`, `assert`, `timers`); `import()` o `require()` con un nombre calculado; `eval` y `Function()`; `process.argv`, `process.exit`, `process.binding`, `process.env[nombre calculado]`; `globalThis`, `window` o `process` indexados con un nombre calculado; `__proto__` y `constructor.constructor`; en `src/`, mencionar el runner (`vitest`, `junit`, `AWA_`, `afterAll(`), también armado por partes; en tests, `process.cwd`, `__dirname`, `import.meta.url`.
- Sí puedes unir textos (`"btn " + "primary"`), usar rutas como `/sitemap.xml` y `window["dataLayer"]`.

**En todos los proyectos** se marca además: modificar o borrar archivos oficiales, agregar archivos fuera de tus carpetas, enlaces simbólicos, y archivos como `sitecustomize.py`, `pytest.ini`, `init.gradle` o `.npmrc`. Y tus tests deben dar siempre el mismo resultado: un test que falla al azar no cuenta.

<!-- texto-escaner:fin -->

## Rutas

| Ruta               | Tipo             | Notas                                                     |
| :----------------- | :--------------- | :-------------------------------------------------------- |
| `/events`          | Server Component | Catálogo; filtros en `searchParams` (reto)                |
| `/events/[id]`     | Server Component | Detalle; `RegisterForm` es la hoja cliente                |
| `/organizar`       | Server Component | Power-up opcional con Gemini                              |
| `/api/health`      | Route Handler    | `{"status":"ok","owner":"<owner/repo>","commit":"<sha>"}` |
| `registerAction`   | Server Action    | `src/app/events/actions.ts`, POST que genera Next.js      |
| `draftEventAction` | Server Action    | `src/app/organizar/actions.ts`                            |

## Variables de entorno

| Variable                | Dónde                                              | Para qué                                                                                                                                                                                                          |
| :---------------------- | :------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TICKET_SIGNING_SECRET` | Vercel (Production y Preview), secreta             | Firma los códigos de boleto. En todo despliegue es obligatoria: sin ella la inscripción falla con un error claro. Solo en tu computadora y en los tests (sin `VERCEL_ENV`) se usa una clave aleatoria por proceso |
| `OWNER`                 | Vercel (Production), solo si despliegas con la CLI | `owner/repo` en minúsculas. Si Vercel conoce el repositorio por Git, `/api/health` usa `VERCEL_GIT_REPO_OWNER/VERCEL_GIT_REPO_SLUG` y la ignora                                                                   |
| `COMMIT_SHA`            | Al desplegar con la CLI (`--env COMMIT_SHA=...`)   | SHA del commit desplegado. Con Git, Vercel define `VERCEL_GIT_COMMIT_SHA`, que tiene prioridad                                                                                                                    |
| `GEMINI_API_KEY`        | Opcional, secreta                                  | Enciende el asistente de `/organizar`, con un límite de 5 solicitudes por persona cada 10 minutos (es un POST público que gasta tu cuota)                                                                         |
| `GEMINI_MODEL`          | Opcional                                           | Modelo de Gemini; por defecto `gemini-3.8-flash`                                                                                                                                                                  |

Ninguna lleva el prefijo `NEXT_PUBLIC_`: todo lo que empieza así se copia al JavaScript que descarga el navegador.

### Por qué el secreto de los boletos no tiene valor por defecto

`getTicketSecret` (`src/lib/config.ts`) se lee en cada inscripción, no al importar el módulo ni durante `next build`. Si falta en un despliegue (`VERCEL_ENV` igual a `"production"` o `"preview"`), lanza un error en lugar de inventar una clave: en serverless puede haber varias instancias a la vez y cada una generaría la suya, así que un boleto firmado en una instancia no verificaría en otra, y la falla pasaría inadvertida. Un Preview también es una URL pública, así que configura el secreto en Vercel para Production y Preview. En local y en los tests, sin `VERCEL_ENV` ni la variable, se usa una clave aleatoria que dura lo que dura el proceso: los códigos cambian al reiniciar, lo cual no importa para aprender. Lo discutes en el ADR-3.

## Seguridad de las páginas

`src/proxy.ts` corre antes de cada página, genera un nonce aleatorio y fija la cabecera `Content-Security-Policy` con `script-src 'self' 'nonce-...' 'strict-dynamic'`, sin `'unsafe-inline'` ni `'unsafe-eval'` en producción. Next.js lee ese nonce y lo pone en sus propios scripts; un script o un atributo `onerror` inyectado no lo tiene y el navegador lo bloquea. Por eso el layout raíz declara `dynamic = "force-dynamic"`: una página prerenderizada en el build no tendría nonce. `next.config.ts` agrega `nosniff`, `X-Frame-Options`, `Referrer-Policy` y una CSP cerrada para `/api`. No debilites la política: `npm run test:security` la revisa.

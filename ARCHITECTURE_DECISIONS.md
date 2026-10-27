# ARCHITECTURE_DECISIONS.md (Unidad 3)

Responde cada pregunta con tus palabras, en 3 a 8 líneas, citando archivos o funciones de tu código. Se califica con criterio técnico, no con extensión. Este documento vale 15 puntos: el ADR (ADR-1 a ADR-5) 10, el checklist `SECURITY_AND_QUALITY.md` 2, tu sección de `AGENTS.md` junto con el ADR-6 2 y la declaración de uso de IA 1.

## ADR-1: Qué componentes llevan 'use client' y cuáles no

**Pregunta.** Haz una tabla con cada componente de `src/components/` y cada página de `src/app/`, di si es Server o Client Component y la razón concreta (qué hook, evento o API del navegador lo obliga). ¿Por qué `EventCard` y `FilterBar` no llevan la directiva? ¿Qué se pierde si se pone `'use client'` en `src/app/events/page.tsx`?

**Respuesta.**

## ADR-2: Atomicidad de la reserva

**Pregunta.** JavaScript corre en un solo hilo. Entonces, ¿cómo puede venderse de más un evento si `reserveSeat` consulta los lugares y luego escribe? Explica cómo lo evita tu implementación y qué harías si los datos vivieran en Firestore o Postgres con varias instancias.

**Respuesta.**

## ADR-3: Datos en memoria en Vercel

**Pregunta.** Tu repositorio guarda las inscripciones en la memoria del proceso. ¿Qué pasa con ellas en Vercel cuando la función se enfría o cuando hay dos instancias a la vez? Propón un almacén compartido concreto y su costo o desventaja. El mismo problema de instancias explica por qué `getTicketSecret` falla en todo despliegue (Production y Preview) si falta `TICKET_SIGNING_SECRET` en lugar de usar una clave aleatoria: ¿qué le pasaría a un boleto firmado en una instancia y verificado en otra, por qué un Preview no es excepción y por qué en local sí se acepta la clave efímera?

**Respuesta.**

## ADR-4: Filtros en searchParams y no en useState

**Pregunta.** ¿Qué ganamos al guardar los filtros en la URL en lugar de un `useState`? Da al menos tres ventajas y una desventaja o riesgo, y cómo lo maneja tu `parseEventFilters`.

**Respuesta.**

## ADR-5: Interfaz optimista y verdad del servidor

**Pregunta.** Describe qué ve la persona desde que hace clic en "Inscribirme" hasta que llega la respuesta, en tres casos: éxito, rechazo `ALREADY_REGISTERED` y `SOLD_OUT`. ¿Por qué la cifra final sale del servidor y no de tu cálculo optimista?

**Respuesta.**

## ADR-6: AGENTS.md y uso de IA

**Pregunta.** ¿Qué reglas agregaste a la sección 4 de `AGENTS.md`? Se esperan al menos 3 reglas verificables (que un revisor pueda comprobar en el código o con un test, no consejos genéricos). Describe una respuesta concreta de tu asistente antes y después de agregarlas.

**Respuesta.**

## Declaración de uso de IA

Marca con una `x` y completa.

- [ ] No usé asistentes de IA.
- [ ] Usé asistentes de IA. Herramientas:
- Partes del código o de los tests en las que intervino la IA:
- Errores de la IA que detecté y corregí (al menos uno, con archivo y explicación):

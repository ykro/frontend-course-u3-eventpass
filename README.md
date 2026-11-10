# EventPass

Catálogo de charlas técnicas con inscripción en línea (Next.js 16, App Router, Server Actions), listo para desplegar en Vercel.

## Unidad 3

Plantilla de la Unidad 3 del curso.

## Requisitos

- Node.js 24 (versión en `.nvmrc`).

## Instalar y correr

```bash
npm ci
cp .env.example .env.local     # nunca subas .env.local
npm run dev
```

La app queda en http://localhost:3000/events.

## Tests

```bash
npm test             # solo los tests
npm run verify       # chequeo completo
```

El archivo `AGENTS.md` trae las reglas para el asistente de IA.

El enunciado del reto, la rúbrica y la guía paso a paso están en el curso.

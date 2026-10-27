import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { setEventsRepository } from "@/lib/repository";
import { InMemoryEventsRepository } from "@/lib/repository/in-memory";
import { seedEvents } from "@/lib/repository/seed";

// Fuera de Next.js, revalidatePath lanza un error: en las pruebas es un espía.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

beforeEach(() => {
  // Cada prueba empieza con el catálogo sembrado y sin inscripciones nuevas.
  setEventsRepository(new InMemoryEventsRepository(seedEvents()));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

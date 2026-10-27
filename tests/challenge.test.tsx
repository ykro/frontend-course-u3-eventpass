// Reto autónomo, tests públicos. La nota también incluye tests ocultos con más bordes.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventsPage from "@/app/events/page";
import { RegisterForm } from "@/components/RegisterForm";
import { DEFAULT_FILTERS, filterEvents, parseEventFilters } from "@/lib/filters";
import { submitRegistration } from "@/lib/registration";
import { InMemoryEventsRepository } from "@/lib/repository/in-memory";
import { seedEvents } from "@/lib/repository/seed";
import { INITIAL_REGISTER_STATE, type RegisterState } from "@/lib/types";
import { TEST_SECRET, deferred, fakeRepository, formDataOf, makeEvent } from "./helpers";

const ana = { name: "Ana Pérez", email: "ana@ejemplo.gt" };
const beto = { name: "Beto Sic", email: "beto@ejemplo.gt" };
const carla = { name: "Carla Tum", email: "carla@ejemplo.gt" };

describe("reglas de cupo en el repositorio", () => {
  test("no vende más lugares que el cupo", async () => {
    const repo = new InMemoryEventsRepository([makeEvent({ capacity: 2 })]);
    expect(await repo.reserveSeat("evento-prueba", ana)).toEqual({ ok: true, seatsLeft: 1 });
    expect(await repo.reserveSeat("evento-prueba", beto)).toEqual({ ok: true, seatsLeft: 0 });
    expect(await repo.reserveSeat("evento-prueba", carla)).toEqual({
      ok: false,
      reason: "SOLD_OUT",
    });
    expect((await repo.getEvent("evento-prueba"))?.seatsLeft).toBe(0);
  });

  test("el mismo correo no se inscribe dos veces en el mismo evento", async () => {
    const repo = new InMemoryEventsRepository([makeEvent({ capacity: 5 })]);
    await repo.reserveSeat("evento-prueba", ana);
    expect(await repo.reserveSeat("evento-prueba", { ...ana, name: "Otra Ana" })).toEqual({
      ok: false,
      reason: "ALREADY_REGISTERED",
    });
    expect((await repo.getEvent("evento-prueba"))?.seatsLeft).toBe(4);
  });

  test("un evento inexistente no se puede reservar", async () => {
    const repo = new InMemoryEventsRepository([makeEvent()]);
    expect(await repo.reserveSeat("no-existe", ana)).toEqual({ ok: false, reason: "NOT_FOUND" });
  });
});

describe("mensajes del servidor para useActionState", () => {
  test("sin lugares responde SOLD_OUT con 0 lugares y no revalida", async () => {
    const { repository } = fakeRepository({ ok: false, reason: "SOLD_OUT" });
    const revalidate = vi.fn();
    const state = await submitRegistration(
      { repository, revalidate, ticketSecret: TEST_SECRET },
      INITIAL_REGISTER_STATE,
      formDataOf({ eventId: "evento-prueba", ...ana }),
    );
    expect(state).toEqual({
      status: "error",
      code: "SOLD_OUT",
      message: "Ya no quedan lugares para este evento.",
      seatsLeft: 0,
    });
    expect(revalidate).not.toHaveBeenCalled();
  });

  test("correo repetido y evento inexistente tienen su propio mensaje", async () => {
    for (const [reason, message] of [
      ["ALREADY_REGISTERED", "Ese correo ya está inscrito en este evento."],
      ["NOT_FOUND", "Ese evento no existe."],
    ] as const) {
      const { repository } = fakeRepository({ ok: false, reason });
      const state = await submitRegistration(
        { repository, revalidate: vi.fn(), ticketSecret: TEST_SECRET },
        INITIAL_REGISTER_STATE,
        formDataOf({ eventId: "evento-prueba", ...ana }),
      );
      expect(state).toEqual({ status: "error", code: reason, message });
    }
  });
});

describe("inscripción optimista con useOptimistic", () => {
  async function submitForm() {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nombre completo"), ana.name);
    await user.type(screen.getByLabelText("Correo electrónico"), ana.email);
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));
  }

  test("descuenta el lugar al instante y lo devuelve si el servidor rechaza", async () => {
    const pending = deferred<RegisterState>();
    render(
      <RegisterForm
        eventId="evento-prueba"
        eventTitle="Evento"
        seatsLeft={3}
        action={() => pending.promise}
      />,
    );
    await submitForm();

    expect(await screen.findByText("Quedan 2 lugares")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Apartando tu lugar...");

    pending.resolve({
      status: "error",
      code: "ALREADY_REGISTERED",
      message: "Ese correo ya está inscrito en este evento.",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ese correo ya está inscrito en este evento.",
    );
    expect(screen.getByText("Quedan 3 lugares")).toBeInTheDocument();
    expect(screen.queryByText("Apartando tu lugar...")).not.toBeInTheDocument();
  });

  test("si el servidor confirma, se queda con los lugares que informa el servidor", async () => {
    const pending = deferred<RegisterState>();
    render(
      <RegisterForm
        eventId="evento-prueba"
        eventTitle="Evento"
        seatsLeft={3}
        action={() => pending.promise}
      />,
    );
    await submitForm();
    expect(await screen.findByText("Quedan 2 lugares")).toBeInTheDocument();

    pending.resolve({
      status: "success",
      message: "Listo, Ana Pérez. Tu lugar está confirmado.",
      ticketCode: "EP-0000-0001",
      seatsLeft: 2,
    });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("EP-0000-0001"));
    expect(screen.getByText("Quedan 2 lugares")).toBeInTheDocument();
  });
});

describe("filtros en searchParams", () => {
  test("parseEventFilters acepta valores válidos y descarta los desconocidos", () => {
    expect(
      parseEventFilters({ q: "  nube ", tema: "ia", ciudad: "antigua", disponibles: "1" }),
    ).toEqual({ q: "nube", track: "ia", city: "antigua", onlyAvailable: true });
    expect(parseEventFilters({ tema: "cocina", ciudad: "Narnia" })).toEqual(DEFAULT_FILTERS);
    expect(parseEventFilters({})).toEqual(DEFAULT_FILTERS);
  });

  test("filterEvents combina tema, disponibilidad y búsqueda sin distinguir mayúsculas", async () => {
    const events = await new InMemoryEventsRepository(seedEvents()).listEvents();
    const ids = (filters: Partial<typeof DEFAULT_FILTERS>) =>
      filterEvents(events, { ...DEFAULT_FILTERS, ...filters }).map((e) => e.id);

    expect(ids({ track: "frontend" })).toEqual([
      "react-server-components",
      "programacion-funcional-ts",
    ]);
    expect(ids({ track: "backend", onlyAvailable: true })).toEqual(["seguridad-apis"]);
    expect(ids({ q: "GEMINI" })).toEqual(["gemini-en-tu-producto"]);
  });

  test("la página del catálogo aplica los filtros de la URL", async () => {
    render(
      await EventsPage({ searchParams: Promise.resolve({ tema: "backend", disponibles: "1" }) }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Seguridad de APIs, de IDOR a JWT",
    );
    expect(screen.getByText("1 evento")).toBeInTheDocument();
  });

  test("sin resultados lo dice en lugar de mostrar una lista vacía", async () => {
    render(await EventsPage({ searchParams: Promise.resolve({ q: "cobol" }) }));
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByText("0 eventos")).toBeInTheDocument();
    expect(screen.getByText("Ningún evento coincide con tus filtros.")).toBeInTheDocument();
  });
});

// Taller guiado. No se modifica: la nota sale de una copia limpia de este archivo.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { revalidatePath } from "next/cache";
import { registerAction } from "@/app/events/actions";
import EventsPage from "@/app/events/page";
import { EventCard } from "@/components/EventCard";
import { RegisterForm } from "@/components/RegisterForm";
import { submitRegistration } from "@/lib/registration";
import { getEventsRepository } from "@/lib/repository";
import { EMAIL_ERROR, NAME_ERROR } from "@/lib/schemas";
import { signTicket } from "@/lib/tickets";
import { INITIAL_REGISTER_STATE, type RegisterState } from "@/lib/types";
import {
  TEST_SECRET,
  deferred,
  fakeRepository,
  formDataOf,
  isClientModule,
  makeEvent,
  readSource as source,
} from "./helpers";

async function renderCatalog(searchParams: Record<string, string> = {}) {
  render(await EventsPage({ searchParams: Promise.resolve(searchParams) }));
}

describe("paso 2: catálogo con un Server Component async", () => {
  test("lista los 7 eventos del repositorio ordenados por fecha", async () => {
    await renderCatalog();
    expect(screen.getByRole("heading", { level: 1, name: "Próximos eventos" })).toBeInTheDocument();
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(7);
    expect(within(cards[0]!).getByRole("heading")).toHaveTextContent(
      "React 19 y Server Components en producción",
    );
    expect(within(cards[6]!).getByRole("heading")).toHaveTextContent(
      "Seguridad de APIs, de IDOR a JWT",
    );
  });

  test("cada tarjeta muestra los lugares que quedan y enlaza al detalle", async () => {
    await renderCatalog();
    const card = (title: string) => screen.getByRole("article", { name: title }) as HTMLElement;
    expect(
      within(card("React 19 y Server Components en producción")).getByText("Quedan 28 lugares"),
    ).toBeInTheDocument();
    expect(
      within(card("De FastAPI a Cloud Run sin sustos")).getByText("Agotado"),
    ).toBeInTheDocument();
    expect(
      within(card("Compose y arquitectura offline-first")).getByText("Queda 1 lugar"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Seguridad de APIs, de IDOR a JWT" })).toHaveAttribute(
      "href",
      "/events/seguridad-apis",
    );
  });
});

describe("paso 3: Server Action de inscripción", () => {
  test("rechaza datos inválidos con errores por campo y sin tocar el repositorio", async () => {
    const { repository, calls } = fakeRepository({ ok: true, seatsLeft: 1 });
    const revalidate = vi.fn();
    const state = await submitRegistration(
      { repository, revalidate, ticketSecret: TEST_SECRET },
      INITIAL_REGISTER_STATE,
      formDataOf({ eventId: "evento-prueba", name: " A ", email: "no-es-un-correo" }),
    );
    expect(state).toEqual({
      status: "error",
      code: "VALIDATION",
      message: "Revisa los datos marcados.",
      fieldErrors: { name: [NAME_ERROR], email: [EMAIL_ERROR] },
      values: { name: " A ", email: "no-es-un-correo" },
    });
    expect(calls).toHaveLength(0);
    expect(revalidate).not.toHaveBeenCalled();
  });

  test("con datos válidos normaliza, aparta el lugar, revalida el catálogo y firma el boleto", async () => {
    const { repository, calls } = fakeRepository({ ok: true, seatsLeft: 7 });
    const revalidate = vi.fn();
    const state = await submitRegistration(
      { repository, revalidate, ticketSecret: TEST_SECRET },
      INITIAL_REGISTER_STATE,
      formDataOf({ eventId: "evento-prueba", name: "  Ana Pérez ", email: " Ana@Ejemplo.GT " }),
    );
    expect(calls).toEqual([
      { eventId: "evento-prueba", attendee: { name: "Ana Pérez", email: "ana@ejemplo.gt" } },
    ]);
    expect(state).toEqual({
      status: "success",
      message: "Listo, Ana Pérez. Tu lugar está confirmado.",
      ticketCode: signTicket(TEST_SECRET, "evento-prueba", "ana@ejemplo.gt"),
      seatsLeft: 7,
    });
    expect(state.status === "success" && state.ticketCode).toMatch(/^EP-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(revalidate).toHaveBeenCalledWith("/events");
  });

  test("registerAction usa el repositorio compartido y revalidatePath de Next.js", async () => {
    const state = await registerAction(
      INITIAL_REGISTER_STATE,
      formDataOf({ eventId: "observabilidad-nube", name: "Kevin", email: "kevin@ejemplo.gt" }),
    );
    expect(state).toMatchObject({ status: "success", seatsLeft: 34 });
    expect((await getEventsRepository().getEvent("observabilidad-nube"))?.seatsLeft).toBe(34);
    expect(revalidatePath).toHaveBeenCalledWith("/events");
  });
});

describe("paso 4: formulario cliente con useActionState", () => {
  async function fillAndSubmit() {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nombre completo"), "Ana Pérez");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@ejemplo.gt");
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));
  }

  test("mientras la acción corre el botón se deshabilita y al terminar muestra el boleto", async () => {
    const pending = deferred<RegisterState>();
    const action = vi.fn((_prev: RegisterState, _data: FormData) => pending.promise);
    render(
      <RegisterForm eventId="evento-prueba" eventTitle="Evento" seatsLeft={9} action={action} />,
    );
    expect(screen.getByText("Quedan 9 lugares")).toBeInTheDocument();
    await fillAndSubmit();

    expect(await screen.findByRole("button", { name: "Inscribiendo..." })).toBeDisabled();
    const sent = action.mock.calls[0]![1];
    expect(Object.fromEntries(sent.entries())).toEqual({
      eventId: "evento-prueba",
      name: "Ana Pérez",
      email: "ana@ejemplo.gt",
    });

    pending.resolve({
      status: "success",
      message: "Listo, Ana Pérez. Tu lugar está confirmado.",
      ticketCode: "EP-1234-ABCD",
      seatsLeft: 8,
    });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Listo, Ana Pérez. Tu lugar está confirmado. Tu código de boleto es EP-1234-ABCD.",
      ),
    );
    expect(screen.getByRole("button", { name: "Inscribirme" })).toBeEnabled();
  });

  test("muestra los errores de validación del servidor sin borrar lo escrito", async () => {
    const action = vi.fn(async (): Promise<RegisterState> => ({
      status: "error",
      code: "VALIDATION",
      message: "Revisa los datos marcados.",
      fieldErrors: { name: [NAME_ERROR] },
      values: { name: "Ana Pérez", email: "ana@ejemplo.gt" },
    }));
    render(
      <RegisterForm eventId="evento-prueba" eventTitle="Evento" seatsLeft={9} action={action} />,
    );
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Revisa los datos marcados.");
    const name = screen.getByLabelText("Nombre completo");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription(NAME_ERROR);
    expect(name).toHaveValue("Ana Pérez");
    expect(screen.getByLabelText("Correo electrónico")).not.toHaveAttribute("aria-invalid");
  });

  test("un evento sin lugares deshabilita la inscripción", () => {
    render(
      <RegisterForm eventId="evento-prueba" eventTitle="Evento" seatsLeft={0} action={vi.fn()} />,
    );
    expect(screen.getByRole("form", { name: "Inscripción a Evento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agotado" })).toBeDisabled();
  });
});

describe("paso 5: fronteras cliente y servidor", () => {
  test("'use client' solo en las hojas interactivas", () => {
    expect(isClientModule(source("components/EventCard.tsx"))).toBe(false);
    expect(isClientModule(source("app/events/page.tsx"))).toBe(false);
    expect(isClientModule(source("components/RegisterForm.tsx"))).toBe(true);
    expect(isClientModule(source("components/CopyLinkButton.tsx"))).toBe(true);
  });

  test("los módulos con secretos o datos del servidor importan server-only", () => {
    for (const path of [
      "lib/config.ts",
      "lib/tickets.ts",
      "lib/registration.ts",
      "lib/repository/index.ts",
    ]) {
      expect(source(path), path).toMatch(/^import "server-only";/);
    }
  });

  test("la descripción se despliega con HTML nativo, sin estado de React", () => {
    render(<EventCard event={{ ...makeEvent(), seatsLeft: 3 }} />);
    const summary = screen.getByText("Ver descripción");
    expect(summary.tagName).toBe("SUMMARY");
    expect(summary.closest("details")).toHaveTextContent("Descripción de prueba.");
    expect(source("components/EventCard.tsx")).not.toMatch(/\buse(State|Effect)\b/);
  });
});

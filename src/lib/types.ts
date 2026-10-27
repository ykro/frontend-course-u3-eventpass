export const TRACKS = ["frontend", "backend", "movil", "ia", "nube"] as const;
export type Track = (typeof TRACKS)[number];

export const CITIES = ["guatemala", "antigua", "quetzaltenango"] as const;
export type City = (typeof CITIES)[number];

export const TRACK_LABELS: Record<Track, string> = {
  frontend: "Frontend",
  backend: "Backend",
  movil: "Móvil",
  ia: "Inteligencia artificial",
  nube: "Nube",
};

export const CITY_LABELS: Record<City, string> = {
  guatemala: "Ciudad de Guatemala",
  antigua: "Antigua Guatemala",
  quetzaltenango: "Quetzaltenango",
};

export type EventRecord = {
  id: string;
  title: string;
  speaker: string;
  track: Track;
  city: City;
  venue: string;
  /** Fecha y hora ISO 8601 con zona horaria de Guatemala (-06:00). */
  startsAt: string;
  capacity: number;
  description: string;
};

/** Lo que ve la interfaz: el evento más los lugares que quedan. */
export type EventSummary = EventRecord & { seatsLeft: number };

export type Attendee = { name: string; email: string };

export type ReserveResult =
  | { ok: true; seatsLeft: number }
  | { ok: false; reason: "NOT_FOUND" | "SOLD_OUT" | "ALREADY_REGISTERED" };

export type RegisterErrorCode = "VALIDATION" | "NOT_FOUND" | "SOLD_OUT" | "ALREADY_REGISTERED";

export type RegisterFieldErrors = Partial<Record<"name" | "email", string[]>>;

/** Estado que la Server Action de registro devuelve a useActionState. */
export type RegisterState =
  | { status: "idle" }
  | { status: "success"; message: string; ticketCode: string; seatsLeft: number }
  | {
      status: "error";
      code: RegisterErrorCode;
      message: string;
      fieldErrors?: RegisterFieldErrors;
      /** Lugares que quedan según el servidor, cuando el error lo sabe (SOLD_OUT = 0). */
      seatsLeft?: number;
      /** Lo que escribió la persona, para no borrarle el formulario si falla la validación. */
      values?: { name: string; email: string };
    };

export type RegisterAction = (prev: RegisterState, formData: FormData) => Promise<RegisterState>;

export const INITIAL_REGISTER_STATE: RegisterState = { status: "idle" };

/** Borrador que propone el asistente con Gemini (power-up opcional). */
export type EventDraft = { description: string; suggestedCapacity: number };

export type DraftState =
  | { status: "idle" }
  | { status: "disabled"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<"title" | "track" | "city", string[]>>;
    }
  | { status: "success"; draft: EventDraft; model: string };

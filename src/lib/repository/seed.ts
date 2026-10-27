import type { Attendee } from "@/lib/types";
import type { SeedEvent } from "./in-memory";

/** Asistentes ficticios para que el catálogo arranque con cupos parciales. */
function attendees(prefix: string, count: number): Attendee[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Asistente ${i + 1}`,
    email: `${prefix}-${String(i + 1).padStart(2, "0")}@ejemplo.gt`,
  }));
}

export function seedEvents(): SeedEvent[] {
  return [
    {
      id: "react-server-components",
      title: "React 19 y Server Components en producción",
      speaker: "Lucía Ajú",
      track: "frontend",
      city: "guatemala",
      venue: "Campus Central, salón 2",
      startsAt: "2027-03-06T09:00:00-06:00",
      capacity: 40,
      description: "Qué se queda en el servidor, qué viaja al navegador y cómo medirlo.",
      attendees: attendees("rsc", 12),
    },
    {
      id: "fastapi-cloud-run",
      title: "De FastAPI a Cloud Run sin sustos",
      speaker: "Diego Monterroso",
      track: "backend",
      city: "antigua",
      venue: "Casa Santo Domingo, sala Colonial",
      startsAt: "2027-03-13T10:00:00-06:00",
      capacity: 25,
      description: "Contenedores, secretos y presupuestos para un primer despliegue.",
      attendees: attendees("api", 25),
    },
    {
      id: "compose-offline-first",
      title: "Compose y arquitectura offline-first",
      speaker: "Ana Lucía Xiloj",
      track: "movil",
      city: "quetzaltenango",
      venue: "Centro Intercultural, aula 4",
      startsAt: "2027-03-20T15:00:00-06:00",
      capacity: 30,
      description: "Room como fuente única de verdad y sincronización cuando vuelve la red.",
      attendees: attendees("mov", 29),
    },
    {
      id: "gemini-en-tu-producto",
      title: "Gemini en tu producto, del prototipo al usuario",
      speaker: "Marco Tulio Pérez",
      track: "ia",
      city: "guatemala",
      venue: "Zona 4, Foro Cultural",
      startsAt: "2027-04-03T09:30:00-06:00",
      capacity: 60,
      description: "Salidas estructuradas, costos por llamada y cómo probar sin red.",
      attendees: attendees("ia", 20),
    },
    {
      id: "programacion-funcional-ts",
      title: "Programación funcional con TypeScript",
      speaker: "Sofía Barrios",
      track: "frontend",
      city: "quetzaltenango",
      venue: "Centro Intercultural, aula 2",
      startsAt: "2027-04-10T16:00:00-06:00",
      capacity: 20,
      description: "Uniones discriminadas, inmutabilidad y funciones puras en el día a día.",
      attendees: attendees("fp", 5),
    },
    {
      id: "observabilidad-nube",
      title: "Observabilidad en la nube con presupuestos pequeños",
      speaker: "Kevin Choc",
      track: "nube",
      city: "antigua",
      venue: "Hotel Museo, salón Volcán",
      startsAt: "2027-04-17T11:00:00-06:00",
      capacity: 35,
      description: "Logs, métricas y alertas útiles sin pagar de más.",
    },
    {
      id: "seguridad-apis",
      title: "Seguridad de APIs, de IDOR a JWT",
      speaker: "María José Cifuentes",
      track: "backend",
      city: "guatemala",
      venue: "Campus Central, auditorio",
      startsAt: "2027-04-24T09:00:00-06:00",
      capacity: 50,
      description: "Las fallas más comunes que encontramos al revisar APIs generadas con IA.",
      attendees: attendees("sec", 10),
    },
  ];
}

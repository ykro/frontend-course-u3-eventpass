/** Texto de disponibilidad que se repite en el catálogo, el detalle y el formulario. */
export function formatSeats(seatsLeft: number): string {
  if (seatsLeft <= 0) return "Agotado";
  if (seatsLeft === 1) return "Queda 1 lugar";
  return `Quedan ${seatsLeft} lugares`;
}

const DATE_FORMAT = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "America/Guatemala",
});

export function formatEventDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

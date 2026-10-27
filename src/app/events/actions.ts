"use server";

import { revalidatePath } from "next/cache";
import { getTicketSecret } from "@/lib/config";
import { submitRegistration } from "@/lib/registration";
import { getEventsRepository } from "@/lib/repository";
import type { RegisterState } from "@/lib/types";

/** Endpoint POST que Next.js genera para el formulario de inscripción. */
export async function registerAction(
  prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  return submitRegistration(
    {
      repository: getEventsRepository(),
      revalidate: (path) => revalidatePath(path),
      ticketSecret: getTicketSecret(),
    },
    prev,
    formData,
  );
}

import type { Metadata } from "next";
import { DraftForm } from "@/components/DraftForm";
import { getServerConfig } from "@/lib/config";
import { draftEventAction } from "./actions";

export const metadata: Metadata = { title: "Organizar" };

// Se decide en cada petición si el asistente está encendido (depende de GEMINI_API_KEY).
export const dynamic = "force-dynamic";

export default function OrganizePage() {
  // Al cliente solo le pasa un booleano, nunca la clave.
  const enabled = getServerConfig().geminiApiKey !== null;
  return (
    <section aria-labelledby="organize-title" className="max-w-2xl">
      <h1 id="organize-title" className="text-3xl font-bold tracking-tight">
        Organiza una charla
      </h1>
      <p className="mt-2 text-zinc-700">
        Escribe el título y el asistente propone una descripción y un cupo. Es un borrador: revísalo
        antes de publicarlo.
      </p>
      <DraftForm action={draftEventAction} enabled={enabled} />
    </section>
  );
}

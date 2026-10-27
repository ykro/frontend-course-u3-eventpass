"use client";

import { useState } from "react";

/** Hoja interactiva: solo esto necesita JavaScript en el navegador dentro del catálogo. */
export function CopyLinkButton({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).toString());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-stone-100"
    >
      {copied ? "Enlace copiado" : "Copiar enlace de esta búsqueda"}
    </button>
  );
}

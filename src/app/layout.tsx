import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

// La CSP con nonce (src/proxy.ts) exige renderizar cada página en la petición: una página
// prerenderizada en el build no tiene nonce y el navegador bloquearía sus scripts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "EventPass", template: "%s | EventPass" },
  description: "Charlas técnicas en Guatemala con inscripción en línea.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-GT">
      <body className="min-h-screen bg-stone-50 text-zinc-900 antialiased">
        <header className="border-b border-stone-200 bg-white">
          <nav
            aria-label="Principal"
            className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
          >
            <Link href="/events" className="text-lg font-bold tracking-tight text-teal-800">
              EventPass
            </Link>
            <ul className="flex gap-5 text-sm font-medium text-zinc-700">
              <li>
                <Link href="/events" className="hover:text-teal-800">
                  Eventos
                </Link>
              </li>
              <li>
                <Link href="/organizar" className="hover:text-teal-800">
                  Organizar
                </Link>
              </li>
            </ul>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

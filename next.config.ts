import type { NextConfig } from "next";

// La CSP de las páginas lleva un nonce distinto en cada petición: la fija src/proxy.ts.
// Aquí van las cabeceras fijas de todas las rutas y una CSP cerrada para la API (JSON).
export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

export const apiContentSecurityPolicy = "default-src 'none'; frame-ancestors 'none'";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/api/:path*",
        headers: [{ key: "Content-Security-Policy", value: apiContentSecurityPolicy }],
      },
    ];
  },
};

export default nextConfig;

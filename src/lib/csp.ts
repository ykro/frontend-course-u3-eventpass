/**
 * Content Security Policy con un nonce por petición. Next.js lee el nonce de la cabecera
 * de la petición y lo pone en sus propios scripts y estilos; cualquier otro script en
 * línea (por ejemplo, uno inyectado con un XSS) no lo tiene y el navegador lo bloquea.
 */
export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic': lo que cargue un script con nonce también es de confianza.
    // 'unsafe-eval' solo en desarrollo: React lo usa para reconstruir trazas de error.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** 16 bytes aleatorios en base64: impredecible y distinto en cada petición. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

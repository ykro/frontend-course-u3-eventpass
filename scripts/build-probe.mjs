// Build de verificación: `next build` con valores canario en las variables secretas.
// Después, tests/security/ busca esos valores en lo que se envía al navegador.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

process.loadEnvFile(fileURLToPath(new URL("../tests/security/probe.env", import.meta.url)));
const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);

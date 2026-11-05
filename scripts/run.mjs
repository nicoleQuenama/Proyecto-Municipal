/**
 * Arranca la app web y el servidor de tiempo real juntos:   node scripts/run.mjs dev   |   node scripts/run.mjs start
 * Si uno se cae, se cierra el otro. `pnpm dev` y `pnpm start` lo usan.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const mode = process.argv[2] === "start" ? "start" : "dev";
const next = createRequire(import.meta.url).resolve("next/dist/bin/next");

const children = [
  spawn(process.execPath, [next, mode], { stdio: "inherit" }),
  spawn(process.execPath, ["--env-file-if-exists=.env.local", "realtime/server.mts"], { stdio: "inherit" }),
];

const stop = (code = 0) => {
  for (const child of children) child.kill();
  process.exit(code);
};
// Con RUN_MAINTENANCE=1 también corre, una vez al día, la limpieza de archivos sin uso y de datos vencidos.
if (mode === "start" && process.env.RUN_MAINTENANCE === "1") {
  children.push(spawn(process.execPath, ["--env-file-if-exists=.env.local", "scripts/maintenance.mts", "--loop"], { stdio: "inherit" }));
}

for (const child of children) child.on("exit", (code) => stop(code ?? 0));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

/**
 * Ejecuta el código que escribe el usuario (interacciones y TypeScript de página), en uno de dos modos:
 *  - «page»: dentro de la página, con acceso completo al DOM. Es el que permite que una librería
 *    (GSAP, Chart.js…) modifique los elementos de verdad.
 *  - «isolated»: en un iframe sin origen propio, que solo puede pedir lo que ofrece `api`.
 */

import { safeTranspile } from "../code/transpile";
import { libraryUrl } from "../libraries/library-url";
import { preludeOf } from "../functions/scope";
import type { Library, SharedFunction } from "../site/types";
import type { PageApi } from "./page-api";
import { runInSandbox, type SandboxMethod } from "./sandbox";
import type { CodeMode } from "./types";

export interface CodeEnv {
  libraries: Library[];
  /** Las funciones reutilizables que valen para este código; se declaran antes de ejecutarlo. */
  functions: SharedFunction[];
  origin: string;
  api: PageApi;
  element: HTMLElement | null;
}

/** Una línea (o varias) `import … from "x"` o `import "x"`, con el nombre del módulo en el último texto entre comillas. */
const IMPORT_STATEMENT = /^[ \t]*import\s[\s\S]*?(["'])([^"']+)\1[ \t]*;?[ \t]*$/gm;

/** Separa los `import` del resto del código: en un módulo solo pueden ir arriba del todo. */
export function splitImports(source: string): { imports: string[]; body: string } {
  const imports: string[] = [];
  const body = source.replace(IMPORT_STATEMENT, (statement) => {
    imports.push(statement.trim());
    return "";
  });
  return { imports, body };
}

/** Cambia el nombre de una librería del proyecto por su dirección; lo demás (URLs, rutas) queda igual. */
export function resolveImport(statement: string, libraries: Library[], origin: string): string {
  return statement.replace(/(["'])([^"']+)\1(?=[ \t]*;?[ \t]*$)/, (whole, quote: string, specifier: string) => {
    const library = libraries.find((l) => l.name === specifier);
    return library ? `${quote}${libraryUrl(library, origin)}${quote}` : whole;
  });
}

/** El módulo completo: los imports arriba y, en una función `async`, las funciones reutilizables y el código del usuario. */
export function buildModule(source: string, env: Pick<CodeEnv, "libraries" | "functions" | "origin">): string {
  const { imports, body } = splitImports(source);
  const resolved = imports.map((statement) => resolveImport(statement, env.libraries, env.origin));

  // Las funciones reutilizables se declaran dentro de la función que corre el código, para que vean `api` y `element`.
  // El código se escribe en TypeScript: aquí se quitan los tipos antes de ejecutarlo.
  return safeTranspile(
    `${resolved.join("\n")}\nexport default async function __portalRun(api: any, element: HTMLElement) {\n${preludeOf(env.functions)}\n${body}\n}\n`,
  );
}

async function runInPage(source: string, env: CodeEnv) {
  const url = URL.createObjectURL(new Blob([buildModule(source, env)], { type: "text/javascript" }));
  try {
    const loaded = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
    await loaded.default(env.api, env.element);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function runIsolated(source: string, env: CodeEnv) {
  const api = env.api as unknown as Record<SandboxMethod, (...args: unknown[]) => void>;
  return runInSandbox(safeTranspile(`${preludeOf(env.functions)}\n${source}`), (method, args) => api[method]?.(...args));
}

/** Cómo se ejecuta el código en cada modo. Un modo nuevo es una entrada nueva. */
const EXECUTORS: Record<CodeMode, (source: string, env: CodeEnv) => Promise<void>> = {
  page: runInPage,
  isolated: runIsolated,
};

/** Ejecuta el código; si falla, lo cuenta por `api.log` en lugar de romper la página. */
export async function executeCode(source: string, mode: CodeMode, env: CodeEnv) {
  try {
    await EXECUTORS[mode](source, env);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    env.api.log(`Error en el código: ${message}`);
  }
}

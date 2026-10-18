import { readFile } from "node:fs/promises";
import path from "node:path";

/** Tipo de contenido por extensión de los archivos que se sirven desde node_modules. */
const CONTENT_TYPES: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

const CACHE = "public, max-age=3600";

/** Sirve un archivo de `node_modules/<packageDir>`, o 404 si no existe o intenta salir de esa carpeta. */
export async function serveVendorFile(packageDir: string, relativePath: string): Promise<Response> {
  const root = path.resolve(process.cwd(), "node_modules", packageDir);
  const file = path.resolve(root, relativePath);
  const type = CONTENT_TYPES[path.extname(file)];

  // Solo dentro de la carpeta del paquete y solo tipos conocidos: nada de ../ ni archivos arbitrarios.
  if (!file.startsWith(root + path.sep) || !type) return new Response("No encontrado", { status: 404 });

  try {
    const content = await readFile(file);
    return new Response(content, { headers: { "Content-Type": type, "Cache-Control": CACHE } });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}

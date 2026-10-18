import { serveVendorFile } from "../../../server/vendor-files";

/** Tailwind CSS para el navegador: compila al vuelo las clases que aparecen en el HTML del usuario. */
export async function GET() {
  return serveVendorFile("@tailwindcss/browser", "dist/index.global.js");
}

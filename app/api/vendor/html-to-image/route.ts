import { serveVendorFile } from "../../../server/vendor-files";

/** html-to-image para el navegador: el iframe de un bloque de código lo carga solo cuando el editor le pide una captura. */
export async function GET() {
  return serveVendorFile("html-to-image", "dist/html-to-image.js");
}

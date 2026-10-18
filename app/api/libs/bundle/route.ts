import { bundleLibrary, isValidName } from "../../../server/npm-libraries";

/**
 * Una librería ya instalada con pnpm, empaquetada como módulo ES. El código del usuario corre en un iframe
 * sin origen propio, así que la respuesta lleva CORS abierto: solo sirve lo instalado desde la app.
 */
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name");
  if (!name || !isValidName(name)) return new Response("Nombre no válido", { status: 400 });

  try {
    return new Response(await bundleLibrary(name), {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo empaquetar.";
    return new Response(message, { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
  }
}

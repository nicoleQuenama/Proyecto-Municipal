import {
  availability,
  guardRequest,
  installLibrary,
  isValidName,
  isValidVersion,
  listInstalled,
  uninstallLibrary,
} from "../../server/npm-libraries";

const fail = (error: unknown, status = 400) =>
  Response.json({ error: error instanceof Error ? error.message : "Error inesperado." }, { status });

/** Si se puede instalar con pnpm aquí, y qué librerías instaló ya el usuario. */
export async function GET(request: Request) {
  const denied = guardRequest(request);
  if (denied) return Response.json({ ...availability(), available: false, installed: [] });

  return Response.json({ ...availability(), installed: await listInstalled() });
}

/** `pnpm add nombre@versión` en este proyecto. */
export async function POST(request: Request) {
  const denied = guardRequest(request);
  if (denied) return denied;

  const { name, version = "" } = (await request.json().catch(() => ({}))) as { name?: string; version?: string };
  if (!name || !isValidName(name)) return fail("Nombre de paquete no válido.");
  if (version && !isValidVersion(version)) return fail("Versión no válida.");

  try {
    return Response.json(await installLibrary(name, version));
  } catch (error) {
    return fail(error, 500);
  }
}

/** `pnpm remove nombre`, solo de lo instalado desde la app. */
export async function DELETE(request: Request) {
  const denied = guardRequest(request);
  if (denied) return denied;

  const name = new URL(request.url).searchParams.get("name");
  if (!name || !isValidName(name)) return fail("Nombre de paquete no válido.");

  try {
    await uninstallLibrary(name);
    return Response.json({ name });
  } catch (error) {
    return fail(error, 500);
  }
}

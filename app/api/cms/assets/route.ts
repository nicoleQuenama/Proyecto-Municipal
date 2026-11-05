import { saveMedia } from "../../../server/media/asset-store";
import { readUsage } from "../../../server/media/usage";
import { inProject } from "../../../server/site-access";
import { versionRoute } from "../../../server/versions/version-route";
import { VersionError } from "../../../server/versions/branch-rows";

/** Cuánto almacenamiento usa la organización y cuánto le permite su plan. */
export const GET = (request: Request) => versionRoute(request, async (actor) => ({ usage: await inProject(actor, readUsage) }));

/**
 * Sube una imagen o un video del equipo (formulario con `file`): va a ImageKit y queda registrado en el proyecto. Devuelve la
 * dirección pública que se guarda en el diseño. Un archivo igual a uno ya subido no se vuelve a subir.
 */
export async function POST(request: Request) {
  return versionRoute(
    request,
    async (actor) => {
      const form = await request.formData().catch(() => null);
      const file = form?.get("file");
      if (!(file instanceof File)) throw new VersionError("Falta el archivo.", 400);
      return { media: await saveMedia(actor, file.name || "archivo", Buffer.from(await file.arrayBuffer())) };
    },
    201,
  );
}

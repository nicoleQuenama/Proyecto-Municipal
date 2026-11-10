import { REQUEST_HEADER } from "../../server/request-header";

/** Se avisa a la ventana cuando termina una subida: el medidor de almacenamiento se actualiza solo. */
export const MEDIA_UPLOADED_EVENT = "portal:media-uploaded";

/**
 * La unidad en la que trabaja la persona (`null` = global; `undefined` = no hay unidades). La fija el editor al cambiar de unidad
 * (es de la pantalla, como la página actual): así los seis sitios desde los que se sube no tienen que pasarla uno por uno.
 */
let uploadUnit: string | null | undefined;
export const setUploadUnit = (unitId: string | null | undefined): void => {
  uploadUnit = unitId;
};

/**
 * Sube una imagen o un video del equipo a ImageKit (por el servidor, que guarda la clave) y devuelve su dirección pública:
 * eso es lo que se guarda en el diseño. Nunca viaja el archivo dentro del sitio (ni como dato incrustado ni como enlace temporal).
 */
export async function uploadMedia(file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  if (uploadUnit !== undefined) form.set("unit", uploadUnit ?? "global");
  const response = await fetch("/api/cms/assets", { method: "POST", headers: { [REQUEST_HEADER]: "1" }, body: form }).catch(() => null);
  if (!response) throw new Error(`No se pudo subir «${file.name}»: sin conexión.`);
  const body = (await response.json().catch(() => ({}))) as { media?: { url: string }; error?: string };
  if (!response.ok || !body.media) throw new Error(body.error ?? `No se pudo subir «${file.name}».`);
  window.dispatchEvent(new Event(MEDIA_UPLOADED_EVENT));
  return body.media.url;
}

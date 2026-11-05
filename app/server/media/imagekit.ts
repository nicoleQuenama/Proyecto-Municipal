/**
 * ImageKit: guarda los originales y entrega cualquier tamaño o formato por URL (`?tr=w-640,f-auto`). La clave privada
 * (`IMAGEKIT_PRIVATE_KEY`) nunca sale de este módulo; el navegador solo recibe la URL pública del archivo.
 */
const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const API_URL = "https://api.imagekit.io/v1";
const TIMEOUT_MS = 120_000;

export interface ImageKitFile {
  fileId: string;
  /** Ruta dentro de ImageKit, p. ej. `/org/<organización>/<proyecto>/abc123-foto.png`. */
  filePath: string;
  width?: number;
  height?: number;
}

/** ¿Están puestas las tres variables? Sin ellas no se pueden subir archivos (se avisa, no se rompe). */
export const imagekitConfigured = (): boolean => !!process.env.IMAGEKIT_PRIVATE_KEY && !!process.env.IMAGEKIT_PUBLIC_KEY && !!process.env.IMAGEKIT_URL_ENDPOINT;

const authorization = () => `Basic ${Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString("base64")}`;

/** La URL pública de un archivo de ImageKit a partir de su ruta. */
export const publicUrl = (path: string): string => `${process.env.IMAGEKIT_URL_ENDPOINT!.replace(/\/+$/, "")}${path}`;

export async function uploadToImageKit(data: Buffer, contentType: string, folder: string, fileName: string): Promise<ImageKitFile> {
  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(data)], { type: contentType }), fileName);
  form.set("fileName", fileName);
  form.set("folder", folder);
  form.set("useUniqueFileName", "false");
  form.set("overwriteFile", "false");

  const response = await fetch(UPLOAD_URL, { method: "POST", headers: { authorization: authorization() }, body: form, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const body = (await response.json().catch(() => ({}))) as Partial<ImageKitFile> & { message?: string };
  if (response.status === 401 || response.status === 403) throw new Error("ImageKit rechazó las credenciales: revisa IMAGEKIT_PRIVATE_KEY.");
  if (!response.ok || !body.fileId || !body.filePath) throw new Error(body.message ?? `ImageKit respondió ${response.status}.`);
  return { fileId: body.fileId, filePath: body.filePath, width: body.width, height: body.height };
}

/** Borra un archivo de ImageKit por su id (lo usa la limpieza de archivos que ya nadie usa). */
export async function deleteFromImageKit(fileId: string): Promise<void> {
  const response = await fetch(`${API_URL}/files/${encodeURIComponent(fileId)}`, { method: "DELETE", headers: { authorization: authorization() }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok && response.status !== 404) throw new Error(`ImageKit respondió ${response.status} al borrar.`);
}

/** El id de un archivo a partir de su ruta, o `null` si ImageKit no lo tiene (una subida que se cortó a medias). */
export async function findFileId(path: string): Promise<string | null> {
  const query = new URLSearchParams({ searchQuery: `filePath = "${path.replace(/"/g, "")}"`, limit: "1" });
  const response = await fetch(`${API_URL}/files?${query}`, { headers: { authorization: authorization() }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`ImageKit respondió ${response.status} al buscar.`);
  const found = (await response.json().catch(() => [])) as { fileId?: string }[];
  return found[0]?.fileId ?? null;
}

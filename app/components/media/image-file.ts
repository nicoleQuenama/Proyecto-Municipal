/** Reglas de los archivos de imagen que se suben desde el equipo (lógica pura, salvo la lectura del archivo). */

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const VIDEO_FILES_MESSAGE = "Los videos solo se pueden agregar con un enlace (URL).";

/** Devuelve el motivo del rechazo, o null si el archivo es una imagen válida. */
export function imageFileProblem(file: File): string | null {
  if (file.type.startsWith("video/")) return VIDEO_FILES_MESSAGE;
  if (!file.type.startsWith("image/")) return `«${file.name}» no es una imagen.`;
  if (file.size > MAX_IMAGE_BYTES) return `«${file.name}» pesa más de 10 MB.`;
  return null;
}

/** El contenido del archivo como URL de datos: viaja con el componente y no hay que liberarla después. */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`No se pudo leer «${file.name}».`));
    reader.readAsDataURL(file);
  });
}

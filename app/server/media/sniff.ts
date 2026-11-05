/** Los tipos que se aceptan: la lista cerrada que también exige la base de datos (sin SVG: puede llevar scripts). */
export const MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif", "video/mp4", "video/webm"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const startsWith = (data: Uint8Array, bytes: number[], offset = 0) => bytes.every((byte, index) => data[offset + index] === byte);
const ascii = (data: Uint8Array, start: number, end: number) => String.fromCharCode(...data.subarray(start, end));

/**
 * El tipo REAL del archivo según sus primeros bytes, o `null` si no es de los permitidos. El tipo que declara el navegador
 * no se cree: así nadie sube un ejecutable o una página con scripts disfrazados de imagen.
 */
export function sniffMediaType(data: Uint8Array): MediaType | null {
  if (startsWith(data, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(data, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (ascii(data, 0, 3) === "GIF") return "image/gif";
  if (ascii(data, 0, 4) === "RIFF" && ascii(data, 8, 12) === "WEBP") return "image/webp";
  if (ascii(data, 4, 8) === "ftyp") return /avif|avis/.test(ascii(data, 8, 16)) ? "image/avif" : "video/mp4";
  if (startsWith(data, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  return null;
}

export const maxBytesOf = (type: MediaType): number => (type.startsWith("video/") ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES);

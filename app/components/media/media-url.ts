/**
 * Validación y clasificación de URLs de imágenes y videos (lógica pura).
 * Solo se aceptan enlaces http(s); YouTube y Vimeo se convierten a su URL de incrustación.
 */

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface ParsedMedia {
  kind: "image" | "video";
  src: string;
  name: string;
  /** true cuando `src` es un reproductor para <iframe> (YouTube, Vimeo). */
  embed: boolean;
}

const INVALID_URL = "Ingresa una URL válida que empiece con http:// o https://";
const VIDEO_FILE = /\.(mp4|webm|ogg|mov|m4v)$/i;
const YOUTUBE_ID = /^[\w-]{11}$/;

function toHttpUrl(input: string): URL | null {
  try {
    const url = new URL(input.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function nameOf(url: URL): string {
  return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? url.hostname);
}

function youtubeId(url: URL, host: string): string | null {
  if (host === "youtu.be") return url.pathname.split("/")[1] ?? null;
  if (host !== "youtube.com") return null;
  return (
    url.searchParams.get("v") ??
    url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/)?.[1] ??
    null
  );
}

/** URL de reproductor para <iframe>, o null si el enlace no es de un proveedor conocido. */
function embedSrc(url: URL): string | null {
  const host = url.hostname.replace(/^(www|m)\./, "");

  const youtube = youtubeId(url, host);
  if (youtube && YOUTUBE_ID.test(youtube)) {
    return `https://www.youtube-nocookie.com/embed/${youtube}`;
  }

  const vimeo = host === "vimeo.com" ? url.pathname.match(/^\/(\d+)/)?.[1] : null;
  return vimeo ? `https://player.vimeo.com/video/${vimeo}` : null;
}

export function parseImageUrl(input: string): ParseResult<ParsedMedia> {
  const url = toHttpUrl(input);
  if (!url) return { ok: false, error: INVALID_URL };
  return { ok: true, value: { kind: "image", src: url.href, name: nameOf(url), embed: false } };
}

export function parseVideoUrl(input: string): ParseResult<ParsedMedia> {
  const url = toHttpUrl(input);
  if (!url) return { ok: false, error: INVALID_URL };

  const embed = embedSrc(url);
  return {
    ok: true,
    value: { kind: "video", src: embed ?? url.href, name: nameOf(url), embed: embed !== null },
  };
}

/** Detecta el tipo por la URL: video si es de YouTube/Vimeo o termina en .mp4/.webm…; si no, imagen. */
export function parseMediaUrl(input: string): ParseResult<ParsedMedia> {
  const url = toHttpUrl(input);
  const isVideo = url && (embedSrc(url) !== null || VIDEO_FILE.test(url.pathname));
  return isVideo ? parseVideoUrl(input) : parseImageUrl(input);
}

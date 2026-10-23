import type { Manifest } from "../components/external-site/types";

const KINDS = ["text", "attr", "style", "hide", "insert"];
const DEVICES = ["all", "tablet", "mobile"];
const MAX_ITEMS = 1000;
const MAX_TEXT = 100_000;

const isText = (value: unknown): value is string => typeof value === "string" && value.length <= MAX_TEXT;
const isList = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.length <= MAX_ITEMS && value.every((item) => typeof item === "object" && item !== null);

/** Comprueba lo que llega al publicar. Devuelve el manifiesto limpio, o el motivo por el que se rechaza. */
export function validateManifest(input: unknown): { manifest: Manifest } | { error: string } {
  const raw = (input ?? {}) as Record<string, unknown>;
  if (!isText(raw.site)) return { error: "Falta el sitio." };

  let origin: string;
  try {
    const url = new URL(raw.site);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    origin = url.origin;
  } catch {
    return { error: "El sitio no es una URL http(s) válida." };
  }

  if (!isList(raw.patches) || !isList(raw.pages)) return { error: "Los cambios o las páginas no son válidos." };

  const patches = raw.patches.map((p) => ({
    id: p.id, path: p.path, selector: p.selector, label: p.label, kind: p.kind, name: p.name, value: p.value, device: p.device,
  }));
  const validPatch = patches.every(
    (p) => [p.id, p.path, p.selector, p.label, p.name, p.value].every(isText) && KINDS.includes(p.kind as string) && DEVICES.includes(p.device as string),
  );
  const pages = raw.pages.map((p) => ({ id: p.id, path: p.path, title: p.title, html: p.html }));
  const validPage = pages.every((p) => [p.id, p.path, p.title, p.html].every(isText));
  if (!validPatch || !validPage) return { error: "Algún cambio o página tiene datos no válidos." };

  return {
    manifest: {
      version: 1,
      site: origin,
      autoResponsive: raw.autoResponsive === true,
      patches: patches as Manifest["patches"],
      pages: pages as Manifest["pages"],
      publishedAt: new Date().toISOString(),
    },
  };
}

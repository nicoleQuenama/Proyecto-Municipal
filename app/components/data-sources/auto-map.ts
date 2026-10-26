import type { CanvasElement, ElementKind } from "../site/types";
import { joinPath } from "./paths";
import type { DataRef } from "./types";
import { isRecord, isScalar, type Scalar } from "./value-kind";

interface Field {
  path: string;
  key: string;
  value: Scalar;
}

const MAX_DEPTH = 2;
const IMAGE_VALUE = /^(https?:\/\/|\/|data:image\/).*\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$|^data:image\//i;
const IMAGE_KEY = /(image|img|foto|photo|picture|thumb|avatar|cover|banner|src)/i;

const isImageField = ({ key, value }: Field) => typeof value === "string" && (IMAGE_VALUE.test(value) || (IMAGE_KEY.test(key) && /^(https?:)?\/\//.test(value)));

/** Un color (`#c22e28`, `hsl(…)`): no es un texto que se lea, se usa como color de algo (ver «Este dato llena el…»). */
const COLOR_VALUE = /^(#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})|(rgb|hsl)a?\(.*\))$/i;
const isColorField = ({ value }: Field) => typeof value === "string" && COLOR_VALUE.test(value.trim());

/** Los datos sueltos de un objeto (y de los de dentro, hasta dos niveles), en el orden en que vienen. */
function fieldsOf(item: unknown, path: string, depth = 0): Field[] {
  if (isScalar(item)) return [{ path, key: path.split(/[.[]/).pop() ?? "", value: item }];
  if (!isRecord(item)) return [];

  const entries = Object.entries(item);
  const direct = entries.filter(([, value]) => isScalar(value)).flatMap(([key, value]) => fieldsOf(value, joinPath(path, key)).map((f) => ({ ...f, key })));
  const nested = depth < MAX_DEPTH ? entries.filter(([, value]) => isRecord(value)).flatMap(([key, value]) => fieldsOf(value, joinPath(path, key), depth + 1)) : [];
  return [...direct, ...nested];
}

/** Qué rellena cada tipo de elemento: texto (en orden de lectura) o medios (a las imágenes de los datos). Un tipo nuevo es una entrada nueva. */
const TAKES: Record<ElementKind, "text" | "media" | "none"> = { text: "text", rect: "text", ellipse: "text", triangle: "none", line: "none", image: "media", video: "media", icon: "none" };

const readingOrder = (a: CanvasElement, b: CanvasElement) => a.y - b.y || a.x - b.x;

/**
 * Reparte los datos de un objeto entre los elementos de una sección que aún no tienen dato: los textos
 * (con texto de ejemplo) reciben los datos en orden, y las imágenes y vídeos las URLs de imagen.
 */
export function autoMap(elements: CanvasElement[], item: unknown, itemPath: string, sourceId: string, taken: Set<string>): Record<string, DataRef> {
  const fields = fieldsOf(item, itemPath);
  const images = fields.filter(isImageField);
  // Los textos primero: un número (un id) rara vez es lo que se quiere ver en un titular.
  const texts = fields.filter((field) => !isImageField(field) && !isColorField(field)).sort((a, b) => Number(typeof b.value === "string") - Number(typeof a.value === "string"));

  const free = elements.filter((e) => !e.hidden && !taken.has(e.id)).sort(readingOrder);
  const textSlots = free.filter((e) => TAKES[e.kind] === "text" && e.text.trim() !== "");
  const mediaSlots = free.filter((e) => TAKES[e.kind] === "media");

  const pair = (slots: CanvasElement[], list: Field[]) => slots.slice(0, list.length).map((e, i): [string, DataRef] => [e.id, { sourceId, path: list[i].path }]);
  return Object.fromEntries([...pair(textSlots, texts), ...pair(mediaSlots, images)]);
}

"use client";

import { useSite } from "../site/site-context";
import type { CanvasElement, ElementKind } from "../site/types";
import { useRepeatIndex } from "./repeat-context";
import { asText, isListValue } from "./as-text";
import { resolveRef } from "./resolve";
import type { DataRef } from "./types";
import { useSourceData } from "./use-source-data";

/** Qué parte de cada tipo de elemento llena el dato. Un tipo nuevo es una entrada nueva. */
const BOUND_FIELD: Record<ElementKind, "text" | "src"> = {
  rect: "text",
  ellipse: "text",
  text: "text",
  image: "src",
  video: "src",
};

/** El elemento con el dato de su API puesto (si está enlazado y ya llegó); si no, tal cual. */
export function useBoundElement(element: CanvasElement, binding: DataRef | undefined, repeat: DataRef | undefined): CanvasElement {
  const { sources } = useSite();
  const index = useRepeatIndex();
  const { state } = useSourceData(sources.find((s) => s.id === binding?.sourceId));

  if (!binding || state.status === "idle" || state.data === undefined) return element;
  const value = resolveRef(state.data, binding, repeat, index);
  if (value === undefined) return element;

  const field = BOUND_FIELD[element.kind];
  // Una lista de datos se dibuja como lista con viñetas, salvo que el elemento ya tenga otra clase de lista.
  const list = field === "text" && isListValue(value) && !element.list ? { list: "ul" as const } : {};
  return { ...element, ...list, [field]: asText(value) };
}

"use client";

import { useSite } from "../site/site-context";
import type { CanvasElement } from "../site/types";
import { BOUND_FIELDS, fieldOf } from "./bound-fields";
import { useRepeatIndex } from "./repeat-context";
import { resolveRef } from "./resolve";
import type { DataRef } from "./types";
import { useSourceData } from "./use-source-data";

/** El elemento con el dato de su API puesto (si está enlazado y ya llegó); si no, tal cual. */
export function useBoundElement(element: CanvasElement, binding: DataRef | undefined, repeat: DataRef | undefined): CanvasElement {
  const { sources } = useSite();
  const index = useRepeatIndex();
  const { state } = useSourceData(sources.find((s) => s.id === binding?.sourceId));

  if (!binding || state.status === "idle" || state.data === undefined) return element;
  const value = resolveRef(state.data, binding, repeat, index);
  if (value === undefined) return element;

  return { ...element, ...BOUND_FIELDS[fieldOf(binding, element.kind)].apply(element, value, binding) };
}

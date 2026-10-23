import type { CanvasElement } from "../site/types";
import { autoMap } from "./auto-map";
import { getPath, joinPath } from "./paths";
import type { SourceAction } from "./source-rules";
import type { DataRef } from "./types";
import { kindOf, type ValueKind } from "./value-kind";

/** Dónde se soltó la clave: sobre un elemento o sobre la sección (`elementId` = null). */
export interface DropContext {
  pageId: string;
  blockId: string;
  elementId: string | null;
  elements: CanvasElement[];
  /** Elementos de la sección que ya tienen un dato. */
  bound: string[];
  data: unknown;
}

type Plan = (ref: DataRef, ctx: DropContext, value: unknown) => SourceAction[];

const bind = (ctx: DropContext, elementId: string, ref: DataRef | null): SourceAction => ({
  type: "binding/set",
  pageId: ctx.pageId,
  blockId: ctx.blockId,
  elementId,
  ref,
});

const fill = (ref: DataRef, ctx: DropContext, itemPath: string, item: unknown): SourceAction[] => {
  const refs = autoMap(ctx.elements, item, itemPath, ref.sourceId, new Set(ctx.bound));
  return Object.keys(refs).length > 0 ? [{ type: "binding/many", pageId: ctx.pageId, blockId: ctx.blockId, refs }] : [];
};

/** La sección sale una vez por cada elemento de la lista, y cada copia se rellena con el suyo. */
const repeatSection: Plan = (ref, ctx, value) => [
  { type: "repeat/set", pageId: ctx.pageId, blockId: ctx.blockId, ref },
  ...fill(ref, ctx, joinPath(ref.path, 0), (value as unknown[])[0]),
];

/** Qué pasa al soltar cada clase de dato sobre un elemento. Una clase nueva es una entrada nueva. */
const ON_ELEMENT: Record<ValueKind, Plan> = {
  empty: () => [],
  scalar: (ref, ctx) => [bind(ctx, ctx.elementId!, ref)],
  scalars: (ref, ctx) => [bind(ctx, ctx.elementId!, ref)],
  object: (ref, ctx) => [bind(ctx, ctx.elementId!, ref)],
  // Una lista de objetos no cabe en un elemento: repite la sección que lo contiene.
  records: repeatSection,
};

/** Qué pasa al soltarlo sobre la sección entera. */
const ON_SECTION: Record<ValueKind, Plan> = {
  empty: () => [],
  scalar: (ref, ctx) => fill(ref, ctx, ref.path, getPath(ctx.data, ref.path)),
  scalars: repeatSection,
  object: (ref, ctx, value) => fill(ref, ctx, ref.path, value),
  records: repeatSection,
};

/** Las acciones que resultan de soltar una clave de una API en la página, sea cual sea el tipo de dato. */
export function planDrop(ref: DataRef, ctx: DropContext): SourceAction[] {
  const value = getPath(ctx.data, ref.path);
  const table = ctx.elementId === null ? ON_SECTION : ON_ELEMENT;
  return table[kindOf(value)](ref, ctx, value);
}

import type { SiteAction } from "../site/types";
import { canEditBlock } from "./access";
import type { User } from "./types";

interface PageLike {
  id: string;
  blocks: { id: string; componentId: string }[];
}

/** Una sección: la página donde está y su id. */
interface Place {
  pageId: string;
  blockId: string;
}

/** Lo que pasa con una acción de alguien con acceso limitado: sigue, se reparte entre sus secciones o se rechaza. */
export type Guarded =
  | { kind: "run"; actions: SiteAction[] }
  /** Un cambio «para todo el componente» se aplicó solo a las secciones de la persona (`count`). */
  | { kind: "narrowed"; actions: SiteAction[]; count: number }
  | { kind: "blocked"; reason: string };

const NOT_YOURS = "Esta sección no está asignada a tu cuenta.";
const SHARED = "Este componente lo usan secciones que no son tuyas: ese cambio no se puede hacer.";

const run = (action: SiteAction): Guarded => ({ kind: "run", actions: [action] });

/** Las secciones que usan el componente, en todas las páginas. */
const usersOf = (pages: PageLike[], componentId: string): Place[] =>
  pages.flatMap((page) => page.blocks.filter((block) => block.componentId === componentId).map((block) => ({ pageId: page.id, blockId: block.id })));

type Split = (action: never, at: Place) => SiteAction;

/** Cómo se reparte un cambio de componente entre las secciones: la acción equivalente de sección. Uno nuevo es una entrada nueva. */
const SPLITS: Record<string, Split> = {
  "component/element": ((a: Extract<SiteAction, { type: "component/element" }>, at: Place) => ({ type: "block/style", ...at, elementIds: [a.elementId], patch: a.patch })) as Split,
  "component/size": ((a: Extract<SiteAction, { type: "component/size" }>, at: Place) => ({ type: "block/size", ...at, size: a.size, backdropId: a.backdropId })) as Split,
  "component/styles": ((a: Extract<SiteAction, { type: "component/styles" }>, at: Place) => ({ type: "block/custom", ...at, key: a.key, patch: a.patch })) as Split,
  "component/recolor": ((a: Extract<SiteAction, { type: "component/recolor" }>, at: Place) => ({ type: "block/recolor", ...at, color: a.color, fill: a.fill, text: a.text, box: a.box })) as Split,
  "element/remove": ((a: Extract<SiteAction, { type: "element/remove" }>, at: Place) => ({ ...a, scope: "block", ...at })) as Split,
};

/** ¿Cambia el componente en sí (y por tanto todas sus secciones)? */
const isComponentLevel = (action: SiteAction): boolean =>
  action.type.startsWith("component/") || (action.type === "element/remove" && action.scope === "component");

/**
 * Filtra una acción del sitio según el acceso de la persona. Sin límite de alcance todo sigue igual. Con él:
 * - lo que toca una sección ajena se rechaza;
 * - un cambio «para todo el componente» solo llega a las secciones suyas que lo usan (las demás no cambian);
 * - lo que cambiaría el componente en sí, sin poder repartirse, se rechaza si lo usan secciones ajenas.
 */
export function guardAction(action: SiteAction, user: User | null | undefined, pages: PageLike[]): Guarded {
  if (!user?.access?.scope) return run(action);

  const fields = action as unknown as Record<string, unknown>;
  const pageId = (fields.pageId ?? fields.fromPageId) as string | undefined;
  const blockId = (fields.blockId ?? (action.type === "block/remove" ? fields.id : undefined)) as string | undefined;

  if (isComponentLevel(action)) {
    const componentId =
      (fields.componentId as string | undefined) ??
      (fields.component as { id?: string } | undefined)?.id ??
      (action.type === "component/delete" ? (fields.id as string) : undefined) ??
      pages.flatMap((page) => page.blocks).find((block) => block.id === blockId)?.componentId;
    const all = componentId ? usersOf(pages, componentId) : [];
    const mine = all.filter((place) => canEditBlock(user, place.pageId, place.blockId));
    // Un componente que nadie usa todavía (uno nuevo) no afecta a nadie más.
    if (mine.length === all.length) return run(action);

    const split = SPLITS[action.type];
    if (!split || mine.length === 0) return { kind: "blocked", reason: SHARED };
    return { kind: "narrowed", actions: mine.map((place) => split(action as never, place)), count: mine.length };
  }

  if (pageId && blockId && !canEditBlock(user, pageId, blockId)) return { kind: "blocked", reason: NOT_YOURS };
  return run(action);
}

/** Cuántas secciones usan el componente y cuántas son de la persona; `null` si todas lo son (o no tiene límite). */
export function sharedUsage(user: User | null | undefined, pages: PageLike[], componentId: string): { mine: number; total: number } | null {
  if (!user?.access?.scope) return null;
  const all = usersOf(pages, componentId);
  const mine = all.filter((place) => canEditBlock(user, place.pageId, place.blockId)).length;
  return mine === all.length ? null : { mine, total: all.length };
}

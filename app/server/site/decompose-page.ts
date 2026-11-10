import type { BlockInstance, Page } from "../../components/site/types.ts";
import type { AnimationRow, BlockRow, CodeDraft, MediaRow, Owner, PageRow, StepRow } from "./rows.ts";
import type { Language } from "./code-ast.ts";

type Json = Record<string, unknown>;

/** Un trozo de código con contenido (el vacío no se guarda: no hay nada que parsear). */
export const draft = (owner: Owner, slot: string, language: Language, text: string | undefined): CodeDraft[] =>
  text?.trim() ? [{ owner, slot, language, text }] : [];

/** Una copia del objeto sin esas claves. */
export const without = (value: object, ...keys: string[]): Json => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));

export interface PageParts {
  page: PageRow;
  blocks: BlockRow[];
  media: MediaRow[];
  animations: AnimationRow[];
  steps: StepRow[];
  code: CodeDraft[];
}

/** Una sección: sus columnas propias, su formato (JSON) y su código aparte. Lo que el editor añada en el futuro viaja en `format`. */
function decomposeBlock(block: BlockInstance, pageId: string, position: number): { row: BlockRow; code: CodeDraft[] } {
  const { id, componentId, hidden, locked, slot, scope, code, custom, behaviors, ...rest } = block;
  const owner: Owner = { kind: "block", id };
  const format: Json = { ...rest };
  const drafts: CodeDraft[] = [];

  if (code) {
    format.code = { tailwind: code.tailwind };
    drafts.push(...draft(owner, "code.html", "html", code.html), ...draft(owner, "code.css", "css", code.css), ...draft(owner, "code.js", "typescript", code.js));
  }
  if (custom) {
    // Del CSS propio queda en el JSON solo lo que no es código (las clases de Tailwind).
    format.custom = Object.fromEntries(
      Object.entries(custom).map(([key, style]) => {
        drafts.push(...draft(owner, `custom.${key}.css`, "css", style.css));
        return [key, without(style, "css")];
      }),
    );
  }
  if (behaviors) {
    format.behaviors = behaviors.map((behavior) => {
      if (behavior.action.kind !== "code") return behavior;
      drafts.push(...draft(owner, `behavior.${behavior.id}.js`, "typescript", behavior.action.source));
      return { ...behavior, action: without(behavior.action, "source") };
    });
  }

  return {
    row: { id, pageId, componentId, position, hidden: !!hidden, locked: !!locked, slot: slot ?? null, scope: scope ?? null, format },
    code: drafts,
  };
}

/** Una página con todo lo que cuelga de ella. `position` es su lugar en la lista de páginas. */
export function decomposePage(page: Page, position: number): PageParts {
  const { id, name, slug, isHome, unitId, role, hidden, route, title, media, blocks, animations, css, js, ...settings } = page;
  const owner: Owner = { kind: "page", id };
  const parts = blocks.map((block, index) => decomposeBlock(block, id, index));

  return {
    page: { id, name, slug, isHome: !!isHome, unitId: unitId ?? null, role: role ?? null, position, hidden: !!hidden, route: route ?? null, title, settings },
    blocks: parts.map((part) => part.row),
    media: media.map((item, index): MediaRow => {
      const { id: mediaId, kind, src, embed, alt, hidden: mediaHidden, poster, placement, ...rest } = item;
      return { id: mediaId, pageId: id, position: index, kind, src, embed: !!embed, alt: alt ?? null, hidden: !!mediaHidden, poster: poster ?? null, placement: placement ?? null, settings: rest };
    }),
    animations: (animations ?? []).map((animation, index) => ({ id: animation.id, pageId: id, name: animation.name, position: index })),
    steps: (animations ?? []).flatMap((animation) =>
      animation.steps.map(
        (step, index): StepRow => ({
          animationId: animation.id,
          id: step.id,
          blockId: step.blockId,
          key: step.key,
          prop: step.prop,
          from: step.from,
          to: step.to,
          start: step.at,
          duration: step.duration,
          easing: step.easing ?? null,
          iterations: step.iterations ?? null,
          direction: step.direction ?? null,
          position: index,
        }),
      ),
    ),
    code: [...draft(owner, "css", "css", css), ...draft(owner, "js", "typescript", js), ...parts.flatMap((part) => part.code)],
  };
}

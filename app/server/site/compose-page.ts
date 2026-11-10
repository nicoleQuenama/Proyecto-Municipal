import type { BlockInstance, Page } from "../../components/site/types.ts";
import { codeKey, type AnimationRow, type BlockRow, type CodeTexts, type MediaRow, type Owner, type PageRow, type StepRow } from "./rows.ts";

type Json = Record<string, unknown>;

/** El texto de un trozo de código (vacío si no hay: nunca se guardó o estaba en blanco). */
export const textOf = (texts: CodeTexts, owner: Owner, slot: string): string => texts.get(codeKey(owner, slot)) ?? "";

/** Añade `key: value` solo cuando hay valor: el editor distingue «sin definir» de «vacío». */
const optional = (key: string, value: unknown, present: boolean): Json => (present ? { [key]: value } : {});

function composeBlock(row: BlockRow, texts: CodeTexts): BlockInstance {
  const owner: Owner = { kind: "block", id: row.id };
  const { code, custom, behaviors, ...rest } = row.format as { code?: { tailwind: boolean }; custom?: Record<string, Json>; behaviors?: { id: string; action: Json }[] } & Json;

  return {
    ...rest,
    id: row.id,
    componentId: row.componentId,
    ...optional("hidden", true, row.hidden),
    ...optional("locked", true, row.locked),
    ...optional("slot", row.slot, row.slot !== null),
    ...optional("scope", row.scope, row.scope !== null),
    ...optional(
      "code",
      code && { html: textOf(texts, owner, "code.html"), css: textOf(texts, owner, "code.css"), js: textOf(texts, owner, "code.js"), tailwind: code.tailwind },
      !!code,
    ),
    ...optional(
      "custom",
      custom && Object.fromEntries(Object.entries(custom).map(([key, style]) => [key, { ...style, css: textOf(texts, owner, `custom.${key}.css`) }])),
      !!custom,
    ),
    ...optional(
      "behaviors",
      behaviors?.map((behavior) =>
        behavior.action.kind === "code" ? { ...behavior, action: { ...behavior.action, source: textOf(texts, owner, `behavior.${behavior.id}.js`) } } : behavior,
      ),
      !!behaviors,
    ),
  } as unknown as BlockInstance;
}

function composeMedia(row: MediaRow): Page["media"][number] {
  return {
    ...row.settings,
    id: row.id,
    kind: row.kind,
    src: row.src,
    embed: row.embed,
    ...optional("alt", row.alt, row.alt !== null),
    ...optional("hidden", true, row.hidden),
    ...optional("poster", row.poster, row.poster !== null),
    ...optional("placement", row.placement, row.placement !== null),
  } as Page["media"][number];
}

function composeAnimation(row: AnimationRow, steps: StepRow[]) {
  return {
    id: row.id,
    name: row.name,
    steps: steps.map((step) => ({
      id: step.id,
      blockId: step.blockId,
      key: step.key,
      prop: step.prop,
      from: step.from,
      to: step.to,
      at: step.start,
      duration: step.duration,
      ...optional("easing", step.easing, step.easing !== null),
      ...optional("iterations", step.iterations, step.iterations !== null),
      ...optional("direction", step.direction, step.direction !== null),
    })),
  };
}

/** Los hijos de una página, ya agrupados y en orden. */
export interface PageChildren {
  blocks: BlockRow[];
  media: MediaRow[];
  animations: AnimationRow[];
  steps: StepRow[];
}

export function composePage(row: PageRow, children: PageChildren, texts: CodeTexts): Page {
  const owner: Owner = { kind: "page", id: row.id };
  const css = textOf(texts, owner, "css");
  const js = textOf(texts, owner, "js");

  return {
    ...row.settings,
    id: row.id,
    name: row.name,
    slug: row.slug,
    isHome: row.isHome,
    title: row.title,
    media: children.media.map(composeMedia),
    blocks: children.blocks.map((block) => composeBlock(block, texts)),
    ...optional("unitId", row.unitId, row.unitId !== null),
    ...optional("role", row.role, row.role !== null),
    ...optional("hidden", true, row.hidden),
    ...optional("route", row.route, row.route !== null),
    ...optional("css", css, css !== ""),
    ...optional("js", js, js !== ""),
    ...optional(
      "animations",
      children.animations.map((animation) => composeAnimation(animation, children.steps.filter((step) => step.animationId === animation.id))),
      children.animations.length > 0,
    ),
  } as unknown as Page;
}

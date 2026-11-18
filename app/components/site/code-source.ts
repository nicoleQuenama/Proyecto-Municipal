import { CODE_COMPONENT_ID, DEFAULT_CODE } from "./code-defaults";
import type { BlockInstance, CodeSource, ComponentDef, SiteAction } from "./types";

const defOf = (block: BlockInstance, components: ComponentDef[]) => components.find((c) => c.id === block.componentId);

/** El componente compartido del que un bloque toma su código (solo si el bloque no tiene código propio). */
export function sharedDefOf(block: BlockInstance, components: ComponentDef[]): ComponentDef | undefined {
  const def = defOf(block, components);
  return !block.code && def?.codeKind === "component" && def.code ? def : undefined;
}

/** El código que se dibuja y se edita en un bloque: el propio o, si es un componente compartido, el de su definición. */
export function codeOf(block: BlockInstance, components: ComponentDef[]): CodeSource | undefined {
  return block.code ?? sharedDefOf(block, components)?.code;
}

/** ¿Es un bloque que es solo su código (el bloque de código, un componente de código o una plantilla de código)? */
export function isCodeBlock(block: BlockInstance, components: ComponentDef[]): boolean {
  if (!codeOf(block, components)) return false;
  return block.componentId === CODE_COMPONENT_ID || defOf(block, components)?.codeKind !== undefined;
}

/** El código con el que nace un bloque nuevo de este componente: el ejemplo, la copia de la plantilla, o ninguno. */
export function newBlockCode(def: ComponentDef | undefined, componentId: string): { code?: CodeSource } {
  if (componentId === CODE_COMPONENT_ID) return { code: DEFAULT_CODE };
  return def?.codeKind === "template" && def.code ? { code: { ...def.code } } : {};
}

/** La acción que guarda un cambio en el código de un bloque: en su definición si es un componente compartido, o en el propio bloque. */
export function codePatchAction(block: BlockInstance, components: ComponentDef[], pageId: string, patch: Partial<CodeSource>): SiteAction {
  const shared = sharedDefOf(block, components);
  return shared
    ? { type: "component/code", componentId: shared.id, patch }
    : { type: "block/code", pageId, blockId: block.id, patch };
}

import { CODE_COMPONENT_ID, EMPTY_CODE } from "./code-defaults";
import { updateBlock } from "./overrides";
import { getBlockSlot } from "./rules";
import type { BlockInstance, CodeSource, ComponentDef, SiteState } from "./types";

export type BlockKind = "loose" | "component" | "template";

export type CodeKindAction =
  | { type: "component/code"; componentId: string; patch: Partial<CodeSource> }
  | { type: "block/set-kind"; pageId: string; blockId: string; kind: BlockKind; name?: string }
  /** Un trozo de código seleccionado en el editor pasa a un bloque nuevo (componente o plantilla) de esa página. */
  | {
      type: "page/add-code-block";
      pageId: string;
      kind: Exclude<BlockKind, "loose">;
      name: string;
      blockId: string;
      code: Partial<CodeSource>;
      /** `page`: solo se guarda la plantilla (no se coloca ningún bloque); se aplica después a una página. */
      scope?: "section" | "page";
    }
  /** Pone el TypeScript y el CSS de una plantilla de página en esa página, en lugar de los que tenía. */
  | { type: "page/apply-code-template"; pageId: string; componentId: string };

type Handlers = { [K in CodeKindAction["type"]]: (state: SiteState, action: Extract<CodeKindAction, { type: K }>) => SiteState };

const findBlock = (state: SiteState, pageId: string, blockId: string): BlockInstance | undefined =>
  state.pages.find((p) => p.id === pageId)?.blocks.find((b) => b.id === blockId) ??
  state.pages.flatMap((p) => p.blocks).find((b) => b.id === blockId);

/** Una definición nueva que guarda el código de un bloque. */
const codeDefinition = (name: string, kind: "component" | "template", code: CodeSource): ComponentDef => ({
  id: crypto.randomUUID(),
  name,
  description: "Bloque de código",
  category: "Código",
  width: 800,
  height: 400,
  elements: [],
  links: {},
  custom: true,
  code,
  codeKind: kind,
});

/** Qué pasa con el bloque al elegir cada tipo. Un tipo nuevo es una entrada nueva. */
const CONVERT: { [K in BlockKind]: (state: SiteState, block: BlockInstance, pageId: string, name: string) => SiteState } = {
  loose: (state, block, pageId) => {
    const shared = state.components.find((c) => c.id === block.componentId);
    const code = block.code ?? shared?.code;
    return updateBlock(state, pageId, block.id, (b) => ({ ...b, componentId: CODE_COMPONENT_ID, ...(code ? { code } : {}) }));
  },
  component: (state, block, pageId, name) => {
    const def = codeDefinition(name, "component", block.code!);
    const next = updateBlock(state, pageId, block.id, (b) => ({ ...b, componentId: def.id, code: undefined }));
    return { ...next, components: [...next.components, def] };
  },
  template: (state, block, pageId, name) => {
    const def = codeDefinition(name, "template", { ...block.code! });
    const next = updateBlock(state, pageId, block.id, (b) => ({ ...b, componentId: def.id }));
    return { ...next, components: [...next.components, def] };
  },
};

export const CODE_KIND_HANDLERS: Handlers = {
  "component/code": (state, { componentId, patch }) => ({
    ...state,
    components: state.components.map((c) => (c.id === componentId && c.code ? { ...c, code: { ...c.code, ...patch } } : c)),
  }),

  "block/set-kind": (state, { pageId, blockId, kind, name }) => {
    const block = findBlock(state, pageId, blockId);
    // Sin código propio ni compartido no hay nada que convertir en componente o plantilla.
    if (!block || (kind !== "loose" && !block.code)) return state;
    return CONVERT[kind](state, block, pageId, name?.trim() || "Bloque de código");
  },

  "page/add-code-block": (state, { pageId, kind, name, blockId, code, scope }) => {
    if (!state.pages.some((p) => p.id === pageId)) return state;

    const def = codeDefinition(name.trim() || "Bloque de código", kind, { ...EMPTY_CODE, ...code });
    if (scope === "page") return { ...state, components: [...state.components, { ...def, codeKind: "template", templateFor: "page" }] };

    const block: BlockInstance = {
      id: blockId,
      componentId: def.id,
      slot: getBlockSlot({ id: blockId, componentId: def.id }, def),
      // Una plantilla se coloca con su propia copia; un componente sigue a su definición.
      ...(kind === "template" ? { code: { ...def.code! } } : {}),
    };
    return {
      ...state,
      components: [...state.components, def],
      pages: state.pages.map((p) => (p.id === pageId ? { ...p, blocks: [...p.blocks, block] } : p)),
      selectedId: blockId,
      selectedElementId: null,
    };
  },

  "page/apply-code-template": (state, { pageId, componentId }) => {
    const template = state.components.find((c) => c.id === componentId);
    if (!template?.code || template.templateFor !== "page") return state;
    const { js, css } = template.code;
    return { ...state, pages: state.pages.map((p) => (p.id === pageId ? { ...p, js, css } : p)) };
  },
};

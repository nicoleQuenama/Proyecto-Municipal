import { addAnimation, deleteAnimation, finishRecording, renameAnimation, setAnimationSteps } from "../animation/animation-rules";
import { SOURCE_HANDLERS } from "../data-sources/source-rules";
import { dropLinksToPage, normalizeExternalUrl, normalizeTransition } from "../navigation/links";
import type { LinkTarget } from "../navigation/types";
import { INITIAL_STATE as INITIAL_TITLE } from "../title-editor/constants";
import { setHidden } from "./hiding";
import { CODE_COMPONENT_ID, DEFAULT_CODE } from "./code-defaults";
import { patchComponentElement, resizeComponent } from "./component-scope-rules";
import { placeBlock, placeMedia, placeTitle, transferBlock, transferMedia } from "../placement/placement-rules";
import { mergePatch, moveBlock, resetFormat, resizeSection, styleBox, styleElements, updateBlock } from "./overrides";
import {
  isPageNameTaken,
  slugify,
  uniqueSlug,
} from "./rules";
import { clearRule, saveVariable, setRuleProp, withoutScope } from "../styles/mutations";
import {
  TITLE_SELECTION,
  type Page,
  type SiteAction,
  type SiteState,
} from "./types";

function updateCurrentPage(state: SiteState, update: (page: Page) => Page): SiteState {
  return {
    ...state,
    pages: state.pages.map((page) => (page.id === state.currentPageId ? update(page) : page)),
  };
}

/** Cómo se valida cada tipo de enlace antes de guardarlo. `null` si no se puede guardar. */
const LINK_CHECKS: {
  [K in LinkTarget["kind"]]: (state: SiteState, link: Extract<LinkTarget, { kind: K }>) => LinkTarget | null;
} = {
  page: (state, link) => {
    if (!state.pages.some((p) => p.id === link.pageId)) return null;
    return link.transition ? { ...link, transition: normalizeTransition(link.transition) } : link;
  },
  external: (_state, link) => {
    // Vacío vale mientras el enlace se está creando; si hay texto, debe ser una URL válida.
    const url = link.url.trim() === "" ? "" : normalizeExternalUrl(link.url);
    return url === null ? null : { ...link, url };
  },
};

const checkLink = (state: SiteState, link: LinkTarget): LinkTarget | null =>
  (LINK_CHECKS[link.kind] as (state: SiteState, link: LinkTarget) => LinkTarget | null)(state, link);

/** Un manejador por tipo de acción: añadir una acción nueva es añadir una entrada aquí. */
type Handlers = {
  [K in SiteAction["type"]]: (state: SiteState, action: Extract<SiteAction, { type: K }>) => SiteState;
};

const HANDLERS: Handlers = {
  ...SOURCE_HANDLERS,
  "page/create": (state, action) => {
    const name = action.name.trim();
    if (!name || isPageNameTaken(state.pages, name)) return state;

    const page: Page = {
      id: action.id,
      name,
      slug: uniqueSlug(slugify(name), state.pages.map((p) => p.slug)),
      isHome: false,
      title: { ...INITIAL_TITLE, text: name },
      media: [],
      blocks: [],
    };
    return {
      ...state,
      pages: [...state.pages, page],
      currentPageId: page.id,
      selectedId: TITLE_SELECTION,
      selectedElementId: null,
    };
  },

  "page/rename": (state, action) => {
    const name = action.name.trim();
    if (!name || isPageNameTaken(state.pages, name, action.id)) return state;

    return {
      ...state,
      pages: state.pages.map((page) =>
        page.id === action.id
          ? {
              ...page,
              name,
              // La ruta sigue al nombre, salvo en la página de inicio.
              slug: page.isHome
                ? page.slug
                : uniqueSlug(
                    slugify(name),
                    state.pages.filter((p) => p.id !== page.id).map((p) => p.slug),
                  ),
            }
          : page,
      ),
    };
  },

  "page/delete": (state, action) => {
    const page = state.pages.find((p) => p.id === action.id);
    const home = state.pages.find((p) => p.isHome);
    if (!page || page.isHome || !home) return state;

    const deletingCurrent = state.currentPageId === page.id;
    return {
      ...state,
      ...withoutScope(state, { kind: "page", pageId: page.id }),
      // Los enlaces que llevaban a la página eliminada desaparecen.
      components: state.components.map((c) => ({ ...c, links: dropLinksToPage(c.links, page.id) })),
      pages: state.pages.filter((p) => p.id !== page.id),
      currentPageId: deletingCurrent ? home.id : state.currentPageId,
      selectedId: deletingCurrent ? TITLE_SELECTION : state.selectedId,
    };
  },

  "page/select": (state, action) => {
    if (!state.pages.some((p) => p.id === action.id) || action.id === state.currentPageId) return state;
    return { ...state, currentPageId: action.id, selectedId: TITLE_SELECTION, selectedElementId: null };
  },

  "title/patch": (state, action) =>
    updateCurrentPage(state, (page) => ({ ...page, title: { ...page.title, ...action.patch } })),

  "title/reset": (state) =>
    updateCurrentPage(state, (page) => ({ ...page, title: { ...INITIAL_TITLE, text: page.title.text } })),

  "media/add": (state, action) =>
    updateCurrentPage(state, (page) => ({ ...page, media: [...page.media, action.item] })),

  "media/poster": (state, action) => ({
    ...state,
    pages: state.pages.map((page) =>
      page.id === action.pageId
        ? {
            ...page,
            media: page.media.map((item) =>
              item.id === action.mediaId
                ? { ...item, poster: action.poster ?? undefined, posterLocal: action.poster ? action.local : undefined }
                : item,
            ),
          }
        : page,
    ),
  }),

  "media/remove": (state, action) =>
    updateCurrentPage(state, (page) => ({ ...page, media: page.media.filter((item) => item.id !== action.id) })),

  "block/add": (state, action) => {
    if (!state.components.some((c) => c.id === action.componentId)) return state;
    const pageId = action.pageId ?? state.currentPageId;
    if (!state.pages.some((p) => p.id === pageId)) return state;

    // Un bloque de código nace con un ejemplo que ya funciona.
    const block = {
      id: action.id,
      componentId: action.componentId,
      ...(action.componentId === CODE_COMPONENT_ID ? { code: DEFAULT_CODE } : {}),
    };
    const next = {
      ...state,
      pages: state.pages.map((page) => (page.id === pageId ? { ...page, blocks: [...page.blocks, block] } : page)),
    };
    return { ...next, selectedId: action.id, selectedElementId: null };
  },

  "block/remove": (state, action) => {
    const next = updateCurrentPage(state, (page) => ({
      ...page,
      blocks: page.blocks.filter((block) => block.id !== action.id),
    }));
    const removedSelected = state.selectedId === action.id;
    return {
      ...next,
      functions: state.functions.filter((f) => f.scope.kind === "global" || f.scope.blockId !== action.id),
      selectedId: removedSelected ? TITLE_SELECTION : state.selectedId,
      selectedElementId: removedSelected ? null : state.selectedElementId,
    };
  },

  "block/select": (state, action) => ({ ...state, selectedId: action.id, selectedElementId: null, alsoSelectedIds: undefined }),

  "element/select": (state, action) => {
    if (!action.add || !action.id || state.selectedElementId === null) {
      return { ...state, selectedElementId: action.id, alsoSelectedIds: undefined };
    }
    if (action.id === state.selectedElementId) return state;
    const also = state.alsoSelectedIds ?? [];
    const id = action.id;
    return { ...state, alsoSelectedIds: also.includes(id) ? also.filter((other) => other !== id) : [...also, id] };
  },

  "block/style": (state, action) =>
    styleElements(state, action.pageId, action.blockId, action.elementIds, action.patch),

  "block/box": (state, action) => styleBox(state, action.pageId, action.blockId, action.patch),

  "animation/finish": (state, { pageId, baseline, animation }) => finishRecording(state, pageId, baseline, animation),

  "animation/add": (state, { pageId, animation, trigger }) => addAnimation(state, pageId, animation, trigger),

  "animation/steps": (state, { pageId, id, steps }) => setAnimationSteps(state, pageId, id, steps),

  "animation/rename": (state, { pageId, id, name }) => renameAnimation(state, pageId, id, name),

  "animation/delete": (state, { pageId, id }) => deleteAnimation(state, pageId, id),

  "block/recolor": (state, { pageId, blockId, color, fill, text, box }) => {
    const filled = fill.length > 0 ? styleElements(state, pageId, blockId, fill, { fill: color }) : state;
    const texted = text.length > 0 ? styleElements(filled, pageId, blockId, text, { color }) : filled;
    return box ? styleBox(texted, pageId, blockId, { background: color }) : texted;
  },

  "block/place": (state, action) => placeBlock(state, action.pageId, action.blockId, action.placement),

  "block/transfer": (state, action) =>
    transferBlock(state, action.fromPageId, action.toPageId, action.blockId, action.placement),

  "title/place": (state, action) => placeTitle(state, action.pageId, action.placement),

  "media/place": (state, action) => placeMedia(state, action.pageId, action.mediaId, action.placement),

  "media/transfer": (state, action) =>
    transferMedia(state, action.fromPageId, action.toPageId, action.mediaId, action.placement),

  "component/element": (state, action) => patchComponentElement(state, action, action.elementId, action.patch),

  "component/size": (state, action) => resizeComponent(state, action, action.size, action.backdropId),

  "block/size": (state, action) => resizeSection(state, action.pageId, action.blockId, action.size, action.backdropId),

  "block/move": (state, action) => moveBlock(state, action.pageId, action.blockId, action.direction),

  "block/reset": (state, action) => resetFormat(state, action.pageId, action.blockId),

  "hidden/set": (state, action) => setHidden(state, action.target, action.hidden),

  "block/code": (state, action) =>
    updateBlock(state, action.pageId, action.blockId, (block) => ({
      ...block,
      code: { ...(block.code ?? DEFAULT_CODE), ...action.patch },
    })),

  "block/custom": (state, action) =>
    updateBlock(state, action.pageId, action.blockId, (block) => {
      const custom = { ...block.custom };
      const merged = { classes: "", css: "", ...mergePatch(custom[action.key], action.patch) };
      // Sin clases ni CSS no queda nada guardado.
      if (merged.classes || merged.css) custom[action.key] = merged;
      else delete custom[action.key];
      return { ...block, custom: Object.keys(custom).length > 0 ? custom : undefined };
    }),

  "behavior/save": (state, action) =>
    updateBlock(state, action.pageId, action.blockId, (block) => {
      const behaviors = block.behaviors ?? [];
      const exists = behaviors.some((b) => b.id === action.behavior.id);
      return {
        ...block,
        behaviors: exists
          ? behaviors.map((b) => (b.id === action.behavior.id ? action.behavior : b))
          : [...behaviors, action.behavior],
      };
    }),

  "behavior/remove": (state, action) =>
    updateBlock(state, action.pageId, action.blockId, (block) => {
      const behaviors = (block.behaviors ?? []).filter((b) => b.id !== action.behaviorId);
      return { ...block, behaviors: behaviors.length > 0 ? behaviors : undefined };
    }),

  "global-css/set": (state, action) => ({ ...state, globalCss: action.css }),

  "page/code": (state, action) => ({
    ...state,
    pages: state.pages.map((page) => (page.id === action.pageId ? { ...page, ...action.patch } : page)),
  }),

  "function/save": (state, action) => {
    const exists = state.functions.some((f) => f.id === action.fn.id);
    return {
      ...state,
      functions: exists
        ? state.functions.map((f) => (f.id === action.fn.id ? action.fn : f))
        : [...state.functions, action.fn],
    };
  },

  "function/remove": (state, action) => ({ ...state, functions: state.functions.filter((f) => f.id !== action.id) }),

  "library/add": (state, action) =>
    state.libraries.some((l) => l.name === action.library.name)
      ? state
      : { ...state, libraries: [...state.libraries, action.library] },

  "library/remove": (state, action) => ({ ...state, libraries: state.libraries.filter((l) => l.id !== action.id) }),

  "component/save": (state, action) => {
    const previous = state.components.find((c) => c.id === action.component.id);
    // El constructor no conoce los estilos de todo el componente: se conservan los que ya tenía.
    const component = { ...action.component, styles: action.component.styles ?? previous?.styles };
    return {
      ...state,
      components: previous
        ? state.components.map((c) => (c.id === component.id ? component : c))
        : [...state.components, component],
    };
  },

  "component/styles": (state, action) => ({
    ...state,
    components: state.components.map((def) => {
      if (def.id !== action.componentId) return def;

      const styles = { ...def.styles };
      const merged = { classes: "", css: "", ...mergePatch(styles[action.key], action.patch) };
      // Sin clases ni CSS no queda nada guardado.
      if (merged.classes || merged.css) styles[action.key] = merged;
      else delete styles[action.key];
      return { ...def, styles: Object.keys(styles).length > 0 ? styles : undefined };
    }),
  }),

  "component/delete": (state, action) => {
    const component = state.components.find((c) => c.id === action.id);
    if (!component?.custom) return state;

    const removedBlockIds = new Set(
      state.pages.flatMap((page) => page.blocks.filter((b) => b.componentId === action.id).map((b) => b.id)),
    );
    return {
      ...state,
      ...withoutScope(state, { kind: "component", componentId: action.id }),
      components: state.components.filter((c) => c.id !== action.id),
      // Los bloques que usaban el componente desaparecen de todas las páginas.
      pages: state.pages.map((page) => ({
        ...page,
        blocks: page.blocks.filter((b) => b.componentId !== action.id),
      })),
      selectedId: removedBlockIds.has(state.selectedId) ? TITLE_SELECTION : state.selectedId,
    };
  },

  "link/set": (state, action) => {
    const component = state.components.find((c) => c.id === action.componentId);
    if (!component || !component.elements.some((e) => e.id === action.elementId)) return state;

    const link = action.link && checkLink(state, action.link);
    if (action.link && !link) return state;

    const links = { ...component.links };
    if (link) links[action.elementId] = link;
    else delete links[action.elementId];

    return {
      ...state,
      components: state.components.map((c) => (c.id === component.id ? { ...c, links } : c)),
    };
  },

  "nav/transition": (state, action) => ({
    ...state,
    navigation: { defaultTransition: normalizeTransition(action.transition) },
  }),

  "variable/save": (state, action) => ({ ...state, variables: saveVariable(state.variables, action.variable) }),

  "variable/delete": (state, action) => ({ ...state, variables: state.variables.filter((v) => v.id !== action.id) }),

  "rule/set": (state, action) => ({
    ...state,
    rules: setRuleProp(state.rules, action.scope, action.target, action.prop, action.value),
  }),

  "rule/clear": (state, action) => ({ ...state, rules: clearRule(state.rules, action.scope, action.target) }),
};

export function siteReducer(state: SiteState, action: SiteAction): SiteState {
  // TypeScript no puede relacionar el tipo de la acción con su manejador, pero `Handlers` lo garantiza.
  const handle = HANDLERS[action.type] as (state: SiteState, action: SiteAction) => SiteState;
  return handle(state, action);
}

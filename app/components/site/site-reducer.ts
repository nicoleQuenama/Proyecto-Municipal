import { dropLinksToPage, normalizeExternalUrl, normalizeTransition } from "../navigation/links";
import { INITIAL_STATE as INITIAL_TITLE } from "../title-editor/constants";
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

export function siteReducer(state: SiteState, action: SiteAction): SiteState {
  switch (action.type) {
    case "page/create": {
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
      };
    }

    case "page/rename": {
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
    }

    case "page/delete": {
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
    }

    case "page/select":
      if (!state.pages.some((p) => p.id === action.id) || action.id === state.currentPageId) {
        return state;
      }
      return { ...state, currentPageId: action.id, selectedId: TITLE_SELECTION };

    case "title/patch":
      return updateCurrentPage(state, (page) => ({
        ...page,
        title: { ...page.title, ...action.patch },
      }));

    case "title/reset":
      return updateCurrentPage(state, (page) => ({
        ...page,
        title: { ...INITIAL_TITLE, text: page.title.text },
      }));

    case "media/add":
      return updateCurrentPage(state, (page) => ({ ...page, media: [...page.media, action.item] }));

    case "media/remove":
      return updateCurrentPage(state, (page) => ({
        ...page,
        media: page.media.filter((item) => item.id !== action.id),
      }));

    case "block/add": {
      if (!state.components.some((c) => c.id === action.componentId)) return state;

      const next = updateCurrentPage(state, (page) => ({
        ...page,
        blocks: [...page.blocks, { id: action.id, componentId: action.componentId }],
      }));
      return { ...next, selectedId: action.id };
    }

    case "block/remove": {
      const next = updateCurrentPage(state, (page) => ({
        ...page,
        blocks: page.blocks.filter((block) => block.id !== action.id),
      }));
      return {
        ...next,
        selectedId: state.selectedId === action.id ? TITLE_SELECTION : state.selectedId,
      };
    }

    case "block/select":
      return { ...state, selectedId: action.id };

    case "component/save": {
      const exists = state.components.some((c) => c.id === action.component.id);
      return {
        ...state,
        components: exists
          ? state.components.map((c) => (c.id === action.component.id ? action.component : c))
          : [...state.components, action.component],
      };
    }

    case "component/delete": {
      const component = state.components.find((c) => c.id === action.id);
      if (!component?.custom) return state;

      const removedBlockIds = new Set(
        state.pages.flatMap((page) =>
          page.blocks.filter((b) => b.componentId === action.id).map((b) => b.id),
        ),
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
    }

    case "link/set": {
      const component = state.components.find((c) => c.id === action.componentId);
      if (!component || !component.elements.some((e) => e.id === action.elementId)) return state;

      let link = action.link;
      if (link?.kind === "page") {
        const { pageId } = link;
        if (!state.pages.some((p) => p.id === pageId)) return state;
        link = link.transition ? { ...link, transition: normalizeTransition(link.transition) } : link;
      } else if (link?.kind === "external") {
        // Vacío vale mientras el enlace se está creando; si hay texto, debe ser una URL válida.
        const url = link.url.trim() === "" ? "" : normalizeExternalUrl(link.url);
        if (url === null) return state;
        link = { ...link, url };
      }

      const links = { ...component.links };
      if (link) links[action.elementId] = link;
      else delete links[action.elementId];

      return {
        ...state,
        components: state.components.map((c) => (c.id === component.id ? { ...c, links } : c)),
      };
    }

    case "nav/transition":
      return { ...state, navigation: { defaultTransition: normalizeTransition(action.transition) } };

    case "variable/save":
      return { ...state, variables: saveVariable(state.variables, action.variable) };

    case "variable/delete":
      return { ...state, variables: state.variables.filter((v) => v.id !== action.id) };

    case "rule/set":
      return { ...state, rules: setRuleProp(state.rules, action.scope, action.target, action.prop, action.value) };

    case "rule/clear":
      return { ...state, rules: clearRule(state.rules, action.scope, action.target) };
  }
}

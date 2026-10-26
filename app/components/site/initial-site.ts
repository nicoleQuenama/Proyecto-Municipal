import { INITIAL_STATE as INITIAL_TITLE } from "../title-editor/constants";
import { DEFAULT_TRANSITION } from "../navigation/links";
import { CODE_COMPONENT } from "./component-templates";
import type { Variable } from "../styles/types";
import { TITLE_SELECTION, type Page, type SiteState } from "./types";

/** Datos de ejemplo del sitio para el prototipo. */

const page = (
  id: string,
  name: string,
  overrides: Partial<Page> = {},
): Page => ({
  id,
  name,
  slug: id,
  isHome: false,
  title: { ...INITIAL_TITLE, text: name },
  media: [],
  blocks: [],
  ...overrides,
});

const variable = (
  id: string,
  name: string,
  kind: Variable["kind"],
  value: string,
): Variable => ({ id, scope: { kind: "global" }, name, kind, value });

export const INITIAL_SITE: SiteState = {
  navigation: { defaultTransition: DEFAULT_TRANSITION },
  // Variables globales de partida (como un :root). No hay reglas hasta que se definan.
  variables: [
    variable("v-primario", "color-primario", "color", "#0d99ff"),
    variable("v-fondo", "color-fondo", "color", "#f8fafc"),
    variable("v-espacio", "espacio", "size", "16px"),
    variable("v-radio", "radio", "size", "12px"),
  ],
  rules: [],
  currentPageId: "inicio",
  selectedId: TITLE_SELECTION,
  selectedElementId: null,
  libraries: [],
  globalCss: "",
  functions: [],
  sources: [],
  // Sin componentes de ejemplo: «Restaurar los componentes de ejemplo» los devuelve. El de código lo necesita el editor.
  components: [CODE_COMPONENT],
  pages: [
    page("inicio", "Inicio", { isHome: true, title: INITIAL_TITLE }),
    page("servicios", "Servicios"),
    page("tramites", "Trámites", { slug: "tramites" }),
    page("contacto", "Contacto"),
  ],
};

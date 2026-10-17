import type { PropKind, StyleProp, StyleTarget, VariableKind } from "./types";

/** Catálogo de propiedades que se pueden definir en una regla. */
export const PROP_DEFS: Record<StyleProp, { label: string; kind: PropKind }> = {
  padding: { label: "Relleno (padding)", kind: "size" },
  margin: { label: "Margen (margin)", kind: "size" },
  gap: { label: "Espacio entre bloques", kind: "size" },
  background: { label: "Fondo", kind: "color" },
  radius: { label: "Esquinas redondeadas", kind: "size" },
  fill: { label: "Color de relleno", kind: "color" },
  color: { label: "Color de texto", kind: "color" },
  fontFamily: { label: "Tipografía", kind: "font" },
  fontSize: { label: "Tamaño de letra", kind: "size" },
  fontWeight: { label: "Peso de letra", kind: "weight" },
  textAlign: { label: "Alineación", kind: "align" },
};

export type TargetGroup = "page" | "block" | "element";

/** Catálogo de tipos de elemento y qué propiedades admite cada uno. */
export const TARGET_DEFS: Record<
  StyleTarget,
  { label: string; hint: string; group: TargetGroup; props: StyleProp[] }
> = {
  page: {
    label: "Página",
    hint: "El contenedor de cada página.",
    group: "page",
    props: ["padding", "margin", "gap", "background", "color", "fontFamily"],
  },
  navigation: {
    label: "Navegación",
    hint: "La caja de cada barra de navegación.",
    group: "block",
    props: ["padding", "margin", "background", "radius"],
  },
  sections: {
    label: "Secciones",
    hint: "La caja de cada componente de tipo sección.",
    group: "block",
    props: ["padding", "margin", "background", "radius"],
  },
  cards: {
    label: "Cards",
    hint: "La caja de cada componente de tipo card.",
    group: "block",
    props: ["padding", "margin", "background", "radius"],
  },
  hero: {
    label: "Hero / CTA",
    hint: "La caja de cada componente hero o banner.",
    group: "block",
    props: ["padding", "margin", "background", "radius"],
  },
  buttons: {
    label: "Grupos de botones",
    hint: "La caja de cada componente de botones.",
    group: "block",
    props: ["padding", "margin", "background", "radius"],
  },
  heading: {
    label: "Títulos",
    hint: "Titulares de página y títulos dentro de componentes.",
    group: "element",
    props: ["fontFamily", "fontSize", "color", "fontWeight", "textAlign"],
  },
  text: {
    label: "Textos",
    hint: "Párrafos y descripciones.",
    group: "element",
    props: ["fontFamily", "fontSize", "color", "fontWeight", "textAlign"],
  },
  button: {
    label: "Botones",
    hint: "Cada botón de cualquier componente.",
    group: "element",
    props: ["fill", "color", "radius", "fontFamily", "fontSize", "fontWeight"],
  },
  link: {
    label: "Enlaces",
    hint: "Cada elemento que lleva a otra página o sitio.",
    group: "element",
    props: ["color", "fontFamily", "fontSize", "fontWeight"],
  },
  image: {
    label: "Imágenes y videos",
    hint: "Medios de la página e imágenes de componentes.",
    group: "element",
    props: ["radius"],
  },
  container: {
    label: "Fondos de tarjeta o sección",
    hint: "El panel de fondo de un componente.",
    group: "element",
    props: ["fill", "radius"],
  },
};

export const GROUP_LABELS: Record<TargetGroup, string> = {
  page: "Página",
  block: "Cajas de componente",
  element: "Elementos",
};

export const ROLE_LABELS = {
  none: "Ninguno (no sigue reglas)",
  heading: "Título",
  text: "Texto",
  button: "Botón",
  link: "Enlace",
  image: "Imagen",
  container: "Fondo",
} as const;

/** Tipo de valor de una variable → cómo se valida; coincide con el de las propiedades. */
export const VARIABLE_KIND_LABELS: Record<VariableKind, string> = {
  color: "Color",
  size: "Tamaño",
  font: "Tipografía",
};

import type { ComponentCategory } from "../site/types";

export type PanelTab = "pages" | "components" | "navigation" | "appearance" | "libraries" | "data" | "site";
export type ComponentFilter = "all" | ComponentCategory;

/** Las secciones del panel lateral, en el orden de la barra de iconos. */
export const TABS: { value: PanelTab; label: string; title: string }[] = [
  { value: "pages", label: "Páginas", title: "Páginas del sitio" },
  { value: "components", label: "Agregar", title: "Componentes para agregar a la página" },
  { value: "navigation", label: "Enlaces", title: "Navegación y enlaces entre páginas" },
  { value: "appearance", label: "Estilo", title: "Variables y reglas de estilo" },
  { value: "libraries", label: "Librerías", title: "Librerías de código" },
  { value: "data", label: "Datos", title: "APIs HTTP y sus datos" },
  { value: "site", label: "Sitio", title: "Web existente del cliente" },
];

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  navigation: "Navegación",
  sections: "Secciones",
  cards: "Cards",
  buttons: "Botones",
  hero: "Hero / CTA",
};

export const CATEGORY_ICONS: Record<ComponentCategory, string> = {
  navigation: "☰",
  sections: "▦",
  cards: "▭",
  buttons: "▬",
  hero: "▣",
};

export const FILTERS: { value: ComponentFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  ...(Object.entries(CATEGORY_LABELS) as [ComponentCategory, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];


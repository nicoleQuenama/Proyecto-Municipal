import type { ComponentCategory } from "../site/types";

export type PanelTab = "pages" | "navigation" | "components" | "appearance";
export type ComponentFilter = "all" | ComponentCategory;

export const TABS: { value: PanelTab; label: string; icon: string }[] = [
  { value: "pages", label: "Páginas", icon: "▤" },
  { value: "navigation", label: "Navegación", icon: "⇄" },
  { value: "components", label: "Componentes", icon: "❖" },
  { value: "appearance", label: "Apariencia", icon: "◐" },
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


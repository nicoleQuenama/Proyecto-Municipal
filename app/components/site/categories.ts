/**
 * Categorías de componentes. Las 5 conocidas (`BlockTarget`) tienen reglas de estilo propias para su caja
 * (ver `styles/`). Una categoría PROPIA es texto libre: solo sirve para organizar la lista, y su caja hereda
 * las reglas de «Secciones». Así crear una categoría nunca deja a un componente sin estilo.
 */

import type { BlockTarget } from "../styles/types";
import type { ComponentCategory, ComponentDef } from "./types";

export const CATEGORY_LABELS: Record<BlockTarget, string> = {
  navigation: "Navegación",
  sections: "Secciones",
  cards: "Cards",
  buttons: "Botones",
  hero: "Hero / CTA",
};

export const CATEGORY_ICONS: Record<BlockTarget, string> = {
  navigation: "☰",
  sections: "▦",
  cards: "▭",
  buttons: "▬",
  hero: "▣",
};

/** Qué reglas de caja siguen las categorías propias. */
const CUSTOM_STYLE_TARGET: BlockTarget = "sections";
const CUSTOM_ICON = "◇";

export const isKnownCategory = (category: ComponentCategory): category is BlockTarget => category in CATEGORY_LABELS;

/** La categoría cuyas reglas de estilo se aplican a la caja del componente. */
export const styleTarget = (category: ComponentCategory): BlockTarget =>
  isKnownCategory(category) ? category : CUSTOM_STYLE_TARGET;

export const categoryLabel = (category: ComponentCategory): string =>
  isKnownCategory(category) ? CATEGORY_LABELS[category] : category;

export const categoryIcon = (category: ComponentCategory): string =>
  isKnownCategory(category) ? CATEGORY_ICONS[category] : CUSTOM_ICON;

/** Las categorías que tienen al menos un componente: primero las conocidas, luego las propias por orden alfabético. */
export function usedCategories(components: Pick<ComponentDef, "category">[]): ComponentCategory[] {
  const used = new Set(components.map((component) => component.category));
  const known = (Object.keys(CATEGORY_LABELS) as BlockTarget[]).filter((category) => used.has(category));
  const own = [...used].filter((category) => !isKnownCategory(category)).sort((a, b) => a.localeCompare(b, "es"));
  return [...known, ...own];
}

/** Lo que se puede elegir al crear un componente: las 5 conocidas, las propias ya creadas y la que se está editando. */
export function categoryChoices(components: Pick<ComponentDef, "category">[], current: ComponentCategory): ComponentCategory[] {
  const own = usedCategories(components).filter((category) => !isKnownCategory(category));
  const extra = isKnownCategory(current) || own.includes(current) || !current ? [] : [current];
  return [...(Object.keys(CATEGORY_LABELS) as ComponentCategory[]), ...own, ...extra];
}

/** Limpia el nombre de una categoría propia: sin espacios sobrantes y de hasta 24 letras. */
export const normalizeCategory = (input: string): string => input.trim().replace(/\s+/g, " ").slice(0, 24);

import type { CSSProperties } from "react";
import type { Align, TitleState } from "../title-editor/types";
import type { CanvasElement, ComponentDef } from "../site/types";
import { computeStyle } from "./resolve";
import type { ResolvedStyle, StyleContext, StyleState } from "./types";

/** "12px" → 12; si no es un número usa el valor de respaldo. */
export const pixelsOf = (value: string | undefined, fallback: number): number => {
  const parsed = parseFloat(value ?? "");
  return Number.isNaN(parsed) ? fallback : parsed;
};

/** Aplica sobre un elemento lo que dicen las reglas de su rol. Sin rol, el elemento no se toca. */
export function styleElement(element: CanvasElement, style: ResolvedStyle): CanvasElement {
  if (element.role === "none") return element;

  const next = { ...element };
  if (style.fill && (element.kind === "rect" || element.kind === "ellipse")) next.fill = style.fill;
  if (style.color) next.color = style.color;
  if (style.radius && (element.kind === "rect" || element.kind === "image")) {
    next.radius = pixelsOf(style.radius, element.radius);
  }
  if (style.fontFamily) next.fontFamily = style.fontFamily;
  if (style.fontSize) next.fontSize = pixelsOf(style.fontSize, element.fontSize);
  if (style.fontWeight) next.bold = Number(style.fontWeight) >= 600;
  if (style.textAlign === "left" || style.textAlign === "center" || style.textAlign === "right") {
    next.align = style.textAlign;
  }
  return next;
}

/** Un componente con las reglas de cada rol ya aplicadas a sus elementos. */
export function styleComponent(def: ComponentDef, styles: StyleState, pageId: string): ComponentDef {
  const ctx: StyleContext = { pageId, componentId: def.id };
  const byRole = new Map<string, ResolvedStyle>();

  const elements = def.elements.map((element) => {
    if (element.role === "none") return element;
    if (!byRole.has(element.role)) byRole.set(element.role, computeStyle(styles, ctx, element.role));
    return styleElement(element, byRole.get(element.role)!);
  });
  return { ...def, elements };
}

/** Propiedades de caja de una regla (página o caja de componente) como estilo CSS. */
export function boxStyle(style: ResolvedStyle): CSSProperties {
  const css: CSSProperties = {};
  if (style.padding) css.padding = style.padding;
  if (style.margin) css.margin = style.margin;
  if (style.background) css.background = style.background;
  if (style.radius) css.borderRadius = style.radius;
  if (style.color) css.color = style.color;
  if (style.fontFamily) css.fontFamily = style.fontFamily;
  return css;
}

/** Propiedades del titular que vienen de las reglas de «Títulos» cuando sigue los estilos del sitio. */
export const TITLE_STYLE_KEYS = [
  "font",
  "size",
  "bold",
  "color",
  "align",
] as const satisfies readonly (keyof TitleState)[];

/**
 * El titular tal como se ve: si sigue los estilos del sitio, las reglas de «Títulos»
 * mandan sobre sus valores propios; si no, se muestra lo que tiene guardado.
 */
export function titleWithRules(title: TitleState, style: ResolvedStyle): TitleState {
  if (!title.applyToSite) return title;

  const align: Align | undefined =
    style.textAlign === "left" || style.textAlign === "center" || style.textAlign === "right"
      ? style.textAlign
      : undefined;

  return {
    ...title,
    font: style.fontFamily ?? title.font,
    size: style.fontSize ? pixelsOf(style.fontSize, title.size) : title.size,
    bold: style.fontWeight ? Number(style.fontWeight) >= 600 : title.bold,
    color: style.color ?? title.color,
    align: align ?? title.align,
  };
}

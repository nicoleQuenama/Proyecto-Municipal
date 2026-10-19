/** Reglas puras de enlaces y transiciones (sin React). */

import type { CanvasElement, ComponentDef, Page } from "../site/types";
import type { LinkTarget, Transition, TransitionKind } from "./types";

export const TRANSITION_LABELS: Record<TransitionKind, string> = {
  none: "Sin animación",
  fade: "Desvanecer",
  slide: "Deslizar",
  zoom: "Zoom",
};

export const MIN_TRANSITION_SECONDS = 0.1;
export const MAX_TRANSITION_SECONDS = 5;
export const DEFAULT_TRANSITION: Transition = { kind: "fade", seconds: 0.4 };

/** Segundos entre 0,1 y 5 con un decimal; «sin animación» siempre dura 0. */
export function normalizeTransition(transition: Transition): Transition {
  if (transition.kind === "none") return { kind: "none", seconds: 0 };

  const seconds = Number.isFinite(transition.seconds) ? transition.seconds : DEFAULT_TRANSITION.seconds;
  const clamped = Math.min(MAX_TRANSITION_SECONDS, Math.max(MIN_TRANSITION_SECONDS, seconds));
  return { kind: transition.kind, seconds: Math.round(clamped * 10) / 10 };
}

export const describeTransition = (transition: Transition): string =>
  transition.kind === "none"
    ? TRANSITION_LABELS.none
    : `${TRANSITION_LABELS[transition.kind]} · ${transition.seconds} s`;

/** La transición que vale para un enlace: la suya, o la del sitio. */
export function resolveTransition(link: LinkTarget, fallback: Transition): Transition {
  return normalizeTransition(link.kind === "page" && link.transition ? link.transition : fallback);
}

const DOMAIN = /^[\w-]+(\.[\w-]+)+(\/\S*)?$/;

/**
 * Valida un enlace externo: http(s), mailto: o tel:. Si falta el protocolo en algo que parece
 * un dominio («ejemplo.com») se completa con https://. Devuelve null si no es válido.
 */
export function normalizeExternalUrl(input: string): string | null {
  const text = input.trim();
  if (!text) return null;

  if (/^mailto:/i.test(text)) return /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(text) ? text : null;
  if (/^tel:/i.test(text)) return /^tel:\+?[\d-]{5,}$/i.test(text) ? text : null;
  if (/\s/.test(text)) return null;

  const withScheme = /^https?:\/\//i.test(text) ? text : DOMAIN.test(text) ? `https://${text}` : null;
  if (!withScheme) return null;

  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? withScheme : null;
  } catch {
    return null;
  }
}

/** Texto corto de a dónde lleva un enlace. */
export function linkLabel(link: LinkTarget, pages: Page[]): string {
  if (link.kind === "external") return `↗ ${link.url || "(sin URL)"}`;
  const page = pages.find((p) => p.id === link.pageId);
  return `→ ${page ? page.name : "(página eliminada)"}`;
}

/** Resumen para el historial de versiones: destino y, si la tiene, su transición propia. */
export function linkSummary(link: LinkTarget, pages: Page[]): string {
  const base = linkLabel(link, pages);
  if (link.kind === "external") return link.newTab ? `${base} (pestaña nueva)` : base;
  return link.transition ? `${base} · ${describeTransition(normalizeTransition(link.transition))}` : base;
}

/** Cualquier elemento con texto o una imagen puede ser un enlace. */
export const isLinkable = (element: CanvasElement): boolean =>
  element.kind === "image" || element.text.trim() !== "";

const KIND_NAMES = { rect: "Botón", ellipse: "Forma", text: "Texto", image: "Imagen", video: "Video" } as const;

export function elementLabel(element: CanvasElement): string {
  const text = element.text.trim().replace(/\s+/g, " ");
  const short = text.length > 22 ? `${text.slice(0, 21)}…` : text;
  return short ? `${KIND_NAMES[element.kind]} «${short}»` : KIND_NAMES[element.kind];
}

/** Quita los enlaces de elementos que ya no existen. */
export function pruneLinks(
  links: Record<string, LinkTarget>,
  elements: CanvasElement[],
): Record<string, LinkTarget> {
  const ids = new Set(elements.map((element) => element.id));
  return Object.fromEntries(Object.entries(links).filter(([id]) => ids.has(id)));
}

/** Quita los enlaces que llevan a una página que se eliminó. */
export function dropLinksToPage(
  links: Record<string, LinkTarget>,
  pageId: string,
): Record<string, LinkTarget> {
  return Object.fromEntries(
    Object.entries(links).filter(([, link]) => !(link.kind === "page" && link.pageId === pageId)),
  );
}

/** Cambia los ids de elemento de un conjunto de enlaces (al duplicar un componente). */
export function remapLinks(
  links: Record<string, LinkTarget>,
  idMap: Record<string, string>,
): Record<string, LinkTarget> {
  return Object.fromEntries(
    Object.entries(links).flatMap(([id, link]) => (idMap[id] ? [[idMap[id], link] as const] : [])),
  );
}

export interface FlowEdge {
  from: string;
  to: string;
  /** Cuántos enlaces distintos van de una página a la otra. */
  count: number;
}

/** Los enlaces de página a página que salen de lo que hay en cada página (para el mapa de flujo). */
export function flowEdges(pages: Page[], components: ComponentDef[]): FlowEdge[] {
  const pageIds = new Set(pages.map((page) => page.id));
  const edges: FlowEdge[] = [];

  for (const page of pages) {
    const counts = new Map<string, number>();

    for (const block of page.blocks) {
      const def = components.find((c) => c.id === block.componentId);
      if (!def) continue;

      for (const [elementId, link] of Object.entries(def.links)) {
        const exists = def.elements.some((element) => element.id === elementId);
        if (link.kind !== "page" || !exists || link.pageId === page.id || !pageIds.has(link.pageId)) continue;
        counts.set(link.pageId, (counts.get(link.pageId) ?? 0) + 1);
      }
    }

    for (const [to, count] of counts) edges.push({ from: page.id, to, count });
  }
  return edges;
}

/** Cuántos enlaces externos hay en una página. */
export function externalLinkCount(page: Page, components: ComponentDef[]): number {
  return page.blocks.reduce((total, block) => {
    const def = components.find((c) => c.id === block.componentId);
    if (!def) return total;
    return (
      total +
      Object.entries(def.links).filter(
        ([id, link]) => link.kind === "external" && def.elements.some((e) => e.id === id),
      ).length
    );
  }, 0);
}

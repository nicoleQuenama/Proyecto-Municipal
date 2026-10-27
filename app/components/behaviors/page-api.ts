import { normalizeExternalUrl } from "../navigation/links";
import type { LinkTarget } from "../navigation/types";
import { PLACE_KEY, SECTION_KEY, type Page } from "../site/types";
import { animateElement, EFFECTS } from "./effects";
import type { SandboxApi } from "./sandbox";
import type { EffectName } from "./types";

const DEFAULT_SECONDS = 0.5;

/** Con qué trabaja el código de una interacción: el elemento que la disparó y el sitio. */
export interface ApiEnv {
  element: HTMLElement | null;
  /** El bloque al que pertenece; `show`, `hide`, `toggle` y `query` buscan dentro de él. */
  blockId: string;
  pages: Page[];
  followLink: (link: LinkTarget) => void;
}

/**
 * Lo que ofrece el sitio al código que corre en la página: todo lo de `SandboxApi` y además acceso al DOM
 * de su sección (el código aislado no puede tocar el DOM, así que no lo tiene).
 */
export interface PageApi extends SandboxApi {
  /** La sección a la que pertenece el código (o la página, en el código de una página). */
  readonly section: HTMLElement | null;
  /** Busca dentro de la sección: `api.query('[data-el="id"]')`. */
  query: (selector: string) => HTMLElement | null;
  queryAll: (selector: string) => HTMLElement[];
}

const targetSelector = (blockId: string, key: string) => `[data-target="${CSS.escape(`${blockId}:${key}`)}"]`;

/** Prefijo del destino que es otra sección de la página: `@` + el id del bloque. */
export const OTHER_SECTION = "@";

/** El destino: una parte de esta sección o, con `@`, otra sección entera (primero su sitio colocado, si lo tiene). */
function findTarget(blockId: string, key: string): HTMLElement | null {
  if (!key.startsWith(OTHER_SECTION)) return document.querySelector<HTMLElement>(targetSelector(blockId, key));
  const other = key.slice(OTHER_SECTION.length);
  return document.querySelector<HTMLElement>(`${targetSelector(other, PLACE_KEY)}, ${targetSelector(other, SECTION_KEY)}`);
}

/** Muestra, oculta o alterna una parte del bloque (solo mientras se prueba el sitio). */
export function setVisibility(blockId: string, key: string, mode: "show" | "hide" | "toggle") {
  const target = findTarget(blockId, key);
  if (!target) return;

  const hide = mode === "hide" || (mode === "toggle" && target.style.display !== "none");
  target.style.display = hide ? "none" : "";
}

export function openUrl(url: string) {
  const safe = normalizeExternalUrl(url);
  if (safe) window.open(safe, "_blank", "noopener,noreferrer");
}

/**
 * Lo que el código de una interacción puede pedir a la página (`api.navigate(…)`, `api.animate(…)`…).
 * Es lo mismo en los dos modos de ejecución, salvo el acceso al DOM, que solo existe en la página.
 */
export function createApi({ element, blockId, pages, followLink }: ApiEnv): PageApi {
  const key = (target?: string) => target ?? SECTION_KEY;
  // Los bloques se buscan por su id; el código de una página (sin bloque) busca dentro de la propia página.
  const section = () => (blockId ? document.querySelector<HTMLElement>(targetSelector(blockId, SECTION_KEY)) : element);

  return {
    get section() {
      return section();
    },
    query: (selector) => section()?.querySelector<HTMLElement>(selector) ?? null,
    queryAll: (selector) => [...(section()?.querySelectorAll<HTMLElement>(selector) ?? [])],
    navigate: (name) => {
      const wanted = String(name).toLowerCase();
      const page = pages.find((p) => p.slug === wanted || p.name.toLowerCase() === wanted || p.id === wanted);
      if (page) followLink({ kind: "page", pageId: page.id });
    },
    animate: (effect, seconds) => {
      if (effect in EFFECTS) animateElement(element, effect as EffectName, Number(seconds) || DEFAULT_SECONDS);
    },
    show: (target) => setVisibility(blockId, key(target), "show"),
    hide: (target) => setVisibility(blockId, key(target), "hide"),
    toggle: (target) => setVisibility(blockId, key(target), "toggle"),
    openUrl: (url) => openUrl(String(url)),
    log: (...values) => console.log("[interacción]", ...values),
  };
}

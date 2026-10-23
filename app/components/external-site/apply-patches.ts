import type { Patch } from "./types";

/**
 * Aplica los cambios a un documento. IMPORTANTE: se publica como texto (`toString()`) dentro del script que
 * se instala en la web del cliente, así que debe ser autónoma: nada de imports ni de código fuera de ella.
 * El editor la usa tal cual, y es idempotente: deshace lo anterior antes de aplicar, para poder repetirla.
 */
export function applyPatches(doc: Document, patches: Patch[], path: string, autoResponsive: boolean): void {
  type Saved = { html?: string; attrs: Map<string, string | null> };
  type Tracked = Element & { __cms?: Saved };

  const AUTO_CSS =
    "img,video,iframe,svg,canvas{max-width:100%}img,video{height:auto}table{max-width:100%}pre{overflow-x:auto}";
  const MEDIA = { all: "", tablet: "@media (max-width:1023px)", mobile: "@media (max-width:599px)" };
  const TAGS = ["p", "h2", "h3", "div", "span"];
  const safe = (text: string) => !/[{}<>;]/.test(text);
  const find = (selector: string): Tracked[] => {
    try {
      return Array.from(doc.querySelectorAll(selector));
    } catch {
      return [];
    }
  };

  // Deshace lo aplicado antes: elementos añadidos, textos y atributos originales.
  doc.querySelectorAll("[data-cms-added]").forEach((node) => node.remove());
  for (const el of find("[data-cms-touched]")) {
    const saved = el.__cms;
    if (saved?.html !== undefined) el.innerHTML = saved.html;
    saved?.attrs.forEach((value, name) => (value === null ? el.removeAttribute(name) : el.setAttribute(name, value)));
    el.removeAttribute("data-cms-touched");
    delete el.__cms;
  }

  const remember = (el: Tracked): Saved => {
    el.__cms ??= { attrs: new Map() };
    el.setAttribute("data-cms-touched", "");
    return el.__cms;
  };

  // Cada tipo de cambio sobre el DOM. Los de estilo y ocultar se aplican con CSS (más abajo).
  const APPLY: Record<Patch["kind"], (el: Tracked, patch: Patch) => void> = {
    text: (el, { value }) => {
      const saved = remember(el);
      saved.html ??= el.innerHTML;
      el.textContent = value;
    },
    attr: (el, { name, value }) => {
      const saved = remember(el);
      if (!saved.attrs.has(name)) saved.attrs.set(name, el.getAttribute(name));
      if (/^on|^style$/i.test(name) || /^\s*javascript:/i.test(value)) return;
      el.setAttribute(name, value);
    },
    insert: (el, { name, value }) => {
      const node = doc.createElement(TAGS.includes(name) ? name : "p");
      node.textContent = value;
      node.setAttribute("data-cms-added", "");
      el.after(node);
    },
    style: () => {},
    hide: () => {},
  };

  const here = patches.filter((p) => (p.path === "*" || p.path === path) && safe(p.selector));
  for (const patch of here) find(patch.selector).forEach((el) => APPLY[patch.kind](el, patch));

  // Estilos y «ocultar»: una regla por cambio, agrupadas por pantalla.
  const rule = ({ selector, kind, name, value }: Patch) =>
    kind === "hide" ? `${selector}{display:none!important}` : safe(name + value) ? `${selector}{${name}:${value}!important}` : "";
  const sheet = (Object.keys(MEDIA) as Patch["device"][])
    .map((device) => {
      const css = here.filter((p) => (p.kind === "style" || p.kind === "hide") && p.device === device).map(rule).join("");
      return css && MEDIA[device] ? `${MEDIA[device]}{${css}}` : css;
    })
    .join("");

  let style = doc.getElementById("cms-patches");
  if (!style) {
    style = doc.createElement("style");
    style.id = "cms-patches";
    doc.head.appendChild(style);
  }
  style.textContent = (autoResponsive ? AUTO_CSS : "") + sheet;

  // Sin esta etiqueta, el móvil dibuja la página como si fuera de escritorio.
  if (autoResponsive && !doc.querySelector('meta[name="viewport"]')) {
    const meta = doc.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1";
    doc.head.appendChild(meta);
  }
}

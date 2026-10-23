import type { AddedPage } from "./types";

/**
 * Si la dirección actual es la de una página nueva, la dibuja en lugar del contenido principal del sitio.
 * Autónoma como `applyPatches` (se publica como texto). Devuelve true si mostró una página.
 */
export function showAddedPage(doc: Document, pages: AddedPage[], path: string): boolean {
  const clean = (value: string) => value.replace(/\/+$/, "") || "/";
  const page = pages.find((p) => clean(p.path) === clean(path));
  if (!page) return false;

  // El contenido se limpia: sin scripts, sin manejadores de eventos y sin enlaces javascript:.
  const template = doc.createElement("template");
  template.innerHTML = page.html;
  template.content.querySelectorAll("script,iframe,object,embed").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    for (const name of node.getAttributeNames()) {
      if (/^on/i.test(name) || /^\s*javascript:/i.test(node.getAttribute(name) ?? "")) node.removeAttribute(name);
    }
  });

  const slot = doc.querySelector("main, [data-cms-slot]") ?? doc.body;
  slot.replaceChildren(template.content);
  doc.title = page.title;
  return true;
}

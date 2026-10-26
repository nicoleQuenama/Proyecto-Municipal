import { addNoopener, canStripAll, debugLeftovers, stripDebug, unsafeNewTabLinks, usesDocumentWrite } from "../code-fixes";
import { defineRule } from "../define-rule";
import { pageElements } from "../page-elements";
import { sourcesOfPage } from "../page-sources";
import { elementLabel } from "../../navigation/links";

const toHttps = (url: string) => url.replace(/^http:\/\//i, "https://");
const insecure = (url: string | undefined) => /^http:\/\//i.test(url?.trim() ?? "");
const WHY_HTTPS = "Una dirección sin https puede ser bloqueada por el navegador dentro de una página segura, y quien la usa queda expuesto a que le cambien el contenido.";

/** Recursos pedidos por http:// en vez de https://. */
export const https = defineRule({ id: "bp-https", category: "best-practices", weight: 6, cap: 18, severity: "error" }, (site, page) => {
  const sources = sourcesOfPage(site, page)
    .filter((s) => insecure(s.url))
    .map((s) => ({
      title: `La fuente de datos «${s.name}» usa http://`,
      fixes: [{ label: "Usar https://", build: () => [{ type: "source/save" as const, source: { ...s, url: toHttps(s.url) } }] }],
    }));
  const elements = pageElements(site, page).flatMap((a) => {
    const target = { blockId: a.block.id, elementId: a.element.id };
    const link = a.link;
    if (link?.kind === "external" && insecure(link.url)) {
      const fix = { label: "Usar https://", build: () => [{ type: "link/set" as const, componentId: a.def.id, elementId: a.element.id, link: { ...link, url: toHttps(link.url) } }] };
      return [{ title: `${elementLabel(a.element)}: enlace con http://`, target, fixes: [fix] }];
    }
    return (a.element.kind === "image" || a.element.kind === "video") && insecure(a.element.src)
      ? [{ title: `${elementLabel(a.element)}: se carga por http://`, target, fixes: [] }]
      : [];
  });
  const media = page.media.filter((m) => insecure(m.src)).map((m) => ({ title: `Medio «${m.name}»: se carga por http://`, target: { mediaId: m.id }, fixes: [] }));

  return [...sources, ...elements, ...media].map((item) => ({
    ...item,
    why: WHY_HTTPS,
    how: "Cambia http:// por https:// (casi todos los sitios lo aceptan).",
  }));
});

/** Enlaces de pestaña nueva en código propio, sin `rel="noopener"`. */
export const noopener = defineRule({ id: "bp-noopener", category: "best-practices", weight: 4, cap: 8 }, (_site, page) =>
  page.blocks
    .filter((b) => b.code && unsafeNewTabLinks(b.code.html) > 0)
    .map((b) => ({
      title: `${unsafeNewTabLinks(b.code!.html)} enlace(s) externos sin rel="noopener" en un bloque de código`,
      why: "La página que se abre en la pestaña nueva podría controlar la tuya (robar o cambiar la página original).",
      how: "Añade rel=\"noopener noreferrer\" a cada enlace con target=\"_blank\".",
      target: { blockId: b.id },
      fixes: [{ label: "Añadir rel=noopener", build: () => [{ type: "block/code" as const, pageId: page.id, blockId: b.id, patch: { html: addNoopener(b.code!.html) } }] }],
    })),
);

/** Restos de depuración o JavaScript que perjudica la carga. */
export const debugCode = defineRule({ id: "bp-console", category: "best-practices", weight: 3, cap: 9 }, (site, page) => {
  const places = [
    { name: "el JavaScript de la página", js: page.js ?? "", target: undefined, save: (js: string) => ({ type: "page/code" as const, pageId: page.id, patch: { js } }) },
    ...page.blocks.filter((b) => b.code).map((b) => ({
      name: "un bloque de código", js: b.code!.js, target: { blockId: b.id },
      save: (js: string) => ({ type: "block/code" as const, pageId: page.id, blockId: b.id, patch: { js } }),
    })),
  ];
  return places.flatMap((p) => {
    const left = debugLeftovers(p.js);
    const write = usesDocumentWrite(p.js);
    const out = [];
    if (left > 0) {
      out.push({
        title: `Quedan ${left} console/debugger en ${p.name}`,
        why: "Los mensajes de depuración llenan la consola de quien visita y muestran detalles internos; Lighthouse los marca como mala práctica.",
        how: "Bórralos antes de publicar.",
        target: p.target,
        fixes: canStripAll(p.js) ? [{ label: "Quitar console y debugger", build: () => [p.save(stripDebug(p.js))] }] : [],
      });
    }
    if (write) {
      out.push({
        title: `Se usa document.write en ${p.name}`,
        why: "Frena la carga de la página y los navegadores pueden bloquearlo.",
        how: "Crea los elementos con createElement o escribe el HTML directamente.",
        target: p.target,
      });
    }
    return out;
  });
});

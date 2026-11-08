/** Dónde se usa un archivo de código, para avisar antes de eliminarlo. */

import type { SiteState } from "../site/types";
import { kindOf, sameFile, type FileRef } from "./file-ref";

type Language = "js" | "html";
interface Piece {
  ref: FileRef;
  where: string;
  text: string;
  language: Language;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Todo el código escrito del sitio que puede llamar a otro o usar sus clases, salvo el archivo que se quiere eliminar. */
function otherCode(site: SiteState, skip: FileRef): Piece[] {
  const all: Piece[] = [];
  for (const page of site.pages) {
    all.push({ ref: { kind: "page-js", pageId: page.id }, where: `el código de la página «${page.name}»`, text: page.js ?? "", language: "js" });
    for (const block of page.blocks) {
      if (block.code) {
        const where = `una sección de «${page.name}»`;
        all.push({ ref: { kind: "block-js", pageId: page.id, blockId: block.id }, where, text: block.code.js, language: "js" });
        all.push({ ref: { kind: "block-html", pageId: page.id, blockId: block.id }, where, text: block.code.html, language: "html" });
      }
      for (const behavior of block.behaviors ?? []) {
        if (behavior.action.kind !== "code") continue;
        const ref: FileRef = { kind: "behavior-js", pageId: page.id, blockId: block.id, behaviorId: behavior.id };
        all.push({ ref, where: `una interacción de «${page.name}»`, text: behavior.action.source, language: "js" });
      }
    }
  }
  for (const fn of site.functions) {
    all.push({ ref: { kind: "function", functionId: fn.id }, where: `la función ${fn.name}`, text: fn.code, language: "js" });
  }
  return all.filter((piece) => !sameFile(piece.ref, skip));
}

/** Los avisos de lo que se rompería: vacío si nada más depende de ese archivo. */
export function usageWarnings(site: SiteState, ref: FileRef): string[] {
  const warnings: string[] = [];

  if (ref.kind === "function") {
    const name = site.functions.find((fn) => fn.id === ref.functionId)?.name;
    if (!name) return warnings;
    const call = new RegExp(`(?<![\\w$.])${escape(name)}\\s*\\(`);
    const users = otherCode(site, ref).filter((piece) => piece.language === "js" && call.test(piece.text));
    if (users.length > 0) {
      warnings.push(`Se llama a «${name}()» desde ${[...new Set(users.map((u) => u.where))].join(", ")}. Dejarán de funcionar.`);
    }
    return warnings;
  }

  if (ref.kind === "global-css") warnings.push("Estos estilos se aplican a todo el sitio.");
  if (ref.kind === "page-css") warnings.push("Estos estilos se aplican a toda la página.");
  if (ref.kind === "component-css") {
    const uses = site.pages.flatMap((p) => p.blocks).filter((b) => b.componentId === ref.componentId).length;
    warnings.push(`Estos estilos son del componente y se usan en ${plural(uses, "sección", "secciones")}.`);
  }

  // Clases que define el CSS y que el HTML de los bloques usa: quedarían sin estilo.
  if (kindOf(ref).language === "css") {
    const css = kindOf(ref).read(site, ref);
    const classes = [...new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((match) => match[1]))];
    const html = otherCode(site, ref)
      .filter((piece) => piece.language === "html")
      .map((piece) => piece.text)
      .join("\n");
    const used = classes.filter((name) => new RegExp(`class\\s*=\\s*["'][^"']*(?<![\\w-])${escape(name)}(?![\\w-])`).test(html));
    if (used.length > 0) {
      warnings.push(`Define clases que usa el HTML de otras secciones: ${used.slice(0, 5).map((c) => `.${c}`).join(", ")}${used.length > 5 ? "…" : ""}.`);
    }
  }

  return warnings;
}

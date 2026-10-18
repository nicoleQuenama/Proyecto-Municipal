/**
 * Los archivos del editor de código. No existen en disco: cada uno es un trozo de código del sitio
 * (el CSS global, el JavaScript de una página, el HTML de un bloque de código…) que el editor muestra
 * como archivo y guarda de vuelta en su sitio. `FILE_KINDS` define cómo se lee y se escribe cada tipo.
 */

import { SECTION_KEY, type CodeSource, type FunctionScope, type SiteAction, type SiteState } from "../site/types";
import { declaredName, type CallSite } from "../functions/scope";
import { elementLabel } from "../navigation/links";

export type CodeLanguage = "html" | "css" | "typescript";

export type FileRef =
  | { kind: "global-css" }
  | { kind: "page-css"; pageId: string }
  | { kind: "page-js"; pageId: string }
  | { kind: "block-html"; pageId: string; blockId: string }
  | { kind: "block-css"; pageId: string; blockId: string }
  | { kind: "block-js"; pageId: string; blockId: string }
  | { kind: "custom-css"; pageId: string; blockId: string; key: string }
  | { kind: "component-css"; componentId: string; key: string }
  | { kind: "behavior-js"; pageId: string; blockId: string; behaviorId: string }
  | { kind: "function"; functionId: string };

export type FileKindName = FileRef["kind"];

interface FileKind<R extends FileRef> {
  language: CodeLanguage;
  /** El nombre corto del archivo; `null` si lo que representa ya no existe. */
  name: (site: SiteState, ref: R) => string | null;
  read: (site: SiteState, ref: R) => string;
  write: (site: SiteState, ref: R, value: string) => SiteAction;
  /** Desde dónde llama este código a las funciones reutilizables; `null` si no puede llamarlas. */
  callSite: (site: SiteState, ref: R) => CallSite | null;
  /** En qué alcances se puede convertir código seleccionado en una función. Vacío si no se puede. */
  scopes: (site: SiteState, ref: R) => FunctionScope[];
}

const pageOf = (site: SiteState, pageId: string) => site.pages.find((p) => p.id === pageId);
const blockOf = (site: SiteState, pageId: string, blockId: string) =>
  pageOf(site, pageId)?.blocks.find((b) => b.id === blockId);

/** Un archivo del código de un bloque de código: HTML, CSS o JavaScript. */
const blockFile = <R extends Extract<FileRef, { blockId: string; pageId: string }> & { kind: string }>(
  field: keyof Pick<CodeSource, "html" | "css" | "js">,
  language: CodeLanguage,
  fileName: string,
  extractable: boolean,
): FileKind<R> => ({
  language,
  name: (site, ref) => {
    const owner = blockOf(site, ref.pageId, ref.blockId)?.code ? ownerName(site, ref.pageId, ref.blockId) : null;
    return owner && `${owner} · ${fileName}`;
  },
  read: (site, ref) => blockOf(site, ref.pageId, ref.blockId)?.code?.[field] ?? "",
  write: (_site, ref, value) => ({
    type: "block/code",
    pageId: ref.pageId,
    blockId: ref.blockId,
    patch: { [field]: value },
  }),
  callSite: (_site, ref) => ({ blockId: ref.blockId }),
  scopes: (_site, ref) =>
    extractable ? [{ kind: "global" }, { kind: "block", blockId: ref.blockId }] : [],
});

/** De quién es un archivo, en palabras: «Botón «Empezar»» o el nombre de la sección. */
function ownerName(site: SiteState, pageId: string, blockId: string, key: string = SECTION_KEY): string | null {
  const block = blockOf(site, pageId, blockId);
  const def = site.components.find((c) => c.id === block?.componentId);
  if (!def) return null;
  const element = key === SECTION_KEY ? undefined : def.elements.find((e) => e.id === key);
  return element ? elementLabel(element) : def.name;
}

export const FILE_KINDS: { [K in FileKindName]: FileKind<Extract<FileRef, { kind: K }>> } = {
  "global-css": {
    language: "css",
    name: () => "Todo el sitio · estilos.css",
    read: (site) => site.globalCss,
    write: (_site, _ref, css) => ({ type: "global-css/set", css }),
    callSite: () => null,
    scopes: () => [],
  },

  "page-css": {
    language: "css",
    name: (site, ref) => {
      const page = pageOf(site, ref.pageId);
      return page ? `Página ${page.name} · estilos.css` : null;
    },
    read: (site, ref) => pageOf(site, ref.pageId)?.css ?? "",
    write: (_site, ref, css) => ({ type: "page/code", pageId: ref.pageId, patch: { css } }),
    callSite: () => null,
    scopes: () => [],
  },

  "page-js": {
    language: "typescript",
    name: (site, ref) => {
      const page = pageOf(site, ref.pageId);
      return page ? `Página ${page.name} · código.ts` : null;
    },
    read: (site, ref) => pageOf(site, ref.pageId)?.js ?? "",
    write: (_site, ref, js) => ({ type: "page/code", pageId: ref.pageId, patch: { js } }),
    callSite: () => ({}),
    scopes: () => [{ kind: "global" }],
  },

  "block-html": blockFile("html", "html", "estructura.html", false),
  "block-css": blockFile("css", "css", "estilos.css", false),
  "block-js": blockFile("js", "typescript", "código.ts", true),

  "custom-css": {
    language: "css",
    name: (site, ref) => {
      const owner = ownerName(site, ref.pageId, ref.blockId, ref.key);
      return owner && `${owner} · estilos.css`;
    },
    read: (site, ref) => blockOf(site, ref.pageId, ref.blockId)?.custom?.[ref.key]?.css ?? "",
    write: (_site, ref, css) => ({
      type: "block/custom",
      pageId: ref.pageId,
      blockId: ref.blockId,
      key: ref.key,
      patch: { css },
    }),
    callSite: () => null,
    scopes: () => [],
  },

  "component-css": {
    language: "css",
    name: (site, ref) => {
      const def = site.components.find((c) => c.id === ref.componentId);
      if (!def) return null;
      const element = def.elements.find((e) => e.id === ref.key);
      return `Todo «${def.name}»${element ? ` › ${elementLabel(element)}` : ""} · estilos.css`;
    },
    read: (site, ref) => site.components.find((c) => c.id === ref.componentId)?.styles?.[ref.key]?.css ?? "",
    write: (_site, ref, css) => ({ type: "component/styles", componentId: ref.componentId, key: ref.key, patch: { css } }),
    callSite: () => null,
    scopes: () => [],
  },

  "behavior-js": {
    language: "typescript",
    name: (site, ref) => {
      const behaviors = blockOf(site, ref.pageId, ref.blockId)?.behaviors ?? [];
      const behavior = behaviors.find((b) => b.id === ref.behaviorId);
      const owner = behavior && ownerName(site, ref.pageId, ref.blockId, behavior.scope);
      if (!behavior || !owner) return null;

      // Sin nombre propio, se numera entre las interacciones de código del mismo destino.
      const siblings = behaviors.filter((b) => b.scope === behavior.scope && b.action.kind === "code");
      return `${owner} · ${behavior.name?.trim() || `código ${siblings.indexOf(behavior) + 1}`}.ts`;
    },
    read: (site, ref) => {
      const action = blockOf(site, ref.pageId, ref.blockId)?.behaviors?.find((b) => b.id === ref.behaviorId)?.action;
      return action?.kind === "code" ? action.source : "";
    },
    write: (site, ref, source) => {
      const behavior = blockOf(site, ref.pageId, ref.blockId)?.behaviors?.find((b) => b.id === ref.behaviorId);
      const action = behavior?.action;
      // Si la interacción ya no es de código, no hay nada que guardar: se repite lo que hay.
      const next = behavior && action?.kind === "code" ? { ...behavior, action: { ...action, source } } : behavior;
      return { type: "behavior/save", pageId: ref.pageId, blockId: ref.blockId, behavior: next! };
    },
    callSite: (site, ref) => {
      const behavior = blockOf(site, ref.pageId, ref.blockId)?.behaviors?.find((b) => b.id === ref.behaviorId);
      return {
        blockId: ref.blockId,
        elementId: behavior && behavior.scope !== SECTION_KEY ? behavior.scope : undefined,
      };
    },
    scopes: (site, ref) => {
      const behavior = blockOf(site, ref.pageId, ref.blockId)?.behaviors?.find((b) => b.id === ref.behaviorId);
      const own: FunctionScope[] = [{ kind: "global" }, { kind: "block", blockId: ref.blockId }];
      return behavior && behavior.scope !== SECTION_KEY
        ? [...own, { kind: "element", blockId: ref.blockId, elementId: behavior.scope }]
        : own;
    },
  },

  function: {
    language: "typescript",
    name: (site, ref) => {
      const fn = site.functions.find((f) => f.id === ref.functionId);
      return fn ? `${fn.name}.ts` : null;
    },
    read: (site, ref) => site.functions.find((f) => f.id === ref.functionId)?.code ?? "",
    write: (site, ref, code) => {
      const fn = site.functions.find((f) => f.id === ref.functionId)!;
      // Si cambia el nombre declarado, la función pasa a llamarse así.
      return { type: "function/save", fn: { ...fn, code, name: declaredName(code) ?? fn.name } };
    },
    callSite: (site, ref) => {
      const scope = site.functions.find((f) => f.id === ref.functionId)?.scope;
      if (!scope || scope.kind === "global") return {};
      return scope.kind === "block" ? { blockId: scope.blockId } : { blockId: scope.blockId, elementId: scope.elementId };
    },
    scopes: () => [],
  },
};

/** El tipo de archivo de una referencia. TypeScript no relaciona el tipo con su definición, pero `FILE_KINDS` lo garantiza. */
export const kindOf = (ref: FileRef) => FILE_KINDS[ref.kind] as FileKind<FileRef>;

/** Una identificación estable de un archivo, para pestañas y modelos del editor. */
export const fileId = (ref: FileRef): string =>
  Object.entries(ref)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

/** ¿Es el mismo archivo? */
export const sameFile = (a: FileRef, b: FileRef): boolean => fileId(a) === fileId(b);

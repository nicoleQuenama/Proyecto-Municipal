/** Qué significa «eliminar» para cada tipo de archivo del editor. Un tipo nuevo es una entrada nueva. */

import type { SiteAction, SiteState } from "../site/types";
import { FILE_KINDS, kindOf, type FileKindName, type FileRef } from "./file-ref";

export interface Removal {
  /** Lo que dice el menú. */
  label: string;
  action: SiteAction;
}

type Remover<K extends FileKindName> = (ref: Extract<FileRef, { kind: K }>, site: SiteState) => Removal | null;

/** Un archivo que desaparece del explorador al quedar vacío (se recrea desde el menú «Nuevo archivo»). */
const emptying = <K extends FileKindName>(): Remover<K> => (ref, site) => ({
  label: "Eliminar archivo",
  action: kindOf(ref as FileRef).write(site, ref as FileRef, ""),
});

/** Un archivo que es parte fija de su bloque: no puede faltar, solo quedar vacío. */
const clearing = <K extends FileKindName>(): Remover<K> => (ref, site) => ({
  label: "Vaciar archivo",
  action: kindOf(ref as FileRef).write(site, ref as FileRef, ""),
});

const REMOVERS: { [K in FileKindName]: Remover<K> } = {
  "global-css": emptying(),
  "page-css": emptying(),
  "page-js": emptying(),
  "custom-css": emptying(),
  "component-css": emptying(),
  "block-html": clearing(),
  "block-css": clearing(),
  "block-js": clearing(),
  "behavior-js": (ref) => ({
    label: "Eliminar archivo",
    action: { type: "behavior/remove", pageId: ref.pageId, blockId: ref.blockId, behaviorId: ref.behaviorId },
  }),
  // Las funciones se quitan desde su propio menú.
  function: () => null,
};

export const removalOf = (ref: FileRef, site: SiteState): Removal | null =>
  (REMOVERS[ref.kind] as (ref: FileRef, site: SiteState) => Removal | null)(ref, site);

/** Los archivos que no se muestran mientras estén vacíos (y no abiertos). */
export const HIDDEN_WHEN_EMPTY: ReadonlySet<FileKindName> = new Set<FileKindName>([
  "global-css",
  "page-css",
  "page-js",
  "custom-css",
  "component-css",
]);

/** ¿Está vacío ese archivo? */
export const isEmptyFile = (ref: FileRef, site: SiteState) => FILE_KINDS[ref.kind as FileKindName] !== undefined && kindOf(ref).read(site, ref).trim() === "";

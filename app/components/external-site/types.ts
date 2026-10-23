/** Qué hace un cambio sobre un elemento de la página que el cliente ya tiene publicada. */
export type PatchKind = "text" | "attr" | "style" | "hide" | "insert";

/** En qué pantallas vale un cambio de estilo: en todas, o solo en tablet y móvil. */
export type PatchDevice = "all" | "tablet" | "mobile";

export interface Patch {
  id: string;
  /** Ruta de la página donde vale («/contacto»), o «*» para todo el sitio. */
  path: string;
  /** Selector CSS del elemento en la página real. */
  selector: string;
  /** Nombre legible para el panel («Botón · Comprar»). */
  label: string;
  kind: PatchKind;
  /** attr: nombre del atributo; style: propiedad CSS; insert: etiqueta del elemento nuevo. */
  name: string;
  value: string;
  device: PatchDevice;
}

/** Una página nueva que el sitio del cliente aún no tiene. */
export interface AddedPage {
  id: string;
  path: string;
  title: string;
  html: string;
}

/** Lo que se publica: el script instalado en la web del cliente lo aplica al cargar cada página. */
export interface Manifest {
  version: 1;
  /** Origen del sitio del cliente («https://miweb.com»). */
  site: string;
  autoResponsive: boolean;
  patches: Patch[];
  pages: AddedPage[];
  publishedAt: string;
}

export interface ExternalState {
  /** Sitio conectado (su origen); null si no hay ninguno. */
  site: string | null;
  /** Dirección completa de la página que se está editando. */
  pageUrl: string;
  /** HTML de esa página, ya preparado para mostrarse en el editor. */
  html: string | null;
  autoResponsive: boolean;
  patches: Patch[];
  pages: AddedPage[];
}

export type ExternalAction =
  | { type: "site/connect"; site: string; pageUrl: string; html: string }
  | { type: "site/load"; pageUrl: string; html: string }
  | { type: "site/disconnect" }
  | { type: "site/auto-responsive"; on: boolean }
  | { type: "patch/save"; patch: Patch }
  | { type: "patch/remove"; id: string }
  | { type: "added-page/save"; page: AddedPage }
  | { type: "added-page/remove"; id: string };

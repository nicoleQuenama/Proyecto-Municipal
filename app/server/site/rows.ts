import type { Language } from "./code-ast.ts";

/**
 * El sitio tal como vive en la base de datos: una fila por cosa que tiene identidad (página, sección, componente…)
 * y el resto como JSON. Cada tabla se envía y se lee con estos nombres (camelCase); la base de datos los mapea a sus columnas.
 * Los ids son los que pone el editor (texto libre: `inicio`, `navbar`, un UUID…), únicos dentro de cada proyecto.
 */
type Json = Record<string, unknown>;

/** Quién es dueño de un trozo de código: el proyecto o una cosa concreta. */
export type Owner = { kind: "project" } | { kind: "page" | "block" | "component" | "function" | "source"; id: string };

/** Un trozo de código tal como lo escribió la persona; todavía no es un árbol. */
export interface CodeDraft {
  owner: Owner;
  /** Su nombre dentro del dueño: `css`, `js`, `custom.<clave>.css`, `behavior.<id>.js`… */
  slot: string;
  language: Language;
  text: string;
}

export interface PageRow {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
  role: string | null;
  position: number;
  hidden: boolean;
  route: string | null;
  title: unknown;
  settings: Json;
}

export interface BlockRow {
  id: string;
  pageId: string;
  componentId: string;
  position: number;
  hidden: boolean;
  locked: boolean;
  slot: string | null;
  scope: string | null;
  format: Json;
}

export interface MediaRow {
  id: string;
  pageId: string;
  position: number;
  kind: string;
  src: string;
  embed: boolean;
  alt: string | null;
  hidden: boolean;
  poster: string | null;
  placement: unknown;
  settings: Json;
}

export interface AnimationRow {
  id: string;
  pageId: string;
  name: string;
  position: number;
}

export interface StepRow {
  animationId: string;
  id: string;
  blockId: string;
  key: string;
  prop: string;
  from: string | number;
  to: string | number;
  start: number;
  duration: number;
  easing: string | null;
  iterations: number | null;
  direction: string | null;
  position: number;
}

export interface ComponentRow {
  id: string;
  name: string;
  description: string;
  category: string;
  width: number;
  height: number;
  elements: unknown;
  links: unknown;
  styles: Json;
  custom: boolean;
  drawn: boolean;
  position: number;
  settings: Json;
}

export interface VariableRow {
  id: string;
  scope: string;
  pageId: string | null;
  componentId: string | null;
  name: string;
  kind: string;
  value: string;
  position: number;
}

export interface RuleRow {
  scope: string;
  pageId: string | null;
  componentId: string | null;
  target: string;
  props: Json;
  position: number;
}

export interface FunctionRow {
  id: string;
  name: string;
  scopeKind: string;
  blockId: string | null;
  elementId: string | null;
  position: number;
}

export interface SourceRow {
  id: string;
  name: string;
  url: string;
  method: string;
  query: unknown;
  /** En claro aquí; la base de datos las guarda cifradas (pueden llevar claves de API). */
  headers: unknown;
  cacheKind: string;
  cacheSeconds: number;
  position: number;
}

export interface LibraryRow {
  id: string;
  name: string;
  version: string;
  source: string;
  position: number;
}

export interface CommentRow {
  id: string;
  pageId: string;
  x: number;
  y: number;
  body: string;
  audience: string;
  resolved: boolean;
  createdAt: string;
  position: number;
  /** Solo al leer: el nombre de quien lo escribió (al guardar, es quien tiene la sesión). */
  author?: string;
}

export interface ProjectRow {
  navigation: unknown;
  settings: Json;
}

/** Todo el sitio en filas. */
export interface SiteRows {
  project: ProjectRow;
  pages: PageRow[];
  blocks: BlockRow[];
  media: MediaRow[];
  animations: AnimationRow[];
  steps: StepRow[];
  components: ComponentRow[];
  variables: VariableRow[];
  rules: RuleRow[];
  functions: FunctionRow[];
  sources: SourceRow[];
  libraries: LibraryRow[];
  comments: CommentRow[];
}

/** Los textos del código ya reimpresos desde sus árboles, por dueño y ranura. */
export type CodeTexts = ReadonlyMap<string, string>;

export const ownerKey = (owner: Owner): string => (owner.kind === "project" ? "project" : `${owner.kind}:${owner.id}`);
export const codeKey = (owner: Owner, slot: string): string => `${ownerKey(owner)}|${slot}`;

import type { LinkTarget } from "../navigation/types";
import { CODE_COMPONENT_ID } from "./code-defaults";
import { type CanvasElement, type ComponentDef, type CustomStyle, type ElementKind } from "./types";

/** Valores comunes; cada tipo de elemento ajusta lo que necesita. */
const BASE: Omit<CanvasElement, "id" | "kind"> = {
  role: "none",
  x: 0,
  y: 0,
  width: 120,
  height: 80,
  fill: "#cbd5e1",
  radius: 8,
  text: "",
  fontSize: 16,
  color: "#0f172a",
  bold: false,
  align: "left",
  fontFamily: "",
  src: "",
};

const KIND_DEFAULTS: Record<ElementKind, Partial<CanvasElement>> = {
  rect: {},
  ellipse: { width: 100, height: 100 },
  triangle: { width: 100, height: 90 },
  line: { width: 120, height: 60, fill: "#0f172a", role: "none" },
  text: { width: 160, height: 32, fill: "transparent", text: "Texto", role: "text" },
  image: { width: 160, height: 120, fill: "transparent", role: "image" },
  icon: { width: 32, height: 32, fill: "transparent", icon: "star", fontSize: 24, strokeWidth: 2, role: "none" },
  video: { width: 200, height: 120, fill: "transparent", role: "image" },
};

export function newElement(kind: ElementKind, id: string, overrides: Partial<CanvasElement> = {}): CanvasElement {
  return { ...BASE, ...KIND_DEFAULTS[kind], ...overrides, id, kind };
}

type IdGenerator = () => string;

export type TemplateId = string;

export interface Template {
  id: TemplateId;
  label: string;
  width: number;
  height: number;
  styles?: Record<string, CustomStyle>;
  build: (nextId: IdGenerator) => CanvasElement[];
  /** Enlaces de partida de la plantilla, por id de elemento. */
  links?: (elements: CanvasElement[]) => Record<string, LinkTarget>;
}

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    label: "En blanco",
    width: 320,
    height: 200,
    build: () => [],
  },
];

export const templateById = (id: TemplateId): Template =>
  TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];

/** Componentes de ejemplo: vacío para trabajar en limpio desde la base de datos. */
export const EXAMPLE_COMPONENTS: ComponentDef[] = [];

/** El único componente con el que parte un proyecto nuevo: el editor lo necesita para los bloques de código. */
export const CODE_COMPONENT: ComponentDef = {
  id: CODE_COMPONENT_ID,
  name: "Bloque de código",
  description: "HTML, CSS, Tailwind y TypeScript",
  category: "sections",
  width: 320,
  height: 120,
  elements: [],
  links: {},
  custom: false,
};

export const BUILT_IN_COMPONENTS: ComponentDef[] = [...EXAMPLE_COMPONENTS, CODE_COMPONENT];

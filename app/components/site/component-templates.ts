import type { LinkTarget } from "../navigation/types";
import { CODE_COMPONENT_ID } from "./code-defaults.ts";
import type { CanvasElement, ComponentDef, CustomStyle, ElementKind } from "./types.ts";

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

/** Componente integrado para insertar una imagen como bloque de seccion en el flujo de la pagina. */
export const IMAGE_BLOCK_COMPONENT_ID = "component-image-block";

export const IMAGE_BLOCK_COMPONENT: ComponentDef = {
  id: IMAGE_BLOCK_COMPONENT_ID,
  name: "Bloque de Imagen",
  description: "Imagen de seccion adaptable al flujo de la pagina",
  category: "media",
  width: 960,
  height: 480,
  elements: [
    newElement("image", "image-content", {
      x: 0,
      y: 0,
      width: 960,
      height: 480,
      src: "",
      fit: "cover",
      alt: "Imagen de seccion",
    }),
  ],
  links: {},
  custom: false,
};

/** Componente integrado para insertar una imagen como banner horizontal completo. */
export const BANNER_COMPONENT_ID = "component-banner-block";

export const BANNER_COMPONENT: ComponentDef = {
  id: BANNER_COMPONENT_ID,
  name: "Banner de Imagen",
  description: "Banner horizontal a todo el ancho para portadas o anuncios",
  category: "sections",
  width: 1024,
  height: 380,
  elements: [
    newElement("image", "banner-image", {
      x: 0,
      y: 0,
      width: 1024,
      height: 380,
      src: "",
      fit: "cover",
      alt: "Banner de imagen",
      role: "image",
    }),
  ],
  links: {},
  custom: false,
};

export const BUILT_IN_COMPONENTS: ComponentDef[] = [
  ...EXAMPLE_COMPONENTS,
  CODE_COMPONENT,
  IMAGE_BLOCK_COMPONENT,
  BANNER_COMPONENT,
];

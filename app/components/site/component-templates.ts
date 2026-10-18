import type { LinkTarget } from "../navigation/types";
import { CODE_COMPONENT_ID } from "./code-defaults";
import type { CanvasElement, ComponentDef, ElementKind } from "./types";

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
  text: { width: 160, height: 32, fill: "transparent", text: "Texto", role: "text" },
  image: { width: 160, height: 120, fill: "transparent", role: "image" },
};

export function newElement(kind: ElementKind, id: string, overrides: Partial<CanvasElement> = {}): CanvasElement {
  return { ...BASE, ...KIND_DEFAULTS[kind], ...overrides, id, kind };
}

type IdGenerator = () => string;

export type TemplateId = "blank" | "navbar" | "card" | "section" | "buttons" | "banner" | "review";

export interface Template {
  id: TemplateId;
  label: string;
  width: number;
  height: number;
  build: (nextId: IdGenerator) => CanvasElement[];
  /** Enlaces de partida de la plantilla, por id de elemento. */
  links?: (elements: CanvasElement[]) => Record<string, LinkTarget>;
}

const ACCENT = "#0d99ff";

const NAV_ITEMS = [
  { label: "Inicio", pageId: "inicio" },
  { label: "Servicios", pageId: "servicios" },
  { label: "Trámites", pageId: "tramites" },
  { label: "Contacto", pageId: "contacto" },
];

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    label: "En blanco",
    width: 320,
    height: 200,
    build: () => [],
  },
  {
    id: "navbar",
    label: "Barra de navegación",
    width: 720,
    height: 56,
    build: (id) => [
      newElement("rect", id(), { role: "container", width: 720, height: 56, fill: "#0f172a", radius: 0 }),
      newElement("text", id(), { x: 24, y: 15, width: 150, height: 26, text: "Alcaldía", fontSize: 18, bold: true, color: "#ffffff", role: "heading" }),
      ...NAV_ITEMS.map((item, index) =>
        newElement("text", id(), { x: 300 + index * 104, y: 17, width: 96, height: 22, text: item.label, fontSize: 15, color: "#cbd5e1", role: "link", align: "center" }),
      ),
    ],
    // Cada opción del menú lleva a la página que se llama igual.
    links: (elements) =>
      Object.fromEntries(
        NAV_ITEMS.flatMap((item) => {
          const element = elements.find((e) => e.role === "link" && e.text === item.label);
          return element ? [[element.id, { kind: "page", pageId: item.pageId } as LinkTarget]] : [];
        }),
      ),
  },
  {
    id: "card",
    label: "Tarjeta",
    width: 320,
    height: 200,
    build: (id) => [
      newElement("rect", id(), { role: "container", width: 320, height: 200, fill: "#f1f5f9", radius: 16 }),
      newElement("rect", id(), { x: 24, y: 24, width: 48, height: 48, fill: ACCENT, radius: 12 }),
      newElement("text", id(), { x: 24, y: 88, width: 272, height: 28, text: "Título del servicio", fontSize: 20, bold: true, role: "heading" }),
      newElement("text", id(), { x: 24, y: 124, width: 272, height: 52, text: "Descripción breve de lo que ofrece este servicio.", fontSize: 14, color: "#475569" }),
    ],
  },
  {
    id: "section",
    label: "Sección",
    width: 720,
    height: 200,
    build: (id) => [
      newElement("rect", id(), { role: "container", width: 720, height: 200, fill: "#f8fafc", radius: 16 }),
      newElement("text", id(), { x: 32, y: 28, width: 656, height: 36, text: "Título de la sección", fontSize: 28, bold: true, role: "heading" }),
      newElement("text", id(), { x: 32, y: 76, width: 560, height: 48, text: "Cuenta de qué trata esta sección en dos líneas.", fontSize: 16, color: "#475569" }),
      newElement("rect", id(), { role: "button", x: 32, y: 140, width: 160, height: 44, fill: ACCENT, radius: 10, text: "Ver más", color: "#ffffff", bold: true, align: "center" }),
    ],
  },
  {
    id: "buttons",
    label: "Botones",
    width: 304,
    height: 48,
    build: (id) => [
      newElement("rect", id(), { role: "button", width: 144, height: 48, fill: ACCENT, radius: 10, text: "Principal", color: "#ffffff", bold: true, align: "center" }),
      newElement("rect", id(), { x: 160, width: 144, height: 48, fill: "#e2e8f0", radius: 10, text: "Secundario", bold: true, align: "center" }),
    ],
  },
  {
    id: "banner",
    label: "Banner",
    width: 720,
    height: 240,
    build: (id) => [
      newElement("rect", id(), { role: "container", width: 720, height: 240, fill: "#0f172a", radius: 20 }),
      newElement("text", id(), { x: 40, y: 44, width: 640, height: 48, text: "Un titular que convierte", fontSize: 36, bold: true, color: "#ffffff", role: "heading" }),
      newElement("text", id(), { x: 40, y: 108, width: 560, height: 28, text: "Explica el beneficio principal en una frase.", fontSize: 16, color: "#cbd5e1" }),
      newElement("rect", id(), { role: "button", x: 40, y: 164, width: 180, height: 48, fill: ACCENT, radius: 10, text: "Empezar", color: "#ffffff", bold: true, align: "center" }),
    ],
  },
  {
    id: "review",
    label: "Reseña",
    width: 360,
    height: 168,
    build: (id) => [
      newElement("rect", id(), { role: "container", width: 360, height: 168, fill: "#f1f5f9", radius: 16 }),
      newElement("text", id(), { x: 24, y: 20, width: 200, height: 28, text: "★★★★★", fontSize: 22, color: "#f59e0b" }),
      newElement("text", id(), { x: 24, y: 58, width: 312, height: 60, text: "“Un servicio rápido y claro. Resolví mi trámite en minutos.”", fontSize: 15 }),
      newElement("text", id(), { x: 24, y: 128, width: 312, height: 22, text: "Nombre del ciudadano", fontSize: 13, color: "#64748b", bold: true, role: "heading" }),
    ],
  },
];

export const templateById = (id: TemplateId): Template =>
  TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];

/** Componentes de fábrica de la biblioteca, construidos con las mismas plantillas. */
function builtIn(
  id: string,
  name: string,
  description: string,
  category: ComponentDef["category"],
  template: TemplateId,
): ComponentDef {
  const { width, height, build, links } = templateById(template);
  let count = 0;
  const elements = build(() => `${id}-e${++count}`);
  return {
    id,
    name,
    description,
    category,
    width,
    height,
    elements,
    links: links?.(elements) ?? {},
    custom: false,
  };
}

export const BUILT_IN_COMPONENTS: ComponentDef[] = [
  builtIn("navbar", "Barra de navegación", "Menú con enlaces a las páginas", "navigation", "navbar"),
  builtIn("card-service", "Tarjeta de Servicio", "Card con icono y texto", "cards", "card"),
  builtIn("cta-buttons", "Set de Botones CTA", "Primario + Secundario", "buttons", "buttons"),
  builtIn("reviews", "Testimonios & Reviews", "Calificación 5 estrellas", "cards", "review"),
  builtIn("hero-banner", "Banner & Hero CTA", "Conversión destacada", "hero", "banner"),
  builtIn("content-section", "Sección de contenido", "Título, texto y botón", "sections", "section"),
  {
    id: CODE_COMPONENT_ID,
    name: "Bloque de código",
    description: "HTML, CSS, Tailwind y TypeScript",
    category: "sections",
    width: 320,
    height: 120,
    elements: [],
    links: {},
    custom: false,
  },
];

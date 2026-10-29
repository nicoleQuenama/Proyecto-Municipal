import type { LinkTarget } from "../navigation/types";
import { CODE_COMPONENT_ID } from "./code-defaults";
import { SECTION_KEY, type CanvasElement, type ComponentDef, type CustomStyle, type ElementKind } from "./types";

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

export type TemplateId =
  | "blank"
  | "navbar"
  | "card"
  | "section"
  | "buttons"
  | "banner"
  | "review"
  | "grid-cards"
  | "carousel"
  | "footer"
  | "container-row"
  | "bento"
  | "stats"
  | "hero-search"
  | "search-bar";

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

const ACCENT = "#0d99ff";

const NAV_ITEMS = [
  { label: "Inicio", pageId: "inicio" },
  { label: "Trámites", pageId: "tramites" },
  { label: "Servicios", pageId: "servicios" },
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
    width: 1024,
    height: 64,
    styles: {
      [SECTION_KEY]: {
        classes: "w-full flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white shadow-md",
        css: "",
      },
    },
    build: (id) => [
      newElement("rect", id(), { role: "container", width: 1024, height: 64, fill: "#0f172a", radius: 0 }),
      newElement("rect", id(), { x: 24, y: 16, width: 32, height: 32, fill: ACCENT, radius: 8 }),
      newElement("text", id(), { x: 68, y: 18, width: 180, height: 28, text: "Portal Municipal", fontSize: 18, bold: true, color: "#ffffff", role: "heading" }),
      ...NAV_ITEMS.map((item, index) =>
        newElement("text", id(), { x: 380 + index * 84, y: 21, width: 76, height: 22, text: item.label, fontSize: 14, color: "#cbd5e1", role: "link", align: "center" }),
      ),
      newElement("rect", id(), {
        role: "button",
        x: 720,
        y: 14,
        width: 140,
        height: 36,
        fill: "#1e293b",
        radius: 8,
        text: "Buscar trámites...",
        color: "#94a3b8",
        fontSize: 12,
        bold: false,
        align: "center",
        control: { kind: "button", name: "search-trigger" },
      }),
      newElement("rect", id(), { role: "button", x: 870, y: 14, width: 130, height: 36, fill: ACCENT, radius: 8, text: "Atención Vecinal", color: "#ffffff", bold: true, align: "center" }),
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
    label: "Tarjeta de Servicio",
    width: 320,
    height: 220,
    styles: {
      [SECTION_KEY]: {
        classes: "p-2 w-fit",
        css: "",
      },
    },
    build: (id) => [
      newElement("rect", id(), { role: "container", width: 320, height: 220, fill: "#ffffff", radius: 16 }),
      newElement("rect", id(), { x: 24, y: 24, width: 44, height: 44, fill: ACCENT, radius: 12 }),
      newElement("text", id(), { x: 80, y: 36, width: 160, height: 20, text: "SERVICIO DIGITAL", fontSize: 11, bold: true, color: ACCENT }),
      newElement("text", id(), { x: 24, y: 84, width: 272, height: 26, text: "Trámite Municipal", fontSize: 18, bold: true, role: "heading", color: "#0f172a" }),
      newElement("text", id(), { x: 24, y: 116, width: 272, height: 50, text: "Inicia tu solicitud en línea sin filas, con validación inmediata y seguimiento digital.", fontSize: 13, color: "#64748b" }),
      newElement("text", id(), { x: 24, y: 178, width: 180, height: 24, text: "Iniciar trámite →", fontSize: 13, bold: true, color: ACCENT, role: "link" }),
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
    label: "Botones CTA",
    width: 324,
    height: 48,
    styles: {
      [SECTION_KEY]: {
        classes: "flex flex-row flex-wrap items-center justify-start gap-4 p-2 w-fit",
        css: "",
      },
    },
    build: (id) => [
      newElement("rect", id(), { role: "button", width: 160, height: 44, fill: ACCENT, radius: 10, text: "Acción Principal", color: "#ffffff", bold: true, align: "center" }),
      newElement("rect", id(), { role: "button", x: 176, width: 148, height: 44, fill: "#f1f5f9", radius: 10, text: "Más información", color: "#0f172a", bold: true, align: "center" }),
    ],
  },
  {
    id: "banner",
    label: "Banner Hero",
    width: 720,
    height: 270,
    styles: {
      [SECTION_KEY]: {
        classes: "w-full bg-slate-900 text-white py-14 px-6 rounded-2xl flex flex-col items-center text-center gap-4 shadow-xl",
        css: "",
      },
    },
    build: (id) => [
      newElement("rect", id(), { role: "container", width: 720, height: 270, fill: "#0f172a", radius: 20 }),
      newElement("rect", id(), { x: 270, y: 24, width: 180, height: 26, fill: "#1e293b", radius: 14 }),
      newElement("text", id(), { x: 270, y: 29, width: 180, height: 16, text: "PORTAL OFICIAL", fontSize: 11, bold: true, color: ACCENT, align: "center" }),
      newElement("text", id(), { x: 30, y: 64, width: 660, height: 72, text: "Servicios y Trámites Digitales para la Comunidad", fontSize: 28, bold: true, color: "#ffffff", role: "heading", align: "center" }),
      newElement("text", id(), { x: 60, y: 144, width: 600, height: 44, text: "Gestiona trámites, agenda citas vecinales y consulta beneficios de forma rápida y 100% en línea.", fontSize: 15, color: "#cbd5e1", align: "center" }),
      newElement("rect", id(), { role: "button", x: 270, y: 204, width: 180, height: 46, fill: ACCENT, radius: 10, text: "Iniciar Trámite", color: "#ffffff", bold: true, align: "center" }),
    ],
  },
  {
    id: "review",
    label: "Reseña",
    width: 360,
    height: 168,
    build: (id) => [
      newElement("rect", id(), { role: "container", width: 360, height: 168, fill: "#f8fafc", radius: 16 }),
      newElement("text", id(), { x: 24, y: 20, width: 200, height: 28, text: "★★★★★", fontSize: 22, color: "#f59e0b" }),
      newElement("text", id(), { x: 24, y: 58, width: 312, height: 60, text: "“Un servicio rápido y claro. Resolví mi trámite en minutos sin moverme de casa.”", fontSize: 15 }),
      newElement("text", id(), { x: 24, y: 128, width: 312, height: 22, text: "Vecino verificado · Comuna Digital", fontSize: 13, color: "#64748b", bold: true, role: "heading" }),
    ],
  },
  {
    id: "grid-cards",
    label: "Catálogo de Tarjetas (4 PC · 2 Móvil)",
    width: 960,
    height: 230,
    styles: {
      [SECTION_KEY]: {
        classes: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 w-full",
        css: "",
      },
    },
    build: (id) => {
      const items = [
        { title: "Trámites en Línea", desc: "Emisión de certificados, permisos y patentes al instante.", action: "Iniciar trámite →", color: "#0d99ff" },
        { title: "Pagos y Tributos", desc: "Pago seguro de permisos de circulación y contribuciones.", action: "Pagar en línea →", color: "#10b981" },
        { title: "Atención Vecinal", desc: "Agenda citas y consulta el estado de tus solicitudes.", action: "Consultar cita →", color: "#8b5cf6" },
        { title: "Seguridad y Avisos", desc: "Reportes comunitarios y asistencia vecinal 24/7.", action: "Ver números →", color: "#f59e0b" },
      ];
      return items.flatMap((item) => {
        const cardId = id();
        return [
          newElement("rect", cardId, { role: "container", x: 0, y: 0, width: 216, height: 210, fill: "#ffffff", radius: 16 }),
          newElement("rect", id(), { parentId: cardId, x: 16, y: 16, width: 40, height: 40, fill: item.color, radius: 10 }),
          newElement("text", id(), { parentId: cardId, x: 16, y: 68, width: 184, height: 24, text: item.title, fontSize: 16, bold: true, role: "heading", color: "#0f172a" }),
          newElement("text", id(), { parentId: cardId, x: 16, y: 96, width: 184, height: 60, text: item.desc, fontSize: 12, color: "#64748b" }),
          newElement("text", id(), { parentId: cardId, x: 16, y: 168, width: 184, height: 22, text: item.action, fontSize: 12, bold: true, color: item.color, role: "link" }),
        ];
      });
    },
  },
  {
    id: "carousel",
    label: "Carrusel de Novedades",
    width: 720,
    height: 240,
    styles: {
      [SECTION_KEY]: {
        classes: "w-full overflow-hidden",
        css: "",
      },
    },
    build: (id) => [
      newElement("rect", id(), { role: "container", width: 720, height: 240, fill: "#0f172a", radius: 20 }),
      newElement("rect", id(), { x: 36, y: 28, width: 90, height: 24, fill: ACCENT, radius: 6 }),
      newElement("text", id(), { x: 44, y: 32, width: 74, height: 16, text: "DESTACADO", fontSize: 11, bold: true, color: "#ffffff", align: "center" }),
      newElement("text", id(), { x: 36, y: 64, width: 648, height: 38, text: "Nuevas Obras y Proyectos para la Comunidad", fontSize: 26, bold: true, color: "#ffffff", role: "heading" }),
      newElement("text", id(), { x: 36, y: 110, width: 560, height: 42, text: "Descubre los avances del plan comunal de desarrollo sostenible y espacios verdes.", fontSize: 14, color: "#94a3b8" }),
      newElement("rect", id(), { role: "button", x: 36, y: 168, width: 150, height: 40, fill: ACCENT, radius: 8, text: "Ver proyecto", color: "#ffffff", bold: true, align: "center" }),
      newElement("rect", id(), { x: 600, y: 168, width: 40, height: 40, fill: "#1e293b", radius: 8, text: "‹", color: "#ffffff", fontSize: 20, bold: true, align: "center" }),
      newElement("rect", id(), { x: 648, y: 168, width: 40, height: 40, fill: "#1e293b", radius: 8, text: "›", color: "#ffffff", fontSize: 20, bold: true, align: "center" }),
    ],
  },
  {
    id: "footer",
    label: "Pie de página (Footer)",
    width: 1024,
    height: 240,
    styles: {
      [SECTION_KEY]: {
        classes: "grid grid-cols-1 md:grid-cols-3 gap-8 p-8 md:p-12 bg-slate-950 text-slate-300 border-t border-slate-800 w-full",
        css: "",
      },
    },
    build: (id) => {
      const col1 = id();
      const col2 = id();
      const col3 = id();
      return [
        // Columna 1: Identidad y Servicios Digitales
        newElement("rect", col1, { role: "container", x: 0, y: 0, width: 300, height: 210, fill: "transparent", radius: 0 }),
        newElement("text", id(), { parentId: col1, x: 0, y: 0, width: 290, height: 32, text: "Portal Municipal", fontSize: 22, bold: true, color: "#ffffff", role: "heading" }),
        newElement("text", id(), { parentId: col1, x: 0, y: 40, width: 290, height: 50, text: "Atención ciudadana, participación y servicios comunales abiertos para todos los vecinos.", fontSize: 13, color: "#94a3b8" }),
        newElement("text", id(), { parentId: col1, x: 0, y: 98, width: 290, height: 24, text: "Horario: Lun a Vie 08:30 - 17:30 hrs", fontSize: 12, color: "#64748b" }),
        newElement("text", id(), { parentId: col1, x: 0, y: 132, width: 290, height: 36, text: "© 2026 Ilustre Municipalidad. Todos los derechos reservados.", fontSize: 11, color: "#475569" }),

        // Columna 2: Trámites y Enlaces Frecuentes
        newElement("rect", col2, { role: "container", x: 0, y: 0, width: 280, height: 210, fill: "transparent", radius: 0 }),
        newElement("text", id(), { parentId: col2, x: 0, y: 0, width: 270, height: 28, text: "Trámites en Línea", fontSize: 15, bold: true, color: "#38bdf8", role: "heading" }),
        newElement("text", id(), { parentId: col2, x: 0, y: 36, width: 270, height: 24, text: "• Ventanilla Única Digital", fontSize: 13, color: "#cbd5e1", role: "link" }),
        newElement("text", id(), { parentId: col2, x: 0, y: 66, width: 270, height: 24, text: "• Pago de Patentes y Permisos", fontSize: 13, color: "#cbd5e1", role: "link" }),
        newElement("text", id(), { parentId: col2, x: 0, y: 96, width: 270, height: 24, text: "• Farmacia Comunal y Salud", fontSize: 13, color: "#cbd5e1", role: "link" }),
        newElement("text", id(), { parentId: col2, x: 0, y: 126, width: 270, height: 24, text: "• Subsidios y Becas 2026", fontSize: 13, color: "#cbd5e1", role: "link" }),

        // Columna 3: Contacto y Emergencias Comunal
        newElement("rect", col3, { role: "container", x: 0, y: 0, width: 280, height: 210, fill: "transparent", radius: 0 }),
        newElement("text", id(), { parentId: col3, x: 0, y: 0, width: 270, height: 28, text: "Contacto y Emergencias", fontSize: 15, bold: true, color: "#38bdf8", role: "heading" }),
        newElement("text", id(), { parentId: col3, x: 0, y: 36, width: 270, height: 24, text: "Emergencias: 1404 (24/7)", fontSize: 13, bold: true, color: "#f87171" }),
        newElement("text", id(), { parentId: col3, x: 0, y: 66, width: 270, height: 24, text: "Mesa Central: (600) 123-4567", fontSize: 13, color: "#cbd5e1" }),
        newElement("text", id(), { parentId: col3, x: 0, y: 96, width: 270, height: 24, text: "Portal de Transparencia Activa", fontSize: 13, color: "#94a3b8", role: "link" }),
        newElement("text", id(), { parentId: col3, x: 0, y: 126, width: 270, height: 24, text: "contacto@municipalidad.gob", fontSize: 12, color: "#64748b" }),
      ];
    },
  },
  {
    id: "container-row",
    label: "Contenedor Horizontal (3 Cards)",
    width: 960,
    height: 220,
    styles: {
      [SECTION_KEY]: {
        classes: "flex flex-row flex-wrap items-stretch justify-center gap-6 p-4 w-full",
        css: "",
      },
    },
    build: (id) => {
      const items = [
        { title: "Atención Vecinal", desc: "Consultas y requerimientos en línea.", color: "#0d99ff" },
        { title: "Trámites y Pagos", desc: "Pago ágil de permisos y contribuciones.", color: "#10b981" },
        { title: "Seguridad Ciudadana", desc: "Reportes comunitarios y asistencia 24/7.", color: "#8b5cf6" },
      ];
      return items.flatMap((item) => {
        const cardId = id();
        return [
          newElement("rect", cardId, { role: "container", x: 0, y: 0, width: 280, height: 180, fill: "#ffffff", radius: 16 }),
          newElement("rect", id(), { parentId: cardId, x: 16, y: 16, width: 40, height: 40, fill: item.color, radius: 10 }),
          newElement("text", id(), { parentId: cardId, x: 16, y: 66, width: 240, height: 26, text: item.title, fontSize: 16, bold: true, role: "heading", color: "#0f172a" }),
          newElement("text", id(), { parentId: cardId, x: 16, y: 98, width: 240, height: 60, text: item.desc, fontSize: 13, color: "#64748b" }),
        ];
      });
    },
  },
  {
    id: "bento",
    label: "Cuadrícula Bento Dinámica",
    width: 960,
    height: 340,
    styles: {
      [SECTION_KEY]: {
        classes: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[160px] grid-flow-dense gap-4 p-4 w-full",
        css: "",
      },
    },
    build: (id) => {
      const card1 = id();
      const card2 = id();
      const card3 = id();
      const card4 = id();
      return [
        // Card 1 (2 cols x 2 rows)
        newElement("rect", card1, { role: "container", x: 0, y: 0, width: 460, height: 336, fill: "#0f172a", radius: 20 }),
        newElement("rect", id(), { parentId: card1, x: 24, y: 24, width: 120, height: 24, fill: ACCENT, radius: 6 }),
        newElement("text", id(), { parentId: card1, x: 28, y: 28, width: 112, height: 16, text: "DESTACADO", fontSize: 11, bold: true, color: "#ffffff", align: "center" }),
        newElement("text", id(), { parentId: card1, x: 24, y: 68, width: 410, height: 60, text: "Postulación a Subsidios y Becas Comunales 2026", fontSize: 22, bold: true, color: "#ffffff", role: "heading" }),
        newElement("text", id(), { parentId: card1, x: 24, y: 136, width: 410, height: 64, text: "Abierto el proceso anual de financiamiento comunal para estudiantes y familias del municipio.", fontSize: 14, color: "#cbd5e1" }),
        newElement("rect", id(), { parentId: card1, role: "button", x: 24, y: 260, width: 170, height: 42, fill: ACCENT, radius: 8, text: "Postular ahora →", color: "#ffffff", bold: true, align: "center" }),

        // Card 2 (2 cols x 1 row)
        newElement("rect", card2, { role: "container", x: 0, y: 0, width: 460, height: 160, fill: "#ffffff", radius: 20 }),
        newElement("rect", id(), { parentId: card2, x: 20, y: 20, width: 36, height: 36, fill: "#10b981", radius: 8 }),
        newElement("text", id(), { parentId: card2, x: 68, y: 24, width: 370, height: 26, text: "Farmacia y Salud Popular", fontSize: 17, bold: true, role: "heading", color: "#0f172a" }),
        newElement("text", id(), { parentId: card2, x: 20, y: 68, width: 420, height: 44, text: "Medicamentos e insumos a precio de costo para todos los vecinos registrados.", fontSize: 13, color: "#64748b" }),
        newElement("text", id(), { parentId: card2, x: 20, y: 120, width: 200, height: 22, text: "Consultar disponibilidad →", fontSize: 12, bold: true, color: "#10b981", role: "link" }),

        // Card 3 (1 col x 1 row)
        newElement("rect", card3, { role: "container", x: 0, y: 0, width: 220, height: 160, fill: "#ffffff", radius: 20 }),
        newElement("rect", id(), { parentId: card3, x: 16, y: 16, width: 32, height: 32, fill: "#ef4444", radius: 8 }),
        newElement("text", id(), { parentId: card3, x: 16, y: 56, width: 188, height: 24, text: "Alerta Vecinal 24/7", fontSize: 15, bold: true, role: "heading", color: "#0f172a" }),
        newElement("text", id(), { parentId: card3, x: 16, y: 84, width: 188, height: 40, text: "Central telefónica de emergencia comunal.", fontSize: 12, color: "#64748b" }),
        newElement("text", id(), { parentId: card3, x: 16, y: 128, width: 188, height: 20, text: "Llamar al 1404 →", fontSize: 12, bold: true, color: "#ef4444", role: "link" }),

        // Card 4 (1 col x 1 row)
        newElement("rect", card4, { role: "container", x: 0, y: 0, width: 220, height: 160, fill: "#ffffff", radius: 20 }),
        newElement("rect", id(), { parentId: card4, x: 16, y: 16, width: 32, height: 32, fill: "#8b5cf6", radius: 8 }),
        newElement("text", id(), { parentId: card4, x: 16, y: 56, width: 188, height: 24, text: "Talleres y Cultura", fontSize: 15, bold: true, role: "heading", color: "#0f172a" }),
        newElement("text", id(), { parentId: card4, x: 16, y: 84, width: 188, height: 40, text: "Actividades deportivas y artísticas gratuitas.", fontSize: 12, color: "#64748b" }),
        newElement("text", id(), { parentId: card4, x: 16, y: 128, width: 188, height: 20, text: "Ver cartelera →", fontSize: 12, bold: true, color: "#8b5cf6", role: "link" }),
      ];
    },
  },
  {
    id: "stats",
    label: "Métricas y Estadísticas",
    width: 960,
    height: 140,
    styles: {
      [SECTION_KEY]: {
        classes: "grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-50 border border-slate-200/80 rounded-2xl w-full text-center shadow-xs",
        css: "",
      },
    },
    build: (id) => {
      const stats = [
        { num: "+45.000", label: "Vecinos Atendidos" },
        { num: "98%", label: "Trámites en Línea" },
        { num: "24/7", label: "Plataforma Activa" },
        { num: "15 min", label: "Tiempo de Respuesta" },
      ];
      return stats.flatMap((st) => {
        const cardId = id();
        return [
          newElement("rect", cardId, { role: "container", x: 0, y: 0, width: 220, height: 110, fill: "#ffffff", radius: 12 }),
          newElement("text", id(), { parentId: cardId, x: 0, y: 16, width: 220, height: 40, text: st.num, fontSize: 30, bold: true, color: ACCENT, align: "center", role: "heading" }),
          newElement("text", id(), { parentId: cardId, x: 0, y: 60, width: 220, height: 24, text: st.label, fontSize: 13, color: "#475569", align: "center" }),
        ];
      });
    },
  },
  {
    id: "hero-search",
    label: "Banner Hero con Buscador y Foto",
    width: 1024,
    height: 380,
    styles: {
      [SECTION_KEY]: {
        classes: "w-full bg-slate-900 text-white p-8 md:p-12 rounded-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xl",
        css: "",
      },
    },
    build: (id) => {
      const colLeft = id();
      const colRight = id();
      const searchBox = id();
      return [
        // Columna izquierda: Información y Buscador (7 columnas)
        newElement("rect", colLeft, { role: "container", x: 0, y: 0, width: 560, height: 330, fill: "transparent", radius: 0 }),
        newElement("rect", id(), { parentId: colLeft, x: 0, y: 0, width: 160, height: 26, fill: "#1e293b", radius: 14 }),
        newElement("text", id(), { parentId: colLeft, x: 0, y: 5, width: 160, height: 16, text: "ATENCIÓN VECINAL 24/7", fontSize: 10, bold: true, color: ACCENT, align: "center" }),
        newElement("text", id(), { parentId: colLeft, x: 0, y: 38, width: 540, height: 76, text: "Encuentra trámites, pagos y servicios comunales", fontSize: 28, bold: true, color: "#ffffff", role: "heading" }),
        newElement("text", id(), { parentId: colLeft, x: 0, y: 122, width: 520, height: 42, text: "Accede a certificados en línea, consulta subsidios o agenda tu atención vecinal sin filas.", fontSize: 14, color: "#94a3b8" }),

        // Caja de búsqueda interactiva
        newElement("rect", searchBox, { parentId: colLeft, role: "container", x: 0, y: 176, width: 520, height: 50, fill: "#ffffff", radius: 12 }),
        newElement("text", id(), {
          parentId: searchBox,
          x: 16,
          y: 4,
          width: 380,
          height: 42,
          text: "",
          color: "#0f172a",
          fontSize: 13,
          control: { kind: "input", name: "search-query", placeholder: "Escribe lo que buscas: patentes, subsidios, salud...", inputType: "search" },
        }),
        newElement("rect", id(), {
          parentId: searchBox,
          role: "button",
          x: 406,
          y: 5,
          width: 106,
          height: 40,
          fill: ACCENT,
          radius: 8,
          text: "Buscar",
          color: "#ffffff",
          bold: true,
          align: "center",
          control: { kind: "button", name: "search-trigger" },
        }),

        // Tags frecuentes bajo el buscador
        newElement("text", id(), { parentId: colLeft, x: 4, y: 236, width: 510, height: 24, text: "Frecuentes: Permiso de circulación · Farmacia · Subsidios · Audiencias", fontSize: 12, color: "#64748b" }),

        // Columna derecha: Foto comunal
        newElement("rect", colRight, { role: "container", x: 0, y: 0, width: 380, height: 330, fill: "transparent", radius: 0 }),
        newElement("image", id(), {
          parentId: colRight,
          x: 0,
          y: 0,
          width: 380,
          height: 330,
          src: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
          alt: "Atención ciudadana municipal",
          radius: 16,
          fit: "cover",
        }),
      ];
    },
  },
  {
    id: "search-bar",
    label: "Buscador Ciudadano de Trámites",
    width: 860,
    height: 180,
    styles: {
      [SECTION_KEY]: {
        classes: "w-full max-w-4xl mx-auto p-6 md:p-8 bg-white border border-slate-200/90 rounded-2xl shadow-md flex flex-col gap-3 text-center",
        css: "",
      },
    },
    build: (id) => {
      const searchBox = id();
      return [
        newElement("text", id(), { x: 30, y: 16, width: 800, height: 32, text: "¿En qué trámite o servicio te podemos ayudar hoy?", fontSize: 22, bold: true, color: "#0f172a", role: "heading", align: "center" }),
        newElement("text", id(), { x: 30, y: 52, width: 800, height: 24, text: "Ingresa el nombre del trámite, pago o beneficio municipal que necesitas:", fontSize: 13, color: "#64748b", align: "center" }),
        newElement("rect", searchBox, { role: "container", x: 120, y: 84, width: 620, height: 48, fill: "#f8fafc", radius: 10 }),
        newElement("text", id(), {
          parentId: searchBox,
          x: 16,
          y: 3,
          width: 480,
          height: 42,
          text: "",
          color: "#0f172a",
          fontSize: 13,
          control: { kind: "input", name: "search-query", placeholder: "Buscar trámite: ej. patentes, subsidios, farmacia...", inputType: "search" },
        }),
        newElement("rect", id(), {
          parentId: searchBox,
          role: "button",
          x: 506,
          y: 4,
          width: 106,
          height: 40,
          fill: ACCENT,
          radius: 8,
          text: "Buscar",
          color: "#ffffff",
          bold: true,
          align: "center",
          control: { kind: "button", name: "search-trigger" },
        }),
        newElement("text", id(), { x: 30, y: 140, width: 800, height: 22, text: "Búsquedas frecuentes: Permiso de circulación · Farmacia popular · Subsidios · Seguridad 1404", fontSize: 12, color: "#64748b", align: "center" }),
      ];
    },
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
  const t = templateById(template);
  let count = 0;
  const elements = t.build(() => `${id}-e${++count}`);
  return {
    id,
    name,
    description,
    category,
    width: t.width,
    height: t.height,
    elements,
    links: t.links?.(elements) ?? {},
    styles: t.styles,
    custom: false,
  };
}

/** Los componentes de ejemplo: se pueden eliminar y volver a añadir con «Restaurar los componentes de ejemplo». */
export const EXAMPLE_COMPONENTS: ComponentDef[] = [
  builtIn("navbar", "Barra de navegación (Header con Buscador)", "Menú institucional con enlaces y botón desplegable de búsqueda", "navigation", "navbar"),
  builtIn("hero-search", "Banner Hero con Buscador y Foto", "Banner con buscador ciudadano integrado, tags populares y foto comunal", "hero", "hero-search"),
  builtIn("hero-banner", "Banner Principal (Hero)", "Titular destacado, descripción y botón de acción", "hero", "banner"),
  builtIn("search-bar", "Buscador Ciudadano de Trámites", "Caja de búsqueda reactiva con sugerencias y resultados instantáneos", "sections", "search-bar"),
  builtIn("grid-cards", "Catálogo de Tarjetas (4 PC / 2 Móvil)", "Cuadrícula responsiva con auto-layout y cards dinámicas", "cards", "grid-cards"),
  builtIn("container-row", "Contenedor Horizontal (3 Cards)", "Fila auto-layout donde las cards se acomodan dentro solas", "cards", "container-row"),
  builtIn("bento-grid", "Cuadrícula Bento Dinámica", "Grilla Bento con celdas de diferentes tamaños para destacar contenido", "cards", "bento"),
  builtIn("card-service", "Tarjeta de Servicio Individual", "Ficha individual con icono, badge, título y botón", "cards", "card"),
  builtIn("cta-buttons", "Set de Botones CTA", "Botones organizados con ancho adaptable y alineación", "buttons", "buttons"),
  builtIn("stats-metrics", "Métricas & Estadísticas", "4 indicadores clave de impacto comunal", "sections", "stats"),
  builtIn("reviews", "Testimonios Ciudadanos", "Reseñas con valoración de 5 estrellas", "cards", "review"),
  builtIn("carousel", "Carrusel de Novedades", "Slider visual para obras y proyectos", "sections", "carousel"),
  builtIn("content-section", "Sección Informativa", "Título, párrafo explicativo y botón de acción", "sections", "section"),
  builtIn("footer", "Pie de página (Footer)", "Cierre institucional full-width con enlaces y derechos", "navigation", "footer"),
];

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

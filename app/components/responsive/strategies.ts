import type { BlockInstance, ComponentDef } from "../site/types";
import { autoLayout } from "./auto-layout";
import { defaultMenu, menuSplit } from "./menu-model";
import { stackLayout } from "./stack-layout";
import type { AutoStrategy } from "./types";

/** Ajusta la cabecera en modo menú: barra compacta horizontal de 64px con marca y botón. */
export function navbarMenuLayout(def: ComponentDef, available: number): ComponentDef {
  const isNav =
    def.category === "navigation" ||
    def.id.toLowerCase().includes("navbar") ||
    def.id.toLowerCase().includes("nav") ||
    def.name.toLowerCase().includes("navegaci") ||
    def.name.toLowerCase().includes("header");

  if (!isNav) {
    return stackLayout(def, available);
  }

  const height = 64;
  const elements = def.elements.map((el) => {
    // Fondo de la cabecera que llena el ancho disponible
    if (el.kind === "rect" && !el.text?.trim() && el.x === 0 && el.y === 0 && el.width >= def.width * 0.8) {
      return { ...el, x: 0, y: 0, width: available, height };
    }
    // Icono o logo institucional
    if (el.x < 120 && (el.kind === "rect" || el.kind === "image" || el.kind === "icon") && (!el.text || !el.text.trim())) {
      const elH = Math.min(el.height, 36);
      const elW = Math.min(el.width, 36);
      return { ...el, x: 16, y: Math.round((height - elH) / 2), width: elW, height: elH };
    }
    // Título de la marca
    if (el.role === "heading" || el.kind === "text") {
      const hasLogo = def.elements.some(
        (other) =>
          other.id !== el.id &&
          other.x < el.x &&
          (other.kind === "rect" || other.kind === "image" || other.kind === "icon") &&
          !other.text?.trim(),
      );
      const left = hasLogo ? 60 : 16;
      const maxW = Math.max(120, available - left - 60);
      const textH = Math.min(el.height, 28);
      return {
        ...el,
        x: left,
        y: Math.round((height - textH) / 2),
        width: Math.min(el.width, maxW),
        height: textH,
        fontSize: Math.min(el.fontSize, available < 400 ? 16 : 18),
      };
    }
    return { ...el, y: Math.min(el.y, height - el.height) };
  });

  return { ...def, width: available, height, elements };
}

/** Cada estrategia automática es una función de la sección y el ancho disponible. Una nueva es una entrada nueva. */
export const STRATEGIES: Record<AutoStrategy, (def: ComponentDef, available: number, block: BlockInstance) => ComponentDef> = {
  scale: autoLayout,
  stack: stackLayout,
  // Lo que va al menú sale de la sección; la cabecera se organiza limpia y horizontal.
  menu: (def, available, block) => navbarMenuLayout(menuSplit(def, block.menu ?? defaultMenu(def)).rest, available),
};

/** Con al menos tantos elementos visibles, una sección ancha se apila; con menos es «una sola pieza» y se escala. */
export const MIN_ELEMENTS_TO_STACK = 2;

/** La estrategia inteligente: apilar una sección ancha con varios elementos; escalar una pieza sola. */
export function smartStrategy(def: ComponentDef, available: number): AutoStrategy {
  const visible = def.elements.filter((element) => !element.hidden).length;
  return def.width > available && visible >= MIN_ELEMENTS_TO_STACK ? "stack" : "scale";
}

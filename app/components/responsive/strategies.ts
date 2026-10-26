import type { BlockInstance, ComponentDef } from "../site/types";
import { autoLayout } from "./auto-layout";
import { defaultMenu, menuSplit } from "./menu-model";
import { stackLayout } from "./stack-layout";
import type { AutoStrategy } from "./types";

/** Cada estrategia automática es una función de la sección y el ancho disponible. Una nueva es una entrada nueva. */
export const STRATEGIES: Record<AutoStrategy, (def: ComponentDef, available: number, block: BlockInstance) => ComponentDef> = {
  scale: autoLayout,
  stack: stackLayout,
  // Lo que va al menú sale de la sección; lo demás (marca, logo) se apila.
  menu: (def, available, block) => stackLayout(menuSplit(def, block.menu ?? defaultMenu(def)).rest, available),
};

/** Con al menos tantos elementos visibles, una sección ancha se apila; con menos es «una sola pieza» y se escala. */
export const MIN_ELEMENTS_TO_STACK = 2;

/** La estrategia inteligente: apilar una sección ancha con varios elementos; escalar una pieza sola. */
export function smartStrategy(def: ComponentDef, available: number): AutoStrategy {
  const visible = def.elements.filter((element) => !element.hidden).length;
  return def.width > available && visible >= MIN_ELEMENTS_TO_STACK ? "stack" : "scale";
}

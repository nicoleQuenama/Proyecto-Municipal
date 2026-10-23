import type { Transition } from "../navigation/types";

/** Cuándo se dispara una interacción. */
export type TriggerKind = "click" | "hover" | "enter" | "leave" | "scroll" | "load";

/** Los efectos de animación disponibles. */
export type EffectName = "fade" | "slide-up" | "slide-left" | "zoom" | "bounce" | "shake" | "pulse" | "spin";

/** Dónde corre el código de una interacción: en la página (acceso completo, necesario para usar librerías) o aislado. */
export type CodeMode = "page" | "isolated";

/** Qué hace una interacción. Cada tipo tiene su definición en `actions.ts`. */
export type BehaviorAction =
  | { kind: "navigate"; pageId: string; transition?: Transition }
  | { kind: "animate"; effect: EffectName; seconds: number }
  | { kind: "play"; animationId: string }
  | { kind: "toggle"; targetKey: string; mode: "show" | "hide" | "toggle" }
  | { kind: "openUrl"; url: string }
  | { kind: "code"; source: string; mode?: CodeMode };

export type ActionKind = BehaviorAction["kind"];

/** Una interacción de una sección (`scope` = SECTION_KEY) o de uno de sus elementos (`scope` = id del elemento). */
export interface Behavior {
  id: string;
  scope: string;
  /** Cómo la llama el usuario (da nombre al archivo de su código); sin él, «código 1», «código 2»… */
  name?: string;
  trigger: TriggerKind;
  action: BehaviorAction;
}

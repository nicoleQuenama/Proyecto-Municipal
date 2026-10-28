import type { Transition } from "../navigation/types";
import type { NoticePlace, NoticeTone } from "./notify";

/** Cuándo se dispara una interacción. */
export type TriggerKind = "click" | "hover" | "enter" | "leave" | "scroll" | "load";

/** Los efectos de animación disponibles. */
export type EffectName = "fade" | "fade-out" | "slide-up" | "slide-left" | "zoom" | "bounce" | "shake" | "pulse" | "spin";

/** Dónde corre el código de una interacción: en la página (acceso completo, necesario para usar librerías) o aislado. */
export type CodeMode = "page" | "isolated";

/** Qué hace una interacción. Cada tipo tiene su definición en `actions.ts`. */
export type BehaviorAction =
  | { kind: "navigate"; pageId: string; transition?: Transition }
  | { kind: "animate"; effect: EffectName; seconds: number }
  | { kind: "count"; from: number; to: number; seconds: number; suffix: string }
  | { kind: "toast"; message: string; tone: NoticeTone; place: NoticePlace; seconds: number }
  | { kind: "dialog"; title: string; message: string; button: string }
  | { kind: "slide"; targetKey: string; to: "prev" | "next" | "start" | "end" }
  | { kind: "submit"; url: string; message: string }
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
  /** Segundos que se espera, tras el disparador, antes de hacer la acción. */
  delay?: number;
  action: BehaviorAction;
}

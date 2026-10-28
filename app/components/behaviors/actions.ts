import type { Transition } from "../navigation/types";
import { SECTION_KEY, type Page } from "../site/types";
import { countElement, MAX_COUNT_SECONDS } from "./count";
import { submitForm } from "../forms/submit";
import { MAX_NOTICE_SECONDS, PLACE_LABELS, showDialog, showToast, TONE_LABELS } from "./notify";
import { animateElement, EFFECTS, MAX_SECONDS, MIN_SECONDS } from "./effects";
import type { ActionKind, BehaviorAction, CodeMode } from "./types";

/** Lo que una acción puede hacer en la página mientras se prueba. */
export interface RunContext {
  /** El elemento o sección que disparó la interacción. */
  element: HTMLElement | null;
  goToPage: (pageId: string, transition?: Transition) => void;
  /** Muestra, oculta o alterna una parte del bloque (solo mientras se prueba). */
  setVisibility: (targetKey: string, mode: "show" | "hide" | "toggle") => void;
  openUrl: (url: string) => void;
  /** Desliza un carrusel de la página. */
  slide: (targetKey: string, to: "prev" | "next" | "start" | "end") => void;
  /** Reproduce una animación grabada en una página. */
  play: (animationId: string) => void;
  runCode: (source: string, mode: CodeMode) => void;
}

/** Cómo se edita cada dato de una acción. El panel dibuja un campo por cada descriptor. */
export type Field =
  | { key: string; label: string; type: "page" }
  | { key: string; label: string; type: "transition" }
  | { key: string; label: string; type: "target" }
  | { key: string; label: string; type: "animation" }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "number"; min: number; max: number; step: number }
  | { key: string; label: string; type: "text"; placeholder: string }
  | { key: string; label: string; type: "code"; hint: string };

interface ActionDef<K extends ActionKind> {
  label: string;
  create: (pages: Page[]) => Extract<BehaviorAction, { kind: K }>;
  fields: Field[];
  run: (action: Extract<BehaviorAction, { kind: K }>, context: RunContext) => void;
}

const CODE_HINT =
  "Disponible: api.navigate('servicios'), api.animate('bounce', 0.6), api.show() / api.hide() / api.toggle(), api.openUrl('https://…'), api.log(…). Admite await.";

/** Las acciones que puede tener una interacción. Una acción nueva es una entrada nueva. */
export const ACTIONS: { [K in ActionKind]: ActionDef<K> } = {
  navigate: {
    label: "Ir a otra página",
    create: (pages) => ({ kind: "navigate", pageId: pages[0]?.id ?? "" }),
    fields: [
      { key: "pageId", label: "Página", type: "page" },
      { key: "transition", label: "Transición", type: "transition" },
    ],
    run: (action, context) => action.pageId && context.goToPage(action.pageId, action.transition),
  },

  animate: {
    label: "Animar",
    create: () => ({ kind: "animate", effect: "fade", seconds: 0.5 }),
    fields: [
      {
        key: "effect",
        label: "Efecto",
        type: "select",
        options: Object.entries(EFFECTS).map(([value, { label }]) => ({ value, label })),
      },
      { key: "seconds", label: "Duración (s)", type: "number", min: MIN_SECONDS, max: MAX_SECONDS, step: 0.1 },
    ],
    run: (action, context) => animateElement(context.element, action.effect, action.seconds),
  },

  count: {
    label: "Contar un número",
    create: () => ({ kind: "count", from: 0, to: 100, seconds: 2, suffix: "%" }),
    fields: [
      { key: "from", label: "Desde", type: "number", min: -1000000, max: 1000000, step: 1 },
      { key: "to", label: "Hasta", type: "number", min: -1000000, max: 1000000, step: 1 },
      { key: "seconds", label: "Duración (s)", type: "number", min: MIN_SECONDS, max: MAX_COUNT_SECONDS, step: 0.1 },
      { key: "suffix", label: "Después del número", type: "text", placeholder: "%" },
    ],
    run: (action, context) => countElement(context.element, action.from, action.to, action.seconds, action.suffix),
  },

  toast: {
    label: "Mostrar una notificación",
    create: () => ({ kind: "toast", message: "¡Listo!", tone: "success", place: "bottom-right", seconds: 3 }),
    fields: [
      { key: "message", label: "Mensaje", type: "text", placeholder: "Se guardó correctamente" },
      { key: "tone", label: "Tipo", type: "select", options: Object.entries(TONE_LABELS).map(([value, label]) => ({ value, label })) },
      { key: "place", label: "Posición", type: "select", options: Object.entries(PLACE_LABELS).map(([value, label]) => ({ value, label })) },
      { key: "seconds", label: "Dura (s)", type: "number", min: 0.5, max: MAX_NOTICE_SECONDS, step: 0.5 },
    ],
    run: (action) => void showToast(action.message, action.tone, action.place, action.seconds),
  },

  dialog: {
    label: "Mostrar un diálogo",
    create: () => ({ kind: "dialog", title: "Aviso", message: "Escribe aquí el mensaje.", button: "Aceptar" }),
    fields: [
      { key: "title", label: "Título", type: "text", placeholder: "Aviso" },
      { key: "message", label: "Mensaje", type: "text", placeholder: "Escribe aquí el mensaje." },
      { key: "button", label: "Texto del botón", type: "text", placeholder: "Aceptar" },
    ],
    run: (action) => void showDialog(action.title, action.message, action.button),
  },

  slide: {
    label: "Deslizar un carrusel",
    create: () => ({ kind: "slide", targetKey: SECTION_KEY, to: "next" }),
    fields: [
      { key: "targetKey", label: "Carrusel", type: "target" },
      {
        key: "to",
        label: "Hacia",
        type: "select",
        options: [
          { value: "next", label: "Siguiente" },
          { value: "prev", label: "Anterior" },
          { value: "start", label: "Al principio" },
          { value: "end", label: "Al final" },
        ],
      },
    ],
    run: (action, context) => context.slide(action.targetKey, action.to),
  },

  submit: {
    label: "Enviar el formulario",
    create: () => ({ kind: "submit", url: "", message: "¡Enviado!" }),
    fields: [
      { key: "url", label: "Destino de los datos (vacío = solo probar)", type: "text", placeholder: "https://mi-servidor.com/contacto" },
      { key: "message", label: "Aviso al enviar", type: "text", placeholder: "¡Enviado!" },
    ],
    run: (action, context) => void submitForm(context.element, action.url, action.message),
  },

  play: {
    label: "Reproducir una animación grabada",
    create: (pages) => ({ kind: "play", animationId: pages.flatMap((p) => p.animations ?? [])[0]?.id ?? "" }),
    fields: [{ key: "animationId", label: "Animación", type: "animation" }],
    run: (action, context) => action.animationId && context.play(action.animationId),
  },

  toggle: {
    label: "Mostrar u ocultar",
    create: () => ({ kind: "toggle", targetKey: SECTION_KEY, mode: "toggle" }),
    fields: [
      { key: "targetKey", label: "Qué", type: "target" },
      {
        key: "mode",
        label: "Cómo",
        type: "select",
        options: [
          { value: "toggle", label: "Alternar" },
          { value: "show", label: "Mostrar" },
          { value: "hide", label: "Ocultar" },
        ],
      },
    ],
    run: (action, context) => context.setVisibility(action.targetKey, action.mode),
  },

  openUrl: {
    label: "Abrir un enlace",
    create: () => ({ kind: "openUrl", url: "" }),
    fields: [{ key: "url", label: "URL", type: "text", placeholder: "https://ejemplo.com" }],
    run: (action, context) => context.openUrl(action.url),
  },

  code: {
    label: "Ejecutar código (TypeScript)",
    create: () => ({ kind: "code", source: "api.animate('pulse', 0.6);\n", mode: "page" }),
    fields: [{ key: "source", label: "TypeScript", type: "code", hint: CODE_HINT }],
    run: (action, context) => context.runCode(action.source, action.mode ?? "page"),
  },
};

/** Ejecuta una acción. TypeScript no relaciona el tipo con su definición, pero `ACTIONS` lo garantiza. */
export function runAction(action: BehaviorAction, context: RunContext) {
  (ACTIONS[action.kind].run as (action: BehaviorAction, context: RunContext) => void)(action, context);
}

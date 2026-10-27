import type { EffectName } from "./types";

/** Las animaciones disponibles: su nombre y los fotogramas (Web Animations API). Una nueva es una entrada nueva. */
export const EFFECTS: Record<EffectName, { label: string; keyframes: Keyframe[]; /** Se queda en el último fotograma (una salida). */ keep?: boolean }> = {
  fade: { label: "Aparecer", keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  "fade-out": { label: "Desvanecer", keyframes: [{ opacity: 1 }, { opacity: 0 }], keep: true },
  "slide-up": {
    label: "Subir",
    keyframes: [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }],
  },
  "slide-left": {
    label: "Entrar desde la derecha",
    keyframes: [{ opacity: 0, transform: "translateX(48px)" }, { opacity: 1, transform: "none" }],
  },
  zoom: { label: "Zoom", keyframes: [{ opacity: 0, transform: "scale(0.85)" }, { opacity: 1, transform: "none" }] },
  bounce: {
    label: "Rebote",
    keyframes: [
      { transform: "translateY(0)" },
      { transform: "translateY(-18px)", offset: 0.35 },
      { transform: "translateY(0)", offset: 0.6 },
      { transform: "translateY(-8px)", offset: 0.8 },
      { transform: "translateY(0)" },
    ],
  },
  shake: {
    label: "Sacudida",
    keyframes: [
      { transform: "translateX(0)" },
      { transform: "translateX(-10px)", offset: 0.2 },
      { transform: "translateX(10px)", offset: 0.4 },
      { transform: "translateX(-6px)", offset: 0.6 },
      { transform: "translateX(6px)", offset: 0.8 },
      { transform: "translateX(0)" },
    ],
  },
  pulse: {
    label: "Latido",
    keyframes: [{ transform: "scale(1)" }, { transform: "scale(1.08)", offset: 0.5 }, { transform: "scale(1)" }],
  },
  spin: { label: "Giro", keyframes: [{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }] },
};

export const MIN_SECONDS = 0.1;
export const MAX_SECONDS = 5;

/** Reproduce un efecto sobre un elemento del DOM. Sin movimiento si la persona lo pidió así en su sistema. */
export function animateElement(element: Element | null, effect: EffectName, seconds: number) {
  if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { keyframes, keep } = EFFECTS[effect];
  element.animate(keyframes, { duration: seconds * 1000, easing: "ease-out", fill: keep ? "forwards" : "none" });
}

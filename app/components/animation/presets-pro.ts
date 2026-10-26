import type { Preset } from "./preset-types";

const px = (x: number, y: number) => `${x}px ${y}px`;
const ORIGIN = px(0, 0);
const OVERSHOOT = "cubic-bezier(.34,1.56,.64,1)";
const EXPO_OUT = "cubic-bezier(.16,1,.3,1)";

/** Efectos de acabado cuidado: bucles, resplandor, 3D y revelados. */
export const PRO_PRESETS = {
  float: {
    label: "Flotar",
    icon: "☁",
    ownEasing: true,
    parts: ({ distance }) => [
      { prop: "move", from: ORIGIN, to: px(0, -distance / 3), easing: "ease-in-out", iterations: 0, direction: "alternate" },
    ],
  },
  breathe: {
    label: "Respirar",
    icon: "◉",
    ownEasing: true,
    parts: ({ distance }) => [
      { prop: "scale", from: 1, to: 1 + distance / 500, easing: "ease-in-out", iterations: 0, direction: "alternate" },
    ],
  },
  "glow-pulse": {
    label: "Brillo",
    icon: "✦",
    ownEasing: true,
    parts: ({ distance }) => [
      { prop: "glow", from: 0, to: distance, easing: "ease-in-out", iterations: 0, direction: "alternate" },
    ],
  },
  heartbeat: {
    label: "Latido doble",
    icon: "♡",
    ownEasing: true,
    parts: ({ distance }) => {
      const big = 1 + distance / 300;
      const beat = (from: number, to: number, start: number, easing: string) => ({ prop: "scale" as const, from, to, start, span: 0.14, easing });
      return [beat(1, big, 0, "ease-out"), beat(big, 1, 0.14, "ease-in"), beat(1, big * 0.97, 0.3, "ease-out"), beat(big * 0.97, 1, 0.44, "ease-in")];
    },
  },
  overshoot: {
    label: "Entrada con rebote",
    icon: "⤒",
    ownEasing: true,
    parts: ({ distance }) => [
      { prop: "opacity", from: 0, to: 1, span: 0.4, easing: "ease-out" },
      { prop: "scale", from: 0.6, to: 1, easing: OVERSHOOT },
      { prop: "move", from: px(0, distance), to: ORIGIN, easing: OVERSHOOT },
    ],
  },
  flip: {
    label: "Giro 3D de tarjeta",
    icon: "⟲",
    ownEasing: true,
    parts: ({ distance }) => [
      { prop: "opacity", from: 0, to: 1, span: 0.3, easing: "ease-out" },
      { prop: "flip", from: distance * 1.8, to: 0, easing: EXPO_OUT },
    ],
  },
  cascade: {
    label: "Cascada fina",
    icon: "≡",
    ownEasing: true,
    parts: ({ distance }) => [
      { prop: "opacity", from: 0, to: 1, span: 0.6, easing: "ease-out" },
      { prop: "move", from: px(0, distance / 2), to: ORIGIN, easing: EXPO_OUT },
      { prop: "blur", from: distance / 10, to: 0, span: 0.7, easing: "ease-out" },
    ],
  },
  "mask-reveal": {
    label: "Revelado con máscara",
    icon: "▦",
    ownEasing: true,
    parts: ({ distance }) => [
      { prop: "reveal", from: "0 0 100% 0", to: "0 0 0 0", easing: EXPO_OUT },
      { prop: "move", from: px(0, distance / 4), to: ORIGIN, easing: EXPO_OUT },
    ],
  },
  typewriter: {
    label: "Máquina de escribir",
    icon: "⌨",
    ownEasing: true,
    durationScale: 2,
    parts: () => [{ prop: "reveal", from: "0 100% 0 0", to: "0 0 0 0", easing: "steps(28, end)" }],
  },
  "ken-burns": {
    label: "Zoom suave",
    icon: "⛶",
    ownEasing: true,
    durationScale: 6,
    parts: ({ distance }) => [
      { prop: "scale", from: 1, to: 1 + distance / 400, easing: "linear" },
      { prop: "move", from: ORIGIN, to: px(-distance / 5, -distance / 8), easing: "linear" },
    ],
  },
  tilt: {
    label: "Inclinación",
    icon: "◩",
    ownEasing: true,
    parts: ({ distance }) => [
      { prop: "tilt", from: "0deg 0deg", to: `${distance / 8}deg ${-distance / 6}deg`, easing: EXPO_OUT },
      { prop: "scale", from: 1, to: 1.04, easing: EXPO_OUT },
      { prop: "glow", from: 0, to: distance / 3, easing: EXPO_OUT },
    ],
  },
} as const satisfies Record<string, Preset>;

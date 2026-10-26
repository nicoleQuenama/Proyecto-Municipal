import type { Preset, PresetParams } from "./preset-types";
import { PRO_PRESETS } from "./presets-pro";

export type { Part, Preset, PresetParams } from "./preset-types";

export const DEFAULT_PARAMS: PresetParams = { duration: 600, delay: 0, stagger: 120, distance: 40 };

const px = (x: number, y: number) => `${x}px ${y}px`;
const ORIGIN = px(0, 0);

/** Los efectos de la galería. Uno nuevo es una entrada nueva. */
export const PRESETS = {
  "fade-in": { label: "Aparecer", icon: "◐", parts: () => [{ prop: "opacity", from: 0, to: 1 }] },
  "fade-out": { label: "Desaparecer", icon: "◑", parts: () => [{ prop: "opacity", from: 1, to: 0 }] },
  "pop-in": { label: "Aparece de golpe", icon: "●", instant: true, parts: () => [{ prop: "opacity", from: 0, to: 1 }] },
  "pop-out": { label: "Desaparece de golpe", icon: "○", instant: true, parts: () => [{ prop: "opacity", from: 1, to: 0 }] },
  "slide-up": {
    label: "Subir",
    icon: "↑",
    parts: ({ distance }) => [
      { prop: "opacity", from: 0, to: 1 },
      { prop: "move", from: px(0, distance), to: ORIGIN },
    ],
  },
  "slide-down": {
    label: "Bajar",
    icon: "↓",
    parts: ({ distance }) => [
      { prop: "opacity", from: 0, to: 1 },
      { prop: "move", from: px(0, -distance), to: ORIGIN },
    ],
  },
  "slide-left": {
    label: "Entrar por la derecha",
    icon: "←",
    parts: ({ distance }) => [
      { prop: "opacity", from: 0, to: 1 },
      { prop: "move", from: px(distance, 0), to: ORIGIN },
    ],
  },
  "slide-right": {
    label: "Entrar por la izquierda",
    icon: "→",
    parts: ({ distance }) => [
      { prop: "opacity", from: 0, to: 1 },
      { prop: "move", from: px(-distance, 0), to: ORIGIN },
    ],
  },
  "zoom-in": {
    label: "Zoom",
    icon: "⤢",
    parts: ({ distance }) => [
      { prop: "opacity", from: 0, to: 1 },
      { prop: "scale", from: 1 - distance / 200, to: 1 },
    ],
  },
  grow: { label: "Agrandar", icon: "⊕", parts: ({ distance }) => [{ prop: "scale", from: 1, to: 1 + distance / 200 }] },
  "blur-in": {
    label: "Enfocar",
    icon: "◌",
    parts: ({ distance }) => [
      { prop: "opacity", from: 0, to: 1 },
      { prop: "blur", from: distance / 4, to: 0 },
    ],
  },
  "spin-in": {
    label: "Girar al entrar",
    icon: "↻",
    parts: ({ distance }) => [
      { prop: "opacity", from: 0, to: 1 },
      { prop: "rotate", from: `${-distance * 4.5}deg`, to: "0deg" },
      { prop: "scale", from: 0.7, to: 1 },
    ],
  },
  reveal: { label: "Revelar", icon: "▤", parts: () => [{ prop: "reveal", from: "0 100% 0 0", to: "0 0 0 0" }] },
  pulse: {
    label: "Latido",
    icon: "♥",
    parts: ({ distance }) => [
      { prop: "scale", from: 1, to: 1 + distance / 300, start: 0, span: 0.5 },
      { prop: "scale", from: 1 + distance / 300, to: 1, start: 0.5, span: 0.5 },
    ],
  },
  shake: {
    label: "Sacudir",
    icon: "≋",
    parts: ({ distance }) => {
      const reach = distance / 3;
      const stops = [0, -reach, reach, -reach / 2, 0];
      return stops.slice(1).map((to, i) => ({ prop: "move", from: px(stops[i], 0), to: px(to, 0), start: i / 4, span: 1 / 4 }));
    },
  },
  bounce: {
    label: "Rebote",
    icon: "⌒",
    parts: ({ distance }) => [
      { prop: "move", from: ORIGIN, to: px(0, -distance), start: 0, span: 0.4 },
      { prop: "move", from: px(0, -distance), to: ORIGIN, start: 0.4, span: 0.3 },
      { prop: "move", from: ORIGIN, to: px(0, -distance / 3), start: 0.7, span: 0.15 },
      { prop: "move", from: px(0, -distance / 3), to: ORIGIN, start: 0.85, span: 0.15 },
    ],
  },
  ...PRO_PRESETS,
} as const satisfies Record<string, Preset>;

export type PresetId = keyof typeof PRESETS;

/** Cómo acelera un efecto. */
export const EASINGS = [
  { value: "ease-in-out", label: "Suave" },
  { value: "ease-out", label: "Frenar al final" },
  { value: "linear", label: "Constante" },
  { value: "cubic-bezier(.34,1.56,.64,1)", label: "Rebotar al llegar" },
  { value: "cubic-bezier(.68,-0.6,.32,1.6)", label: "Elástico" },
] as const;

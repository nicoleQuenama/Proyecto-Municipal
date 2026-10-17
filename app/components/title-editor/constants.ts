import type { Align, BlockTag, TitleState } from "./types";

export const MIN_SIZE = 8;
export const MAX_SIZE = 120;

export const BLOCK_OPTIONS: { value: BlockTag; label: string }[] = [
  { value: "h1", label: "Título 1 (H1)" },
  { value: "h2", label: "Título 2 (H2)" },
  { value: "h3", label: "Título 3 (H3)" },
  { value: "p", label: "Párrafo" },
];

export const FONT_OPTIONS = [
  { value: "var(--font-geist-sans), sans-serif", label: "Moderna (Geist)" },
  { value: "var(--font-geist-mono), monospace", label: "Técnica (Mono)" },
  { value: "Georgia, serif", label: "Clásica (Georgia)" },
  { value: "Arial, Helvetica, sans-serif", label: "Neutra (Arial)" },
];

export const ALIGN_OPTIONS: { value: Align; label: string; icon: string }[] = [
  { value: "left", label: "Alinear a la izquierda", icon: "⇤" },
  { value: "center", label: "Centrar", icon: "≡" },
  { value: "right", label: "Alinear a la derecha", icon: "⇥" },
  { value: "justify", label: "Justificar", icon: "☰" },
];

export const INITIAL_STATE: TitleState = {
  text: "Portal Municipal",
  block: "h1",
  font: FONT_OPTIONS[0].value,
  size: 48,
  bold: true,
  italic: false,
  underline: false,
  strike: false,
  color: "#171717",
  highlight: null,
  align: "left",
  list: "none",
  link: "",
  applyToSite: true,
  editing: true,
};

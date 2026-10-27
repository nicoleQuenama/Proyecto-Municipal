import type { BlendMode } from "../site/types";

/** Los modos de mezcla: su nombre y para qué sirven. Uno nuevo es una entrada nueva. */
export const BLEND_MODES: Record<BlendMode, { label: string; hint: string }> = {
  multiply: { label: "Multiplicar", hint: "Lo claro desaparece y deja ver el fondo; lo oscuro tapa." },
  screen: { label: "Pantalla", hint: "Lo oscuro desaparece y deja ver el fondo; lo claro se suma." },
  overlay: { label: "Superponer", hint: "Realza el contraste del fondo con los colores de la sección." },
  difference: { label: "Diferencia", hint: "Invierte los colores del fondo donde hay color en la sección." },
  lighten: { label: "Aclarar", hint: "Gana el más claro de los dos." },
  darken: { label: "Oscurecer", hint: "Gana el más oscuro de los dos." },
};

export const BLEND_NAMES = Object.keys(BLEND_MODES) as BlendMode[];

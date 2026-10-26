import type { CSSProperties } from "react";
import { MiniScreen, type CardOption } from "../ui/option-cards";
import { ANIMATION_LABELS, POSITION_LABELS, SIZE_LABELS } from "./modal-options";
import type { ModalAnimation, ModalPosition, ModalSize } from "./types";

/** Dónde y cuánto ocupa la pieza dibujada de cada tamaño. */
const SIZE_PIECES: Record<ModalSize, CSSProperties> = {
  small: { left: "30%", top: "25%", width: "40%", height: "50%" },
  medium: { left: "20%", top: "18%", width: "60%", height: "64%" },
  large: { left: "10%", top: "10%", width: "80%", height: "80%" },
  full: { left: 0, top: 0, width: "100%", height: "100%" },
};

/** Dónde queda la pieza dibujada según la posición. */
const POSITION_PIECES: Record<ModalPosition, CSSProperties> = {
  center: SIZE_PIECES.medium,
  right: { right: 0, top: 0, width: "45%", height: "100%" },
  left: { left: 0, top: 0, width: "45%", height: "100%" },
  bottom: { left: 0, bottom: 0, width: "100%", height: "50%" },
};

/** Un símbolo por animación. */
const ANIMATION_SYMBOLS: Record<ModalAnimation, string> = { fade: "◐", rise: "↑", zoom: "⤢" };

function toOptions<T extends string>(labels: Record<T, string>, preview: (key: T) => CardOption<T>["preview"]): CardOption<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value], preview: preview(value) }));
}

export const SIZE_OPTIONS = toOptions(SIZE_LABELS, (key) => <MiniScreen piece={SIZE_PIECES[key]} />);
export const POSITION_OPTIONS = toOptions(POSITION_LABELS, (key) => <MiniScreen piece={POSITION_PIECES[key]} />);
export const ANIMATION_OPTIONS = toOptions(ANIMATION_LABELS, (key) => (
  <span aria-hidden className="flex h-5 items-center text-base text-accent">{ANIMATION_SYMBOLS[key]}</span>
));

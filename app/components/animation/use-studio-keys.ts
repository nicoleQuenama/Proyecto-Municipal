"use client";

import { useEffect } from "react";

interface StudioKeys {
  onToggle: () => void;
  onRemoveClip: () => void;
  /** Mueve el cabezal; `by` en ms (negativo = atrás). */
  onNudge: (by: number) => void;
}

const NUDGE_MS = 100;
const BIG_NUDGE_MS = 500;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/** Atajos del estudio, como en un editor de vídeo: Espacio reproduce, Supr quita el clip, las flechas mueven el cabezal. */
export function useStudioKeys({ onToggle, onRemoveClip, onNudge }: StudioKeys) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      // Con un botón enfocado, Espacio y Enter ya lo pulsan: no se repite la acción.
      if (e.key === " " && e.target instanceof HTMLButtonElement) return;
      const step = e.shiftKey ? BIG_NUDGE_MS : NUDGE_MS;
      const actions: Record<string, () => void> = {
        " ": onToggle,
        Delete: onRemoveClip,
        Backspace: onRemoveClip,
        ArrowLeft: () => onNudge(-step),
        ArrowRight: () => onNudge(step),
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onToggle, onRemoveClip, onNudge]);
}

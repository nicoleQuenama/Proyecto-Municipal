"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import type { CanvasElement } from "./types";

interface InlineTextEditorProps {
  element: CanvasElement;
  onCommit: (text: string) => void;
  onClose: () => void;
}

/**
 * Escribir el texto de un elemento sobre el propio lienzo. Hereda la tipografía del contenedor, así que se ve
 * como quedará. Enter o salir del campo lo guarda (Mayús+Enter salta de línea); Esc lo deja como estaba.
 */
export function InlineTextEditor({ element, onCommit, onClose }: InlineTextEditorProps) {
  const field = useRef<HTMLTextAreaElement>(null);
  const done = useRef(false);

  useEffect(() => {
    field.current?.focus();
    field.current?.select();
  }, []);

  const finish = (save: boolean) => {
    if (done.current) return;
    done.current = true;
    if (save && field.current) onCommit(field.current.value);
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation(); // Supr, flechas y atajos no deben mover ni borrar el elemento mientras se escribe
    if (e.key === "Escape") finish(false);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      finish(true);
    }
  };

  return (
    <textarea
      ref={field}
      aria-label="Texto del elemento"
      defaultValue={element.text}
      spellCheck={false}
      onKeyDown={onKeyDown}
      onBlur={() => finish(true)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-20 size-full resize-none overflow-hidden bg-transparent leading-tight outline-2 outline-sky-500"
      style={{ font: "inherit", color: "inherit", textAlign: element.align, padding: 0 }}
    />
  );
}

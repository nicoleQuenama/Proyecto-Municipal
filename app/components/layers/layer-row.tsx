"use client";

import { useState, type ComponentProps } from "react";
import type { CanvasElement } from "../site/types";
import { layerGlyph, layerName } from "./layer-kinds";
import type { LayerPlace } from "./layer-order";

const iconButton =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded text-[12px] text-ink-dim hover:bg-hover hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";

export interface LayerRowProps {
  element: CanvasElement;
  selected: boolean;
  /** Dónde se va a soltar la capa que se arrastra sobre esta fila. */
  dropPlace: LayerPlace | null;
  dragging: boolean;
  canForward: boolean;
  canBackward: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onToggleHidden: () => void;
  onToggleLocked: () => void;
  onStep: (step: "forward" | "backward") => void;
  dragProps: ComponentProps<"li">;
}

/** Una capa: símbolo, nombre editable (doble clic), ojo, candado y subir/bajar. */
export function LayerRow(props: LayerRowProps) {
  const { element, selected, dropPlace, dragging } = props;
  const [renaming, setRenaming] = useState(false);
  const name = layerName(element);

  const finish = (value: string) => {
    setRenaming(false);
    props.onRename(value.trim());
  };

  return (
    <li
      {...props.dragProps}
      data-layer-id={element.id}
      className={`relative flex items-center gap-0.5 rounded-md pr-0.5 ${selected ? "bg-accent/25" : "hover:bg-hover"} ${dragging ? "opacity-40" : ""} ${
        element.parentId ? "pl-4" : "pl-1"
      }`}
    >
      {dropPlace && (
        <span aria-hidden className={`pointer-events-none absolute inset-x-1 h-0.5 rounded bg-accent ${dropPlace === "above" ? "top-0" : "bottom-0"}`} />
      )}
      <span aria-hidden className="w-4 shrink-0 text-center text-xs text-ink-dim">{layerGlyph(element)}</span>

      {renaming ? (
        <input
          autoFocus
          aria-label="Nombre de la capa"
          defaultValue={element.name ?? ""}
          placeholder={name}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => finish(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") finish(e.currentTarget.value);
            if (e.key === "Escape") setRenaming(false);
            e.stopPropagation();
          }}
          className="h-6 min-w-0 flex-1 rounded border border-accent bg-canvas px-1 text-xs text-ink outline-none"
        />
      ) : (
        <button
          type="button"
          aria-current={selected}
          title="Doble clic para cambiar el nombre"
          onClick={props.onSelect}
          onDoubleClick={() => setRenaming(true)}
          className={`h-7 min-w-0 flex-1 truncate text-left text-xs ${element.hidden ? "text-ink-dim line-through" : ""}`}
        >
          {name}
        </button>
      )}

      <button type="button" aria-label={`Subir ${name}`} title="Subir (hacia delante)" disabled={!props.canForward} onClick={() => props.onStep("forward")} className={iconButton}>↑</button>
      <button type="button" aria-label={`Bajar ${name}`} title="Bajar (hacia atrás)" disabled={!props.canBackward} onClick={() => props.onStep("backward")} className={iconButton}>↓</button>
      <button type="button" aria-label={`${element.hidden ? "Mostrar" : "Ocultar"} ${name}`} aria-pressed={element.hidden === true} title={element.hidden ? "Mostrar" : "Ocultar"} onClick={props.onToggleHidden} className={iconButton}>
        {element.hidden ? "◌" : "◉"}
      </button>
      <button type="button" aria-label={`${element.locked ? "Desbloquear" : "Bloquear"} ${name}`} aria-pressed={element.locked === true} title={element.locked ? "Desbloquear" : "Bloquear (no se mueve ni se selecciona en el lienzo)"} onClick={props.onToggleLocked} className={`${iconButton} ${element.locked ? "text-accent" : ""}`}>
        {element.locked ? "⚿" : "○"}
      </button>
    </li>
  );
}

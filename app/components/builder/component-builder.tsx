"use client";

import { useEffect, useState } from "react";
import { pruneLinks } from "../navigation/links";
import { newElement } from "../site/component-templates";
import { isComponentNameTaken } from "../site/rules";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { CanvasElement, ComponentDef, ElementKind } from "../site/types";
import { Modal } from "../ui/modal";
import { BuilderHeader } from "./builder-header";
import { useBuilderHistory } from "./use-builder-history";
import { BuilderStage } from "./builder-stage";
import { ElementToolbar } from "./element-toolbar";
import { PropertiesPanel } from "./properties-panel";

const newId = () => crypto.randomUUID();

/** Qué abre el constructor: uno nuevo, o un componente existente o su copia. */
export type BuilderTarget = "new" | ComponentDef;

interface ComponentBuilderProps {
  /** Componente a editar o copia a completar; sin él se empieza uno nuevo en blanco. */
  initial?: ComponentDef;
  onClose: () => void;
}

/** Constructor de componentes moderno tipo Studio: diseño en limpio con marcos e integración directa a BD. */
export function ComponentBuilder({ initial, onClose }: ComponentBuilderProps) {
  const { components, pages } = useSite();
  const siteDispatch = useSiteDispatch();
  const { state, dispatch, undo, redo, canUndo, canRedo } = useBuilderHistory(initial);
  const [error, setError] = useState<string | null>(null);

  // Atajos de teclado para Deshacer (Ctrl+Z) y Rehacer (Ctrl+Y / Ctrl+Mayús+Z)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const isEditing = initial !== undefined && components.some((c) => c.id === initial.id);

  const addElement = (kind: ElementKind, overrides: Partial<CanvasElement> = {}) => {
    // Cada elemento nuevo se escalona un poco para que no queden uno sobre otro.
    const offset = 24 + (state.elements.length % 6) * 16;
    dispatch({ type: "add", element: newElement(kind, newId(), { x: offset, y: offset, ...overrides }) });
  };

  const save = () => {
    const name = state.name.trim();
    if (!name) return setError("Por favor, ponle un nombre al componente.");
    if (isComponentNameTaken(components, name, initial?.id)) return setError("Ya existe un componente con ese nombre.");
    if (state.elements.length === 0) return setError("Agrega al menos un elemento o marco al lienzo.");

    const count = state.elements.length;
    siteDispatch({
      type: "component/save",
      component: {
        id: initial?.id ?? newId(),
        name,
        description: `${count} ${count === 1 ? "elemento" : "elementos"} · ${state.width}×${state.height}`,
        category: state.category,
        width: state.width,
        height: state.height,
        elements: state.elements,
        links: pruneLinks(state.links, state.elements),
        custom: true,
      },
    });
    onClose();
  };

  return (
    <Modal label="Constructor de componentes" size="full" onClose={onClose}>
      <div className="flex h-[94vh] flex-col bg-canvas select-none">
        <BuilderHeader
          state={state}
          dispatch={dispatch}
          newId={newId}
          pageIds={pages.map((page) => page.id)}
          isEditing={isEditing}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onEdited={() => setError(null)}
          onSave={save}
          onClose={onClose}
        />

        <div className="grid min-h-0 flex-1 grid-cols-[16rem_1fr_20rem] overflow-hidden">
          <ElementToolbar onAdd={addElement} />

          <BuilderStage state={state} dispatch={dispatch} />

          <aside aria-label="Propiedades" className="overflow-y-auto border-l border-line bg-panel/30 p-4 shadow-xs">
            <PropertiesPanel state={state} dispatch={dispatch} newId={newId} />
          </aside>
        </div>

        <footer className="flex items-center justify-between border-t border-line bg-panel/80 px-4 py-2 text-xs">
          {error ? (
            <div role="alert" className="flex items-center gap-2 text-red-400 font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-dim">
              <span className="font-semibold text-ink">Atajos útiles:</span>
              <span className="rounded bg-canvas border border-line px-1.5 py-0.5 text-accent font-medium">Ctrl + Z / Ctrl + Y: Deshacer / Rehacer</span>
              <span className="rounded bg-canvas border border-line px-1.5 py-0.5">Supr: Eliminar</span>
              <span className="rounded bg-canvas border border-line px-1.5 py-0.5">Flechas: 1px (Shift: 10px)</span>
              <span className="rounded bg-canvas border border-line px-1.5 py-0.5">Alt: Libre de acople</span>
              <span className="rounded bg-canvas border border-line px-1.5 py-0.5">Ctrl + rueda: Zoom</span>
              <span className="rounded bg-canvas border border-line px-1.5 py-0.5">Espacio + arrastrar: Mover lienzo</span>
            </div>
          )}

          <div className="text-[11px] text-ink-dim">
            <span>{state.elements.length} {state.elements.length === 1 ? "elemento" : "elementos"} en el lienzo</span>
          </div>
        </footer>
      </div>
    </Modal>
  );
}

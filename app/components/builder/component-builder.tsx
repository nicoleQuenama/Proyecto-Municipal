"use client";

import { useReducer, useState } from "react";
import { pruneLinks } from "../navigation/links";
import { newElement } from "../site/component-templates";
import { isComponentNameTaken } from "../site/rules";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { ComponentDef, ElementKind } from "../site/types";
import { Modal } from "../ui/modal";
import { BuilderCanvas } from "./builder-canvas";
import { BuilderHeader } from "./builder-header";
import { builderReducer, initialBuilderState } from "./builder-reducer";
import { CanvasToolbar } from "./canvas-toolbar";
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

/** Constructor de componentes: parte de una plantilla o de un lienzo en blanco. */
export function ComponentBuilder({ initial, onClose }: ComponentBuilderProps) {
  const { components, pages } = useSite();
  const siteDispatch = useSiteDispatch();
  const [state, dispatch] = useReducer(builderReducer, initial, initialBuilderState);
  const [error, setError] = useState<string | null>(null);

  const isEditing = initial !== undefined && components.some((c) => c.id === initial.id);

  const addElement = (kind: ElementKind) => {
    // Cada elemento nuevo se escalona un poco para que no queden uno sobre otro.
    const offset = 16 + (state.elements.length % 6) * 12;
    dispatch({ type: "add", element: newElement(kind, newId(), { x: offset, y: offset }) });
  };

  const save = () => {
    const name = state.name.trim();
    if (!name) return setError("Ponle un nombre al componente.");
    if (isComponentNameTaken(components, name, initial?.id)) return setError("Ya existe un componente con ese nombre.");
    if (state.elements.length === 0) return setError("Agrega al menos un elemento al lienzo.");

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
    <Modal label="Constructor de componentes" size="xl" onClose={onClose}>
      <div className="flex h-[min(40rem,80vh)] flex-col">
        <BuilderHeader
          state={state}
          dispatch={dispatch}
          newId={newId}
          pageIds={pages.map((page) => page.id)}
          isEditing={isEditing}
          onEdited={() => setError(null)}
          onSave={save}
          onClose={onClose}
        />

        <div className="grid min-h-0 flex-1 grid-cols-[3rem_1fr_16rem]">
          <ElementToolbar onAdd={addElement} />

          <div className="min-w-0 overflow-auto bg-canvas p-6 pr-10 pb-12">
            <CanvasToolbar size={{ width: state.width, height: state.height }} />
            <BuilderCanvas state={state} dispatch={dispatch} />
          </div>

          <aside aria-label="Propiedades" className="overflow-y-auto border-l border-line p-3">
            <PropertiesPanel state={state} dispatch={dispatch} newId={newId} />
          </aside>
        </div>

        <footer className="min-h-9 border-t border-line px-4 py-2 text-xs">
          {error ? (
            <p role="alert" className="text-red-400">{error}</p>
          ) : (
            <p className="text-ink-dim">
              Arrastra para mover · suéltalo sobre un rectángulo para acoplarlo (Alt: libre) · las manijas y los bordes del
              lienzo cambian el tamaño · flechas 1 px (Shift: 10) · Supr elimina.
            </p>
          )}
        </footer>
      </div>
    </Modal>
  );
}

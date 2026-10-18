"use client";

import { useReducer, useState, type ReactNode } from "react";
import { CATEGORY_LABELS } from "../side-panel/data";
import { pruneLinks } from "../navigation/links";
import { newElement, TEMPLATES, type TemplateId } from "../site/component-templates";
import { isComponentNameTaken } from "../site/rules";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { ComponentCategory, ComponentDef, ElementKind } from "../site/types";
import { Modal } from "../ui/modal";
import { EllipseIcon, ImageIcon, RectangleIcon, TextIcon } from "../viewport/icons";
import { BuilderCanvas } from "./builder-canvas";
import { builderReducer, initialBuilderState } from "./builder-reducer";
import { PropertiesPanel } from "./properties-panel";

const TOOLS: { kind: ElementKind; label: string; icon: ReactNode }[] = [
  { kind: "rect", label: "Rectángulo", icon: <RectangleIcon /> },
  { kind: "ellipse", label: "Elipse", icon: <EllipseIcon /> },
  { kind: "text", label: "Texto", icon: <TextIcon /> },
  { kind: "image", label: "Imagen", icon: <ImageIcon /> },
];

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
    if (isComponentNameTaken(components, name, initial?.id)) {
      return setError("Ya existe un componente con ese nombre.");
    }
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
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <input
            autoFocus
            aria-label="Nombre del componente"
            placeholder="Nombre del componente"
            value={state.name}
            maxLength={40}
            onChange={(e) => {
              dispatch({ type: "meta", patch: { name: e.target.value } });
              setError(null);
            }}
            className="h-8 w-56 rounded-md border border-line bg-canvas px-3 text-[13px] outline-none placeholder:text-ink-dim focus:border-accent"
          />

          <select
            aria-label="Categoría"
            value={state.category}
            onChange={(e) =>
              dispatch({ type: "meta", patch: { category: e.target.value as ComponentCategory } })
            }
            className="h-8 rounded-md border border-line bg-canvas px-2 text-xs outline-none focus:border-accent [&>option]:bg-panel"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            aria-label="Cargar una plantilla"
            value=""
            onChange={(e) =>
              e.target.value &&
              dispatch({
                type: "template",
                templateId: e.target.value as TemplateId,
                nextId: newId,
                pageIds: pages.map((page) => page.id),
              })
            }
            className="h-8 rounded-md border border-line bg-canvas px-2 text-xs outline-none focus:border-accent [&>option]:bg-panel"
          >
            <option value="">Cargar plantilla…</option>
            {TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>{template.label}</option>
            ))}
          </select>

          <span className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90"
            >
              {isEditing ? "Guardar cambios" : "Guardar componente"}
            </button>
          </span>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[3rem_1fr_16rem]">
          <div role="toolbar" aria-label="Agregar elementos" className="flex flex-col items-center gap-1 border-r border-line py-2">
            {TOOLS.map((tool) => (
              <button
                key={tool.kind}
                type="button"
                aria-label={`Agregar ${tool.label.toLowerCase()}`}
                title={`Agregar ${tool.label.toLowerCase()}`}
                onClick={() => addElement(tool.kind)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink"
              >
                {tool.icon}
              </button>
            ))}
          </div>

          <div className="min-w-0 overflow-auto bg-canvas p-6">
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
              Arrastra para mover · la esquina cambia el tamaño · flechas ajustan 1 px (Shift: 10) · Supr elimina.
            </p>
          )}
        </footer>
      </div>
    </Modal>
  );
}

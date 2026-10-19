"use client";

import type { Dispatch } from "react";
import { CATEGORY_LABELS } from "../side-panel/data";
import { TEMPLATES, type TemplateId } from "../site/component-templates";
import type { ComponentCategory } from "../site/types";
import type { BuilderAction, BuilderState } from "./builder-reducer";

const selectClass =
  "h-8 rounded-md border border-line bg-canvas px-2 text-xs outline-none focus:border-accent [&>option]:bg-panel";

interface BuilderHeaderProps {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
  newId: () => string;
  /** Las páginas que existen: los enlaces de una plantilla a otras páginas se descartan. */
  pageIds: string[];
  isEditing: boolean;
  onEdited: () => void;
  onSave: () => void;
  onClose: () => void;
}

/** La cabecera del constructor: nombre, categoría, plantilla y los botones de guardar y cancelar. */
export function BuilderHeader({ state, dispatch, newId, pageIds, isEditing, onEdited, onSave, onClose }: BuilderHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
      <input
        autoFocus
        aria-label="Nombre del componente"
        placeholder="Nombre del componente"
        value={state.name}
        maxLength={40}
        onChange={(e) => {
          dispatch({ type: "meta", patch: { name: e.target.value } });
          onEdited();
        }}
        className="h-8 w-56 rounded-md border border-line bg-canvas px-3 text-[13px] outline-none placeholder:text-ink-dim focus:border-accent"
      />

      <select
        aria-label="Categoría"
        value={state.category}
        onChange={(e) => dispatch({ type: "meta", patch: { category: e.target.value as ComponentCategory } })}
        className={selectClass}
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
          dispatch({ type: "template", templateId: e.target.value as TemplateId, nextId: newId, pageIds })
        }
        className={selectClass}
      >
        <option value="">Cargar plantilla…</option>
        {TEMPLATES.map((template) => (
          <option key={template.id} value={template.id}>{template.label}</option>
        ))}
      </select>

      <span className="ml-auto flex gap-2">
        <button type="button" onClick={onClose} className="h-8 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink">
          Cancelar
        </button>
        <button type="button" onClick={onSave} className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90">
          {isEditing ? "Guardar cambios" : "Guardar componente"}
        </button>
      </span>
    </header>
  );
}

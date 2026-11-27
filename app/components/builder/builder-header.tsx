"use client";

import type { Dispatch } from "react";
import { CategorySelect } from "./category-select";
import type { BuilderAction, BuilderState } from "./builder-reducer";

const selectClass =
  "h-9 rounded-lg border border-line bg-canvas px-3 text-xs outline-none focus:border-accent text-ink [&>option]:bg-panel";

interface BuilderHeaderProps {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
  newId: () => string;
  pageIds: string[];
  isEditing: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onEdited: () => void;
  onSave: () => void;
  onSaveTemplate?: () => void;
  isTemplate?: boolean;
  onClose: () => void;
}

/** La cabecera del constructor: título, nombre, categoría, dimensiones y botones de acción. */
export function BuilderHeader({
  state,
  dispatch,
  isEditing,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onEdited,
  onSave,
  onSaveTemplate,
  isTemplate = false,
  onClose,
}: BuilderHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel px-5 py-3 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Título de la herramienta */}
        <div className="flex items-center gap-2 pr-3 border-r border-line">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <span className="text-xs font-bold text-ink">
            {isEditing ? "Editar Componente" : "Nuevo Componente"}
          </span>
        </div>

        {/* Nombre del componente */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="builder-comp-name" className="text-[11px] font-medium text-ink-dim">
            Nombre:
          </label>
          <input
            id="builder-comp-name"
            autoFocus
            aria-label="Nombre del componente"
            placeholder="Ej. Tarjeta de Trámite, Banner..."
            value={state.name}
            maxLength={40}
            onChange={(e) => {
              dispatch({ type: "meta", patch: { name: e.target.value } });
              onEdited();
            }}
            className="h-9 w-64 rounded-lg border border-line bg-canvas px-3 text-xs font-medium text-ink outline-none placeholder:text-ink-dim focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Categoría */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-ink-dim">Categoría:</label>
          <CategorySelect
            value={state.category}
            onChange={(category) => dispatch({ type: "meta", patch: { category } })}
            className={selectClass}
          />
        </div>

        {/* Dimensiones actuales */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-line bg-canvas/60 px-2.5 py-1 text-[11px] font-mono text-ink-dim">
          <span className="text-ink font-semibold">{state.width}</span>
          <span>×</span>
          <span className="text-ink font-semibold">{state.height}</span>
          <span className="text-[10px]">px</span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-2">
        {/* Deshacer y Rehacer */}
        <div className="flex items-center gap-1 border-r border-line pr-2 mr-1">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Deshacer (Ctrl+Z)"
            aria-label="Deshacer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-canvas text-base font-bold text-ink hover:bg-hover disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors shadow-2xs"
          >
            ↶
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Rehacer (Ctrl+Y o Ctrl+Mayús+Z)"
            aria-label="Rehacer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-canvas text-base font-bold text-ink hover:bg-hover disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors shadow-2xs"
          >
            ↷
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-lg border border-line px-4 text-xs font-medium text-ink-dim hover:bg-hover hover:text-ink cursor-pointer transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 cursor-pointer active:scale-95 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {isTemplate ? "Guardar plantilla" : isEditing ? "Guardar cambios" : "Guardar componente"}
        </button>
        {onSaveTemplate && !isEditing && <button type="button" onClick={onSaveTemplate} className="h-9 rounded-lg border border-line px-3 text-xs font-medium text-ink hover:bg-hover cursor-pointer">Guardar como plantilla</button>}
      </div>
    </header>
  );
}

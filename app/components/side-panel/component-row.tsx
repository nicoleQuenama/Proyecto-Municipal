"use client";

import { useState } from "react";
import { ComponentThumb } from "../site/component-view";
import type { ComponentDef } from "../site/types";
import { Badge } from "../ui/badge";
import { plural } from "../versioning/versioning-rules";

const rowButton =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink";

export interface ComponentRowProps {
  def: ComponentDef;
  usage: number;
  onAdd: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function ComponentRow({
  def,
  usage,
  onAdd,
  onEdit,
  onDuplicate,
  onDelete,
  disabled,
  disabledReason,
}: ComponentRowProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <li className="flex flex-col gap-2 rounded-lg bg-red-500/10 p-2">
        <p role="alert" className="text-xs text-red-300">
          ¿Eliminar «{def.name}»?
          {usage > 0
            ? ` Lo usan ${plural(usage, "bloque", "bloques")}: se quitarán de las páginas.`
            : " No lo usa ningún bloque."}
        </p>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="h-7 rounded-md border border-red-500/60 px-3 text-xs text-red-400 hover:bg-red-500/15"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-7 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink"
          >
            Cancelar
          </button>
        </span>
      </li>
    );
  }

  return (
    <li
      className={`group flex items-center gap-2 rounded-lg border border-transparent p-2 hover:border-line hover:bg-hover ${
        disabled ? "opacity-60" : ""
      }`}
      title={disabled ? disabledReason : undefined}
    >
      <ComponentThumb def={def} />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[13px] font-medium">
          <span className="truncate">{def.name}</span>
          {def.custom && <Badge tone="accent">Propio</Badge>}
        </p>
        <p className="truncate text-xs text-ink-dim">{def.description}</p>
      </div>

      <button type="button" aria-label={`Editar ${def.name}`} title="Editar en el constructor" onClick={onEdit} className={`${rowButton} hidden group-hover:flex focus:flex`}>✎</button>
      <button type="button" aria-label={`Duplicar ${def.name}`} title="Duplicar componente" onClick={onDuplicate} className={`${rowButton} hidden group-hover:flex focus:flex`}>⧉</button>
      <button type="button" aria-label={`Eliminar ${def.name}`} title="Eliminar" onClick={() => setConfirming(true)} className={`${rowButton} hidden hover:text-red-400 group-hover:flex focus:flex`}>×</button>

      <button
        type="button"
        aria-label={disabled ? disabledReason : `Agregar ${def.name} a la página`}
        title={disabled ? disabledReason : "Agregar a la página"}
        disabled={disabled}
        onClick={disabled ? undefined : onAdd}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-30 text-ink-dim"
            : "text-ink-dim hover:bg-accent hover:text-white"
        }`}
      >
        +
      </button>
    </li>
  );
}

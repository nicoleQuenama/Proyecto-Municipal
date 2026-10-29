import { useState, type ReactNode } from "react";
import {
  ALIGN_OPTIONS,
  BLOCK_OPTIONS,
  FONT_OPTIONS,
  MAX_SIZE,
  MIN_SIZE,
} from "./constants";
import {
  ColorButton,
  Separator,
  fieldClass,
  ToolbarButton,
} from "./toolbar-controls";
import type { BlockTag, TitleState } from "./types";

interface ToolbarProps {
  state: TitleState;
  onChange: (patch: Partial<TitleState>) => void;
  /** Solo con el titular: restablece sus estilos. */
  onReset?: () => void;
  /** A qué afecta la barra: «titular», «Botón «Explorar»», «3 elementos». */
  caption: string;
  /** Con el titular la barra ofrece todo; con una selección, solo el formato que vale para elementos. */
  mode?: "title" | "selection";
  /** Controles extra junto al rótulo (el alcance de los cambios). */
  extra?: ReactNode;
  /** Solo con el titular: lo elimina de la página. */
  onRemoveTitle?: () => void;
}

const clampSize = (n: number) => Math.min(MAX_SIZE, Math.max(MIN_SIZE, n));

export function Toolbar({ state, onChange, onReset, caption, mode = "title", extra, onRemoveTitle }: ToolbarProps) {
  const isTitle = mode === "title";
  const [linkOpen, setLinkOpen] = useState(false);
  const { size, list } = state;

  return (
    <div
      role="toolbar"
      aria-label="Editor de titular"
      className="flex h-10 w-max min-w-full items-center gap-1 px-3 text-xs text-ink"
    >
      <span className="mr-1 max-w-56 shrink-0 truncate rounded-md bg-accent/15 px-2 py-1 font-medium text-accent">
        Editando: {caption}
      </span>
      {extra}

      {isTitle && (
        <select
          aria-label="Estilo de bloque"
          className={fieldClass}
          value={state.block}
          onChange={(e) => onChange({ block: e.target.value as BlockTag })}
        >
          {BLOCK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      <select
        aria-label="Tipografía"
        className={fieldClass}
        value={state.font}
        onChange={(e) => onChange({ font: e.target.value })}
      >
        {FONT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <div className="flex shrink-0 items-center gap-0.5">
        <ToolbarButton
          label="Reducir tamaño"
          onClick={() => onChange({ size: clampSize(size - 1) })}
        >
          −
        </ToolbarButton>
        <input
          aria-label="Tamaño de fuente en px"
          type="number"
          min={MIN_SIZE}
          max={MAX_SIZE}
          value={size}
          onChange={(e) =>
            onChange({ size: clampSize(Number(e.target.value) || MIN_SIZE) })
          }
          className="h-7 w-12 rounded-md bg-hover text-center text-xs outline-none focus:ring-1 focus:ring-accent"
        />
        <ToolbarButton
          label="Aumentar tamaño"
          onClick={() => onChange({ size: clampSize(size + 1) })}
        >
          +
        </ToolbarButton>
      </div>

      <Separator />

      <ToolbarButton label="Negrita" active={state.bold} className="font-bold" onClick={() => onChange({ bold: !state.bold })}>B</ToolbarButton>
      <ToolbarButton label="Cursiva" active={state.italic} className="italic" onClick={() => onChange({ italic: !state.italic })}>I</ToolbarButton>
      <ToolbarButton label="Subrayado" active={state.underline} className="underline" onClick={() => onChange({ underline: !state.underline })}>U</ToolbarButton>
      <ToolbarButton label="Tachado" active={state.strike} className="line-through" onClick={() => onChange({ strike: !state.strike })}>S</ToolbarButton>

      <ColorButton label="Color de texto" value={state.color} onChange={(color) => onChange({ color })}>
        <b>A</b>
      </ColorButton>
      {isTitle && (
        <ColorButton
          label="Resaltado"
          value={state.highlight ?? "#ffff00"}
          active={state.highlight !== null}
          onChange={(highlight) => onChange({ highlight })}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2l2 2-8 8H4v-2l8-8zM2 14h12" />
          </svg>
        </ColorButton>
      )}

      <Separator />

      {ALIGN_OPTIONS.filter(({ value }) => isTitle || value !== "justify").map(({ value, label, icon }) => (
        <ToolbarButton
          key={value}
          label={label}
          active={state.align === value}
          onClick={() => onChange({ align: value })}
        >
          {icon}
        </ToolbarButton>
      ))}

      <Separator />

      <ToolbarButton label="Lista con viñetas" active={list === "ul"} onClick={() => onChange({ list: list === "ul" ? "none" : "ul" })}>•</ToolbarButton>
      <ToolbarButton label="Lista numerada" active={list === "ol"} onClick={() => onChange({ list: list === "ol" ? "none" : "ol" })}>1.</ToolbarButton>

      {isTitle && <Separator />}

      {isTitle && (
        <ToolbarButton label="Enlace" active={linkOpen || !!state.link} onClick={() => setLinkOpen((o) => !o)}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" />
            <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" />
          </svg>
        </ToolbarButton>
      )}
      {isTitle && linkOpen && (
        <input
          autoFocus
          type="url"
          aria-label="URL del enlace"
          placeholder="https://…"
          value={state.link}
          onChange={(e) => onChange({ link: e.target.value.trim() })}
          onKeyDown={(e) => e.key === "Enter" && setLinkOpen(false)}
          className={`${fieldClass} w-44 border-line`}
        />
      )}
      {onReset && <ToolbarButton label="Restablecer estilos" onClick={onReset}>⟲</ToolbarButton>}
      {onRemoveTitle && (
        <ToolbarButton label="Eliminar el titular de la página" className="text-red-400" onClick={onRemoveTitle}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 4h10M6 4V2.5h4V4M4.5 4l.8 9.5a1.5 1.5 0 001.5 1.5h2.4a1.5 1.5 0 001.5-1.5L11.5 4" />
          </svg>
        </ToolbarButton>
      )}

      {isTitle && (
      <div className="ml-auto flex shrink-0 items-center gap-3 pl-3">
        <label className="flex cursor-pointer items-center gap-2 text-ink-dim hover:text-ink">
          <input
            type="checkbox"
            checked={state.applyToSite}
            onChange={(e) => onChange({ applyToSite: e.target.checked })}
            className="h-3.5 w-3.5 accent-accent"
          />
          Seguir estilos del sitio
        </label>
        <button
          type="button"
          aria-pressed={state.editing}
          onClick={() => onChange({ editing: !state.editing })}
          className={`h-7 rounded-md px-3 font-medium transition-colors ${
            state.editing
              ? "bg-accent text-white hover:bg-accent/90"
              : "border border-line text-ink hover:bg-hover"
          }`}
        >
          {state.editing ? "Editando titular" : "Editar titular"}
        </button>
      </div>
      )}
    </div>
  );
}

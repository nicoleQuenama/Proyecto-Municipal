import { useState } from "react";
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
  onReset: () => void;
}

const clampSize = (n: number) => Math.min(MAX_SIZE, Math.max(MIN_SIZE, n));

export function Toolbar({ state, onChange, onReset }: ToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const { size, list } = state;

  return (
    <div
      role="toolbar"
      aria-label="Editor de titular"
      className="flex min-h-12 min-w-0 flex-1 flex-wrap items-center gap-1 px-3 py-1.5 text-xs text-ink"
    >
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
      <ColorButton
        label="Resaltado"
        value={state.highlight ?? "#ffff00"}
        active={state.highlight !== null}
        onChange={(highlight) => onChange({ highlight })}
      >
        ✎
      </ColorButton>

      <Separator />

      {ALIGN_OPTIONS.map(({ value, label, icon }) => (
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

      <Separator />

      <ToolbarButton label="Enlace" active={linkOpen || !!state.link} onClick={() => setLinkOpen((o) => !o)}>🔗</ToolbarButton>
      {linkOpen && (
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
      <ToolbarButton label="Restablecer estilos" onClick={onReset}>⟲</ToolbarButton>

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
    </div>
  );
}

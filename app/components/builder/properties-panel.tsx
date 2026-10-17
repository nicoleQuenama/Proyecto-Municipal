"use client";

import { useState, type Dispatch, type ReactNode } from "react";
import { parseImageUrl } from "../media/media-url";
import { LinkEditor } from "../navigation/link-editor";
import { elementLabel, isLinkable } from "../navigation/links";
import { CATEGORY_LABELS } from "../side-panel/data";
import { ROLE_LABELS } from "../styles/registry";
import type { CanvasElement, ComponentCategory, TextAlign } from "../site/types";
import { NumberField } from "../ui/number-field";
import type { BuilderAction, BuilderState } from "./builder-reducer";
import { MAX_CANVAS_SIZE, MIN_CANVAS_SIZE } from "./builder-reducer";

const inputClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
      {label}
      {children}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#cccccc"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full cursor-pointer rounded-md border border-line bg-canvas p-1"
      />
    </Field>
  );
}

/** La URL se valida antes de aplicarse: una imagen con un enlace roto no se guarda. */
function ImageUrlField({ value, onCommit }: { value: string; onCommit: (src: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const commit = () => {
    if (!draft.trim()) {
      setError(null);
      return onCommit("");
    }
    const result = parseImageUrl(draft);
    if (!result.ok) return setError(result.error);

    setError(null);
    onCommit(result.value.src);
  };

  return (
    <Field label="URL de la imagen">
      <input
        type="url"
        placeholder="https://…"
        value={draft}
        aria-invalid={error !== null}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className={inputClass}
      />
      {error && <span role="alert" className="text-red-400">{error}</span>}
    </Field>
  );
}

const actionButton =
  "h-8 rounded-md border border-line px-2 text-xs hover:bg-hover";

interface PropertiesPanelProps {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
  newId: () => string;
}

export function PropertiesPanel({ state, dispatch, newId }: PropertiesPanelProps) {
  const element = state.elements.find((e) => e.id === state.selectedId);

  if (!element) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Componente</h3>

        <Field label="Categoría">
          <select
            value={state.category}
            onChange={(e) => dispatch({ type: "meta", patch: { category: e.target.value as ComponentCategory } })}
            className={inputClass}
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Ancho"
            value={state.width}
            min={MIN_CANVAS_SIZE}
            max={MAX_CANVAS_SIZE}
            onChange={(width) => dispatch({ type: "meta", patch: { width } })}
          />
          <NumberField
            label="Alto"
            value={state.height}
            min={MIN_CANVAS_SIZE}
            max={MAX_CANVAS_SIZE}
            onChange={(height) => dispatch({ type: "meta", patch: { height } })}
          />
        </div>

        <p className="text-xs text-ink-dim">Selecciona un elemento del lienzo para editar sus propiedades.</p>
      </div>
    );
  }

  const patch = (changes: Partial<CanvasElement>) =>
    dispatch({ type: "update", id: element.id, patch: changes });

  const isShape = element.kind === "rect" || element.kind === "ellipse";
  const hasText = element.kind !== "image";
  const hasRadius = element.kind === "rect" || element.kind === "image";

  return (
    <div key={element.id} className="flex flex-col gap-3">
      <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
        {{ rect: "Rectángulo", ellipse: "Elipse", text: "Texto", image: "Imagen" }[element.kind]}
      </h3>

      <Field label="Rol (qué reglas de Apariencia sigue)">
        <select
          value={element.role}
          onChange={(e) => patch({ role: e.target.value as CanvasElement["role"] })}
          className={inputClass}
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {element.role !== "none" && (
          <span className="text-[11px] leading-snug">
            En la página, este elemento usa las reglas de «{ROLE_LABELS[element.role]}». Aquí ves sus valores propios.
          </span>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={element.x} onChange={(x) => patch({ x })} />
        <NumberField label="Y" value={element.y} onChange={(y) => patch({ y })} />
        <NumberField label="Ancho" value={element.width} onChange={(width) => patch({ width })} />
        <NumberField label="Alto" value={element.height} onChange={(height) => patch({ height })} />
      </div>

      {isShape && <ColorField label="Relleno" value={element.fill} onChange={(fill) => patch({ fill })} />}

      {hasRadius && (
        <NumberField label="Esquinas redondeadas" value={element.radius} min={0} onChange={(radius) => patch({ radius })} />
      )}

      {element.kind === "image" && (
        <ImageUrlField value={element.src} onCommit={(src) => patch({ src })} />
      )}

      {hasText && (
        <>
          <Field label={element.kind === "text" ? "Texto" : "Etiqueta"}>
            <textarea
              value={element.text}
              rows={element.kind === "text" ? 3 : 1}
              onChange={(e) => patch({ text: e.target.value })}
              className="w-full resize-none rounded-md border border-line bg-canvas p-2 text-xs text-ink outline-none focus:border-accent"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Tamaño de letra" value={element.fontSize} min={8} max={120} onChange={(fontSize) => patch({ fontSize })} />
            <ColorField label="Color del texto" value={element.color} onChange={(color) => patch({ color })} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Alineación">
              <select
                value={element.align}
                onChange={(e) => patch({ align: e.target.value as TextAlign })}
                className={inputClass}
              >
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-xs">
              <input
                type="checkbox"
                checked={element.bold}
                onChange={(e) => patch({ bold: e.target.checked })}
                className="h-3.5 w-3.5 accent-accent"
              />
              Negrita
            </label>
          </div>
        </>
      )}

      {isLinkable(element) && (
        <div className="flex flex-col gap-1.5 border-t border-line pt-3">
          <span className="text-[11px] text-ink-dim">Contenido</span>
          <LinkEditor
            label={elementLabel(element)}
            link={state.links[element.id]}
            onChange={(link) => dispatch({ type: "link", id: element.id, link })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-line pt-3">
        <button type="button" className={actionButton} onClick={() => dispatch({ type: "reorder", id: element.id, to: "front" })}>Al frente</button>
        <button type="button" className={actionButton} onClick={() => dispatch({ type: "reorder", id: element.id, to: "back" })}>Al fondo</button>
        <button type="button" className={actionButton} onClick={() => dispatch({ type: "duplicate", id: element.id, newId: newId() })}>Duplicar</button>
        <button
          type="button"
          className={`${actionButton} text-red-400 hover:bg-red-500/15`}
          onClick={() => dispatch({ type: "remove", id: element.id })}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

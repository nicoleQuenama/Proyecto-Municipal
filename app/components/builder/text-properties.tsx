"use client";

import type { CanvasElement, TextAlign } from "../site/types";
import { NumberField } from "../ui/number-field";
import { ColorField, Field, inputClass } from "./panel-fields";

interface TextPropertiesProps {
  element: CanvasElement;
  onChange: (changes: Partial<CanvasElement>) => void;
}

/** El texto de un elemento: contenido, tamaño, color, alineación y negrita. */
export function TextProperties({ element, onChange }: TextPropertiesProps) {
  return (
    <>
      <Field label={element.kind === "text" ? "Texto" : "Etiqueta"}>
        <textarea
          value={element.text}
          rows={element.kind === "text" ? 3 : 1}
          onChange={(e) => onChange({ text: e.target.value })}
          className="w-full resize-none rounded-md border border-line bg-canvas p-2 text-xs text-ink outline-none focus:border-accent"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Tamaño de letra" value={element.fontSize} min={8} max={120} onChange={(fontSize) => onChange({ fontSize })} />
        <ColorField label="Color del texto" value={element.color} onChange={(color) => onChange({ color })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Alineación">
          <select
            value={element.align}
            onChange={(e) => onChange({ align: e.target.value as TextAlign })}
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
            onChange={(e) => onChange({ bold: e.target.checked })}
            className="h-3.5 w-3.5 accent-accent"
          />
          Negrita
        </label>
      </div>
    </>
  );
}

"use client";

import { IconPicker } from "../icons/icon-picker";
import type { CanvasElement } from "../site/types";
import { NumberField } from "../ui/number-field";
import { ColorField, Field } from "./panel-fields";

interface IconPropertiesProps {
  element: CanvasElement;
  onChange: (patch: Partial<CanvasElement>) => void;
}

/** Elegir el ícono con un selector visual, y su color, tamaño y grosor de trazo. */
export function IconProperties({ element, onChange }: IconPropertiesProps) {
  // El tamaño del ícono y el de su caja van juntos: así la selección rodea al dibujo.
  const resize = (size: number) => onChange({ fontSize: size, width: size, height: size });

  return (
    <div className="flex flex-col gap-3">
      <Field label="Ícono">
        <IconPicker value={element.icon ?? "star"} onPick={(icon) => onChange({ icon })} />
      </Field>
      <ColorField label="Color del trazo" value={element.color} onChange={(color) => onChange({ color })} />
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Tamaño" value={element.fontSize} min={8} max={200} onChange={resize} />
        <NumberField label="Grosor" value={element.strokeWidth ?? 2} min={0.5} max={4} step={0.5} onChange={(strokeWidth) => onChange({ strokeWidth })} />
      </div>
    </div>
  );
}

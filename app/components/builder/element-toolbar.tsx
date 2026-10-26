import type { ReactNode } from "react";
import type { ElementKind } from "../site/types";
import { IconGlyph } from "../icons/icon-glyph";
import { EllipseIcon, ImageIcon, RectangleIcon, TextIcon, VideoIcon } from "../viewport/icons";

/** Los tipos de elemento que se pueden agregar. Un tipo nuevo es una entrada nueva. */
const TOOLS: { kind: ElementKind; label: string; icon: ReactNode }[] = [
  { kind: "rect", label: "Rectángulo", icon: <RectangleIcon /> },
  { kind: "ellipse", label: "Elipse", icon: <EllipseIcon /> },
  { kind: "text", label: "Texto", icon: <TextIcon /> },
  { kind: "image", label: "Imagen", icon: <ImageIcon /> },
  { kind: "icon", label: "Ícono", icon: <IconGlyph name="star" size={16} /> },
  { kind: "video", label: "Video", icon: <VideoIcon /> },
];

/** La barra de la izquierda del constructor: un botón por cada tipo de elemento. */
export function ElementToolbar({ onAdd }: { onAdd: (kind: ElementKind) => void }) {
  return (
    <div role="toolbar" aria-label="Agregar elementos" className="flex flex-col items-center gap-1 border-r border-line py-2">
      {TOOLS.map((tool) => (
        <button
          key={tool.kind}
          type="button"
          aria-label={`Agregar ${tool.label.toLowerCase()}`}
          title={`Agregar ${tool.label.toLowerCase()}`}
          onClick={() => onAdd(tool.kind)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink"
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

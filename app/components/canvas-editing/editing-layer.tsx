"use client";

import type { Size } from "./limits";
import { DropPreview, GridOverlay, GuideLines } from "./overlays";
import { SectionResizeHandles } from "./section-resize-handles";
import { useCanvasSettings } from "./settings-context";
import type { CanvasGestures } from "./use-canvas-gestures";

interface EditingLayerProps {
  gestures: Pick<CanvasGestures, "guides" | "drop">;
  size: Size;
  /** Solo el lienzo en edición muestra su cuadrícula y sus bordes arrastrables. */
  active: boolean;
  onResize: (size: Partial<Size>) => void;
}

/** Lo que se dibuja encima de un lienzo mientras se edita: cuadrícula, guías, destino de acoplado y bordes. */
export function EditingLayer({ gestures, size, active, onResize }: EditingLayerProps) {
  const { settings } = useCanvasSettings();

  return (
    <>
      {active && settings.grid && <GridOverlay />}
      {gestures.drop && <DropPreview parent={gestures.drop.parent} slot={gestures.drop.slot} />}
      <GuideLines guides={gestures.guides} width={size.width} height={size.height} />
      {active && <SectionResizeHandles size={size} onResize={onResize} />}
    </>
  );
}

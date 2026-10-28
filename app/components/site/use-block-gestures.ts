"use client";

import { useRef, type RefObject } from "react";
import { isBackdrop } from "../canvas-editing/backdrop";
import type { Size } from "../canvas-editing/limits";
import { useCanvasSettings } from "../canvas-editing/settings-context";
import { useCanvasGestures, type CanvasCommands, type CanvasGestures } from "../canvas-editing/use-canvas-gestures";
import { deviceFrameChange, deviceSizeChange } from "../responsive/device-actions";
import { isAdaptive, type Device } from "../responsive/devices";
import { dockChange } from "./dock-patch";
import { elementChange, sectionResize, type EditTarget } from "./scope-actions";
import { useSiteDispatch } from "./site-context";
import { useNudgeKeys } from "./use-nudge-keys";
import type { ComponentDef, ElementOverride } from "./types";

/** Edición directa de un bloque en la página: sus gestos y el lienzo (la sección) donde ocurren. */
export interface BlockGestures extends CanvasGestures {
  canvasRef: RefObject<HTMLDivElement | null>;
  /** El bloque está seleccionado: muestra su cuadrícula y sus bordes arrastrables. */
  sectionActive: boolean;
  size: Size;
  /** El fondo de la sección (una pieza que la cubre toda), si tiene uno. */
  backdropId: string | undefined;
  onResizeSection: (size: Partial<Size>) => void;
}

interface BlockGesturesOptions {
  pageId: string;
  blockId: string;
  /** El componente tal como se ve en este bloque (con su formato propio ya aplicado). */
  view: ComponentDef | undefined;
  selected: boolean;
  /** Los elementos marcados de este bloque (Ctrl-clic o rectángulo): arrastrar uno mueve a todos. */
  selectedElementIds?: string[];
  /** Dispositivo que se está viendo; en tablet o móvil lo que se mueve se guarda en el diseño propio de ese dispositivo. */
  device: Device;
}

/**
 * Los gestos sobre los elementos de un bloque. Según el alcance elegido, lo que cambian se guarda como formato
 * propio del bloque o en el componente (ver `scope-actions.ts`).
 */
export function useBlockGestures({ pageId, blockId, view, selected, selectedElementIds = [], device }: BlockGesturesOptions): BlockGestures {
  const dispatch = useSiteDispatch();
  const { settings } = useCanvasSettings();
  const canvasRef = useRef<HTMLDivElement>(null);

  const size = { width: view?.width ?? 0, height: view?.height ?? 0 };
  const elements = view?.elements ?? [];
  const backdropId = elements.find((element) => isBackdrop(element, size))?.id;

  const target: EditTarget = { pageId, blockId, componentId: view?.id ?? "" };
  const onDevice = isAdaptive(device) ? { pageId, blockId, device } : null;
  const change = (elementId: string, patch: ElementOverride) =>
    dispatch(onDevice ? deviceFrameChange(onDevice, elementId, patch) : elementChange(settings.scope, target, elementId, patch));
  const resizeSection = (next: Partial<Size>) =>
    dispatch(onDevice ? deviceSizeChange(onDevice, next, backdropId) : sectionResize(settings.scope, target, next, backdropId));
  useNudgeKeys(selected, elements, change);
  const elementOf = (id: string) => elements.find((element) => element.id === id);

  // Al agarrar un elemento que ya estaba marcado junto a otros, se anota dónde estaba cada uno: se mueven como grupo.
  const group = useRef<Record<string, { x: number; y: number }> | null>(null);

  const commands: CanvasCommands = {
    select: (id) => {
      if (selected && selectedElementIds.length > 1 && selectedElementIds.includes(id)) {
        group.current = Object.fromEntries(
          elements.filter((element) => selectedElementIds.includes(element.id)).map((element) => [element.id, { x: element.x, y: element.y }]),
        );
        return;
      }
      group.current = null;
      dispatch({ type: "block/select", id: blockId });
      dispatch({ type: "element/select", id });
    },
    move: (id, x, y) => {
      const origins = group.current;
      const own = origins?.[id];
      if (!origins || !own) return change(id, { x, y, ...dockChange(undefined, null, undefined) });
      for (const [otherId, origin] of Object.entries(origins)) {
        const at = otherId === id ? { x, y } : { x: origin.x + (x - own.x), y: origin.y + (y - own.y) };
        change(otherId, { ...at, ...dockChange(undefined, null, undefined) });
      }
    },
    // El fondo de una tarjeta es la tarjeta: estirarlo cambia el tamaño de toda la sección.
    resize: (id, frame) =>
      id === backdropId
        ? resizeSection({ width: frame.width, height: frame.height })
        : change(id, { ...frame, fitToParent: elementOf(id)?.fitToParent ? false : undefined }),
    dock: (id, parentId, anchor) => change(id, dockChange(elementOf(id), parentId, anchor)),
  };

  const gestures = useCanvasGestures({ size, elements, settings, commands, canvasRef, backdropGrowsSection: true });

  return { ...gestures, canvasRef, sectionActive: selected, size, backdropId, onResizeSection: resizeSection };
}

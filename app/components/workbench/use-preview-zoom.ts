"use client";

import { useCallback, useState } from "react";

const MIN = 0.25;
const MAX = 3;
const STEP = 0.25;

const clamp = (value: number) => Math.min(MAX, Math.max(MIN, Math.round(value * 100) / 100));

/** El zoom de una vista previa: automático (cabe a lo ancho) hasta que el usuario lo cambia a mano. */
export function usePreviewZoom(fit: number) {
  const [manual, setManual] = useState<number | null>(null);
  const zoom = manual ?? fit;

  const zoomIn = useCallback(() => setManual(clamp(zoom + STEP)), [zoom]);
  const zoomOut = useCallback(() => setManual(clamp(zoom - STEP)), [zoom]);
  const actual = useCallback(() => setManual(1), []);
  const reset = useCallback(() => setManual(null), []);

  return { zoom, isFit: manual === null, zoomIn, zoomOut, actual, reset, atMin: zoom <= MIN, atMax: zoom >= MAX };
}

export type PreviewZoom = ReturnType<typeof usePreviewZoom>;

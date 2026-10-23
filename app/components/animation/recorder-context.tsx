"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useCurrentPage, useSite } from "../site/site-context";
import type { PresetId } from "./presets";
import type { RecordedAnimation } from "./types";
import { useRecording } from "./use-recording";

interface RecorderValue {
  /** Cuándo empezó la grabación abierta (marca de `performance.now()`), o null si no se graba. */
  startedAt: number | null;
  stepCount: number;
  notice: string | null;
  /** Se puede añadir un efecto: hay una sección seleccionada. */
  canAddEffect: boolean;
  /** La animación que se ve en el modal de vista previa. */
  previewId: string | null;
  start: () => void;
  finish: () => void;
  cancel: () => void;
  addEffect: (effect: PresetId) => void;
  openPreview: (id: string | null) => void;
}

const RecorderContext = createContext<RecorderValue | null>(null);

export function useRecorder(): RecorderValue {
  const value = useContext(RecorderContext);
  if (!value) throw new Error("Debe usarse dentro de <RecorderProvider>");
  return value;
}

const EMPTY_NOTICE = "No se grabó ningún cambio: mueve, redimensiona o recolorea algo mientras grabas.";

export function RecorderProvider({ children }: { children: ReactNode }) {
  const site = useSite();
  const page = useCurrentPage();
  const [notice, setNotice] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Al terminar, se abre la vista previa de lo grabado; si no había nada, se avisa.
  const onSaved = useCallback((animation: RecordedAnimation | undefined, save: boolean) => {
    if (animation) setPreviewId(animation.id);
    else if (save) setNotice(EMPTY_NOTICE);
  }, []);
  const recording = useRecording(onSaved);

  const value = useMemo<RecorderValue>(
    () => ({
      startedAt: recording.startedAt,
      stepCount: recording.stepCount,
      notice,
      canAddEffect: page.blocks.some((b) => b.id === site.selectedId),
      previewId,
      start: () => {
        setNotice(null);
        recording.start();
      },
      finish: () => recording.end(true),
      cancel: () => recording.end(false),
      addEffect: recording.addEffect,
      openPreview: setPreviewId,
    }),
    [recording, notice, page.blocks, site.selectedId, previewId],
  );

  return <RecorderContext value={value}>{children}</RecorderContext>;
}

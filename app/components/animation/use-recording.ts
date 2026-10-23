"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import { SECTION_KEY } from "../site/types";
import { buildSteps } from "./build-steps";
import { recordChanges } from "./diff";
import { usePageValues } from "./page-values";
import { DEFAULT_PARAMS, type PresetId } from "./presets";
import { sealSteps, type Session } from "./session";
import type { RecordedAnimation } from "./types";

/** Graba como una macro: lo que se edita mientras dura la grabación se guarda como pasos con su tiempo. */
export function useRecording(onSaved: (animation: RecordedAnimation | undefined, save: boolean) => void) {
  const site = useSite();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const values = usePageValues();

  const session = useRef<Session | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [stepCount, setStepCount] = useState(0);

  // Cada pulsación del puntero abre un gesto nuevo.
  useEffect(() => {
    if (startedAt === null) return;
    const newGesture = () => {
      if (session.current) session.current.gesture += 1;
    };
    window.addEventListener("pointerdown", newGesture, true);
    return () => window.removeEventListener("pointerdown", newGesture, true);
  }, [startedAt]);

  // Cada vez que la página cambia mientras se graba, lo que cambió pasa a ser un paso.
  useEffect(() => {
    const current = session.current;
    if (!current) return;
    current.steps = recordChanges(current.steps, current.last, values, performance.now() - current.startedAt, current.gesture);
    current.last = values;
    setStepCount(current.steps.length);
  }, [values]);

  const start = useCallback(() => {
    const now = performance.now();
    session.current = {
      startedAt: now,
      pageId: page.id,
      baseline: { blocks: page.blocks, components: site.components },
      steps: [],
      last: values,
      gesture: 0,
    };
    setStartedAt(now);
    setStepCount(0);
  }, [page, site.components, values]);

  const end = useCallback(
    (save: boolean) => {
      const current = session.current;
      if (!current) return;

      const steps = sealSteps(current.steps);
      const animation =
        save && steps.length > 0
          ? { id: crypto.randomUUID(), name: `Animación ${(page.animations?.length ?? 0) + 1}`, steps }
          : undefined;
      dispatch({ type: "animation/finish", pageId: current.pageId, baseline: current.baseline, animation });

      session.current = null;
      setStartedAt(null);
      onSaved(animation, save);
    },
    [dispatch, page.animations, onSaved],
  );

  /** Añade un efecto de la galería a lo seleccionado, en el momento que lleva la grabación. */
  const addEffect = useCallback(
    (effect: PresetId) => {
      const current = session.current;
      const block = page.blocks.find((b) => b.id === site.selectedId);
      if (!current || !block) return;

      const at = performance.now() - current.startedAt;
      const key = site.selectedElementId ?? SECTION_KEY;
      const steps = buildSteps(effect, DEFAULT_PARAMS, [{ blockId: block.id, key }], "ease-in-out", at);
      current.steps = [...current.steps, ...steps.map((step) => ({ ...step, gesture: -1 }))];
      setStepCount(current.steps.length);
    },
    [page.blocks, site.selectedId, site.selectedElementId],
  );

  return useMemo(() => ({ startedAt, stepCount, start, end, addEffect }), [startedAt, stepCount, start, end, addEffect]);
}

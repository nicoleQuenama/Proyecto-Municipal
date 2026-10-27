"use client";

import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import type { HistoryControls } from "./history-context";
import { EMPTY_HISTORY, record, redoStep, undoStep, type History } from "./history-rules";
import type { SiteAction, SiteState } from "./types";

/**
 * El historial del sitio: `track` anota cada cambio justo antes de aplicarlo; `undo` y `redo` vuelven a un estado
 * anterior o posterior mediante `load`. Vive en memoria mientras la pestaña está abierta.
 */
export function useHistory(latest: RefObject<SiteState>, load: (state: SiteState) => void) {
  const [history, setHistory] = useState<History>(EMPTY_HISTORY);
  const mirror = useRef(history);

  const commit = useCallback((next: History) => {
    mirror.current = next;
    setHistory(next);
  }, []);

  const track = useCallback(
    (action: SiteAction) => {
      const next = record(mirror.current, latest.current, action, Date.now());
      if (next !== mirror.current) commit(next);
    },
    [latest, commit],
  );

  const step = useCallback(
    (move: typeof undoStep) => {
      const result = move(mirror.current, latest.current);
      if (!result) return;
      commit(result.history);
      load(result.state);
    },
    [latest, commit, load],
  );
  const undo = useCallback(() => step(undoStep), [step]);
  const redo = useCallback(() => step(redoStep), [step]);

  const controls = useMemo<HistoryControls>(
    () => ({ undo, redo, undoCount: history.past.length, redoCount: history.future.length }),
    [undo, redo, history],
  );
  return { track, undo, controls };
}

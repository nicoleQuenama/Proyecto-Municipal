"use client";

import { useState } from "react";
import { useDesignSnapshot } from "./use-design-snapshot";
import { useVersioning } from "./versioning-context";

/** Olvidar las versiones y publicaciones anteriores y seguir desde el diseño de ahora (pide confirmar antes). */
export function ResetHistory() {
  const { dispatch } = useVersioning();
  const design = useDesignSnapshot();
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className="self-start text-xs text-ink-dim hover:text-red-400 hover:underline">
        Borrar el historial anterior y empezar desde ahora…
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-red-400/50 p-3 text-xs">
      <p>Se borran todas las versiones y publicaciones guardadas. El diseño actual no cambia y pasa a ser el punto de partida. No se puede deshacer.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "history/reset", baseline: design });
            setAsking(false);
          }}
          className="h-8 rounded-md bg-red-500 px-3 text-white hover:bg-red-600"
        >
          Sí, borrar el historial
        </button>
        <button type="button" onClick={() => setAsking(false)} className="h-8 rounded-md border border-line px-3 hover:bg-hover">
          Cancelar
        </button>
      </div>
    </div>
  );
}

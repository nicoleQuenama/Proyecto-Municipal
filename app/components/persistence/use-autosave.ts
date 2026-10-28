"use client";

import { useEffect, useState } from "react";
import { REQUEST_HEADER } from "../../server/request-header";

const SAVE_DELAY_MS = 800;
const URL_OF = (part: string) => `/api/cms/project?part=${part}`;
/** Con `?fresh` en la dirección el editor arranca de cero y no lee ni escribe el proyecto guardado (para pruebas). */
const isFresh = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("fresh");
const HEADERS = { "content-type": "application/json", [REQUEST_HEADER]: "1" };

/**
 * Guarda una parte del proyecto en el servidor después de cada cambio y la recupera al abrir el editor.
 * Hasta que termina de cargar lo guardado no se guarda nada, para no pisarlo con el estado de partida.
 */
export function useAutosave<T>(part: string, state: T, restore: (saved: T) => void, enabled = true) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isFresh() || !enabled) return;
    let cancelled = false;
    fetch(URL_OF(part), { headers: HEADERS })
      .then((response) => (response.ok ? response.json() : null))
      .then((saved: T | null) => {
        if (cancelled) return;
        if (saved) restore(saved);
        setReady(true);
      })
      .catch(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
    // Solo al abrir: restaurar no debe repetirse cuando cambie el estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      fetch(URL_OF(part), { method: "PUT", headers: HEADERS, body: JSON.stringify(state) }).catch(() => {});
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, part, state]);
}

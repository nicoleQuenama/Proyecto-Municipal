"use client";

import { createContext, useCallback, useContext, useReducer, useState, type Dispatch, type ReactNode } from "react";
import { externalReducer, INITIAL_EXTERNAL } from "./external-reducer";
import { loadPage, normalizeSiteUrl } from "./load-page";
import type { ExternalAction, ExternalState } from "./types";

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string };

interface ExternalContextValue {
  state: ExternalState;
  dispatch: Dispatch<ExternalAction>;
  status: Status;
  /** Abre una página del sitio (la primera vez, también lo conecta). Devuelve true si funcionó. */
  open: (rawUrl: string) => Promise<boolean>;
  editorOpen: boolean;
  setEditorOpen: (open: boolean) => void;
}

const ExternalContext = createContext<ExternalContextValue | null>(null);

export function useExternal() {
  const ctx = useContext(ExternalContext);
  if (!ctx) throw new Error("Debe usarse dentro de <ExternalProvider>");
  return ctx;
}

export function ExternalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(externalReducer, INITIAL_EXTERNAL);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [editorOpen, setEditorOpen] = useState(false);

  const open = useCallback(async (rawUrl: string) => {
    const url = normalizeSiteUrl(rawUrl);
    if (!url) {
      setStatus({ kind: "error", message: "Escribe una dirección web válida (p. ej. miweb.com)." });
      return false;
    }
    setStatus({ kind: "loading" });
    try {
      const html = await loadPage(url);
      dispatch({ type: "site/connect", site: url.origin, pageUrl: url.toString(), html });
      setStatus({ kind: "idle" });
      return true;
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "No se pudo abrir la página." });
      return false;
    }
  }, []);

  return <ExternalContext value={{ state, dispatch, status, open, editorOpen, setEditorOpen }}>{children}</ExternalContext>;
}

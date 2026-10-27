"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { guardAction } from "../auth/guard-actions";
import { useAuth } from "../auth/auth-context";
import { INITIAL_SITE } from "./initial-site";
import { useAutosave } from "../persistence/use-autosave";
import { siteReducer } from "./site-reducer";
import { UndoToast } from "./undo-toast";
import { useUndoableDispatch } from "./use-undoable-dispatch";
import type { Page, SiteAction, SiteState } from "./types";

// El estado y el dispatch van en contextos separados: quien solo dispara acciones
// no se vuelve a renderizar cuando cambia el sitio.
const StateContext = createContext<SiteState | null>(null);
const DispatchContext = createContext<Dispatch<SiteAction> | null>(null);

/** Un aviso breve que se quita solo; si llegan muchos seguidos (al arrastrar) se muestra uno solo. */
function useNotice() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const say = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 4000);
  }, []);
  return { message, say };
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(siteReducer, INITIAL_SITE);
  useAutosave<SiteState>("site", state, (saved) => rawDispatch({ type: "project/load", state: saved }));
  // Lo destructivo avisa con «Deshacer».
  const { dispatch: undoable, toast, undo, dismiss } = useUndoableDispatch(state, rawDispatch);

  // Con acceso limitado, cada cambio pasa antes por el alcance de la persona (ver `guardAction`).
  const { currentUser } = useAuth();
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  const { message, say } = useNotice();
  const dispatch = useCallback<Dispatch<SiteAction>>(
    (action) => {
      const result = guardAction(action, currentUser, latest.current.pages);
      if (result.kind === "blocked") return say(result.reason);
      if (result.kind === "narrowed") say(`Se aplicó a tus ${result.count} ${result.count === 1 ? "sección" : "secciones"} con este componente; las demás no cambian.`);
      result.actions.forEach(undoable);
    },
    [currentUser, undoable, say],
  );

  return (
    <StateContext value={state}>
      <DispatchContext value={dispatch}>
        {children}
        {message && (
          <p role="status" className="fixed bottom-20 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-lg bg-panel px-4 py-2 text-xs text-ink shadow-2xl ring-1 ring-line">
            {message}
          </p>
        )}
        <UndoToast toast={toast} onUndo={undo} onDismiss={dismiss} />
      </DispatchContext>
    </StateContext>
  );
}

export function useSite(): SiteState {
  const state = useContext(StateContext);
  if (!state) throw new Error("Debe usarse dentro de <SiteProvider>");
  return state;
}

export function useSiteDispatch(): Dispatch<SiteAction> {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error("Debe usarse dentro de <SiteProvider>");
  return dispatch;
}

/** La página que se está editando ahora mismo. */
export function useCurrentPage(): Page {
  const site = useSite();
  return site.pages.find((page) => page.id === site.currentPageId) ?? site.pages[0];
}

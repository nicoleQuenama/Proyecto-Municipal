"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/auth-context";
import { useAutosave } from "../persistence/use-autosave";
import { defaultBranchOf, mustUseBranch } from "./group-rules";
import { INITIAL_STATE } from "./initial-state";
import { decideReview, fetchReviews, sendReview } from "./reviews-api";
import type { VersioningAction, VersioningState } from "./types";
import { useDesignSnapshot } from "./use-design-snapshot";
import { summarizeChanges } from "./versioning-rules";
import { versioningReducer } from "./versioning-reducer";

interface VersioningContextValue {
  state: VersioningState;
  dispatch: Dispatch<VersioningAction>;
  /** Esta persona no puede publicar en main: trabaja en su rama y envía pull requests a quien la invitó. */
  mustBranch: boolean;
  /** Envía los cambios de una rama como pull request a quien debe recibirla. */
  submitReview: (title: string, from: string, into: string) => Promise<number>;
  /** Fusiona o cierra una pull request que le llegó (solo quien la recibe puede fusionar). */
  decide: (number: number, decision: "merge" | "close") => Promise<void>;
}

const VersioningContext = createContext<VersioningContextValue | null>(null);

export function useVersioning() {
  const ctx = useContext(VersioningContext);
  if (!ctx) throw new Error("Debe usarse dentro de <VersioningProvider>");
  return ctx;
}

/** Cada cuánto se pregunta al servidor si llegaron pull requests nuevas o ya se decidió alguna. */
const SYNC_MS = 15_000;

/** Las acciones que registran quién las hizo. */
const SIGNED: VersioningAction["type"][] = ["commit", "publish", "pr/open", "branch/create"];

export function VersioningProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  // Al iniciar, el diseño que se ve en el lienzo es la versión guardada de partida.
  const initialDesign = useDesignSnapshot();
  const [state, rawDispatch] = useReducer(versioningReducer, initialDesign, (baseline) => ({
    ...INITIAL_STATE,
    baseline,
  }));

  const mustBranch = mustUseBranch(currentUser);
  const main = state.branches.find((branch) => branch.base === null)?.name ?? "main";
  // Quien trabaja solo en sus ramas solo puede estar en las que creó él.
  const owns = useCallback((name: string) => state.branches.find((branch) => branch.name === name)?.author === currentUser?.name, [state.branches, currentUser?.name]);

  // Las pull requests de equipo viven en el servidor, no en este archivo compartido: no se guardan aquí. Y la rama
  // en la que trabaja un miembro es solo suya: a los demás les queda la principal.
  const toSave = useMemo(
    () => ({ ...state, current: mustBranch ? main : state.current, pullRequests: state.pullRequests.filter((pr) => !pr.authorId) }),
    [state, mustBranch, main],
  );
  useAutosave<VersioningState>("versions", toSave, (saved) => rawDispatch({ type: "project/load", state: saved }));

  const dispatch = useCallback<Dispatch<VersioningAction>>(
    (action) => {
      if (mustBranch) {
        // Sin permiso para main: ni guardar versiones ahí, ni volver a esa rama, ni publicar directo.
        if (action.type === "commit" && !owns(state.current)) return;
        if (action.type === "branch/switch" && !owns(action.name)) return;
        if (action.type === "publish" || action.type === "history/reset") return;
        if (action.type === "pr/merge" || action.type === "pr/approve") return;
      }
      rawDispatch(SIGNED.includes(action.type) && currentUser ? ({ ...action, author: currentUser.name } as VersioningAction) : action);
    },
    [mustBranch, state.current, owns, currentUser],
  );

  // El sistema crea (o retoma) la rama de trabajo por defecto y deja a la persona en ella.
  const username = currentUser?.username;
  useEffect(() => {
    if (!mustBranch || !username || owns(state.current)) return;
    const name = defaultBranchOf(username);
    dispatch(state.branches.some((branch) => branch.name === name) ? { type: "branch/switch", name } : { type: "branch/create", name });
  }, [mustBranch, username, state.current, state.branches, owns, dispatch]);

  const sync = useCallback(async () => {
    try {
      rawDispatch({ type: "reviews/sync", pullRequests: await fetchReviews() });
    } catch {
      // Sin conexión o sesión terminada: se queda lo que había.
    }
  }, []);

  const userId = currentUser?.id;
  useEffect(() => {
    if (!userId) return;
    sync();
    const timer = setInterval(sync, SYNC_MS);
    return () => clearInterval(timer);
  }, [userId, sync]);

  const submitReview = useCallback(
    async (title: string, from: string, into: string) => {
      const changes = summarizeChanges(state.commits.filter((commit) => commit.branch === from));
      const { pullRequest } = await sendReview({ title, from, into, changes });
      await sync();
      return pullRequest.number;
    },
    [state.commits, sync],
  );

  const decide = useCallback(
    async (number: number, decision: "merge" | "close") => {
      await decideReview(number, decision);
      if (decision === "merge") rawDispatch({ type: "review/merged", number, at: new Date().toISOString() });
      await sync();
    },
    [sync],
  );

  return <VersioningContext value={{ state, dispatch, mustBranch, submitReview, decide }}>{children}</VersioningContext>;
}

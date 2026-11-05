"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { useAuth } from "../auth/auth-context";
import { useSiteSyncState } from "../persistence/site-sync-context";
import { useBranch } from "./branch-context";
import { mustUseBranch } from "./group-rules";
import { INITIAL_STATE } from "./initial-state";
import { snapshotDesign } from "./design-snapshot";
import type { DesignSnapshot, Label, VersioningAction, VersioningState, WorkingChange } from "./types";
import { useDesignSnapshot } from "./use-design-snapshot";
import { useVersionActions } from "./use-version-actions";
import { ApiError, closeReviewApi, createIssueApi, mergeReviewApi, publishApi, sendReview, toggleAssigneeApi, toggleIssueApi } from "./versions-api";
import { versioningReducer } from "./versioning-reducer";

interface VersioningContextValue {
  state: VersioningState;
  /** El diseño tal como quedó en la última versión guardada de la rama: contra él se calculan los cambios sin guardar. */
  baseline: DesignSnapshot;
  dispatch: Dispatch<VersioningAction>;
  /** Esta persona no puede publicar en main: trabaja en su rama y envía pull requests a quien la invitó. */
  mustBranch: boolean;
  /** Cambiar de rama, crear o eliminar una; devuelven el problema (o nada si salió bien). */
  switchBranch: (name: string) => Promise<string | undefined>;
  createBranch: (name: string) => Promise<string | undefined>;
  deleteBranch: (name: string) => Promise<string | undefined>;
  /** Guarda una versión de la rama actual. */
  saveVersion: (message: string, changes: WorkingChange[]) => Promise<string | undefined>;
  /** Publica la última versión guardada de la rama actual en la página oficial. */
  publish: () => Promise<void>;
  /** Envía los cambios de una rama como pull request a quien debe recibirla. */
  submitReview: (title: string, from: string, into: string) => Promise<number>;
  /** Fusiona o cierra una pull request que le llegó (solo quien la recibe puede fusionar). */
  decide: (number: number, decision: "merge" | "close") => Promise<void>;
  /** Issues: reportar uno, cerrarlo o reabrirlo, y asignarlo (o quitar la asignación). Devuelven el problema, si lo hubo. */
  createIssue: (title: string, label: Label, assignees: string[]) => Promise<string | undefined>;
  toggleIssue: (number: number) => Promise<string | undefined>;
  toggleAssignee: (number: number, member: string) => Promise<string | undefined>;
}

const VersioningContext = createContext<VersioningContextValue | null>(null);

export function useVersioning() {
  const ctx = useContext(VersioningContext);
  if (!ctx) throw new Error("Debe usarse dentro de <VersioningProvider>");
  return ctx;
}

export function VersioningProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const branches = useBranch();
  const sync = useSiteSyncState();
  const design = useDesignSnapshot();
  const [local, rawDispatch] = useReducer(versioningReducer, INITIAL_STATE);

  const current = branches?.branch ?? "main";
  const main = local.branches.find((branch) => branch.base === null)?.name ?? "main";
  const mustBranch = mustUseBranch(currentUser);
  const state = useMemo<VersioningState>(() => ({ ...local, current }), [local, current]);

  // Ramas, versiones y pull requests vienen del servidor.
  const payload = branches?.payload;
  useEffect(() => {
    if (payload) rawDispatch({ type: "server/load", branches: payload.branches, commits: payload.commits, pullRequests: payload.pullRequests, issues: payload.issues, labels: payload.labels, people: payload.people, releases: payload.releases });
  }, [payload]);

  const baseline = useMemo(() => (sync.head ? snapshotDesign(sync.head) : design), [sync.head, design]);

  const publish = useCallback(async () => {
    await publishApi(current);
    await branches?.reload();
  }, [current, branches]);

  const actions = useVersionActions({ branch: current, main, setBranch: branches?.setBranch ?? (() => undefined), reload: branches?.reload ?? (async () => undefined), sync });
  const reload = branches?.reload;

  const submitReview = useCallback(
    async (title: string, from: string, into: string) => {
      const { pullRequest } = await sendReview({ title, from, into });
      await reload?.();
      return pullRequest.number;
    },
    [reload],
  );

  const decide = useCallback(
    async (number: number, decision: "merge" | "close") => {
      if (decision === "close") await closeReviewApi(number);
      else {
        const resolutions = (local.pullRequests.find((pr) => pr.number === number)?.conflicts ?? []).flatMap(({ node, property, resolution }) => (resolution ? [{ node, property, resolution }] : []));
        try {
          await mergeReviewApi(number, resolutions);
        } catch (error) {
          // El servidor no escribe nada a medias: devuelve los conflictos para que se elija qué valor conservar.
          if (error instanceof ApiError && error.data.conflicts) rawDispatch({ type: "review/conflicts", number, conflicts: error.data.conflicts });
          throw error;
        }
        // Fusionar escribe en main: si se está viendo main, se vuelve a abrir con lo fusionado.
        if (current === main) await sync.refresh();
      }
      await reload?.();
    },
    [local.pullRequests, current, main, sync, reload],
  );

  const issue = useCallback(
    async (work: () => Promise<unknown>) => {
      try {
        await work();
        await reload?.();
      } catch (error) {
        return error instanceof Error ? error.message : "No se pudo completar la operación.";
      }
    },
    [reload],
  );
  const createIssue = useCallback((title: string, label: Label, assignees: string[]) => issue(() => createIssueApi({ title, label: label.name, tone: label.tone, assignees })), [issue]);
  const toggleIssue = useCallback((number: number) => issue(() => toggleIssueApi(number)), [issue]);
  const toggleAssignee = useCallback((number: number, member: string) => issue(() => toggleAssigneeApi(number, member)), [issue]);

  return <VersioningContext value={{ state, baseline, dispatch: rawDispatch, mustBranch, publish, submitReview, decide, createIssue, toggleIssue, toggleAssignee, ...actions }}>{children}</VersioningContext>;
}

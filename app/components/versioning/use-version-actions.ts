"use client";

import { useCallback } from "react";
import type { SiteSync } from "../persistence/use-site-sync";
import { createBranchApi, deleteBranchApi, saveVersionApi } from "./versions-api";
import type { WorkingChange } from "./types";

interface Inputs {
  /** La rama que se está editando y la principal (a la que se vuelve si se elimina la actual). */
  branch: string;
  main: string;
  setBranch: (name: string) => void;
  reload: () => Promise<void>;
  sync: SiteSync;
}

/** El mensaje del problema, o `undefined` si salió bien (así lo esperan los formularios). */
async function attempt(work: () => Promise<void>): Promise<string | undefined> {
  try {
    await work();
  } catch (error) {
    return error instanceof Error ? error.message : "No se pudo completar la operación.";
  }
}

/**
 * Las operaciones con ramas y versiones: hablan con el servidor y, antes de cambiar de rama o guardar una versión, esperan
 * a que lo que se editó ya esté guardado (el servidor guarda lo que tiene, no lo que hay en pantalla).
 */
export function useVersionActions({ branch, main, setBranch, reload, sync }: Inputs) {
  const switchBranch = useCallback((name: string) => attempt(async () => {
    await sync.flush();
    setBranch(name);
  }), [sync, setBranch]);

  const createBranch = useCallback((name: string) => attempt(async () => {
    await sync.flush();
    await createBranchApi(name, branch);
    await reload();
    setBranch(name);
  }), [sync, branch, reload, setBranch]);

  const deleteBranch = useCallback((name: string) => attempt(async () => {
    await deleteBranchApi(name);
    if (name === branch) setBranch(main);
    await reload();
  }), [branch, main, setBranch, reload]);

  /** Guarda una versión con todo lo que cambió: la foto es el estado de la rama, no una selección de cambios. */
  const saveVersion = useCallback((message: string, changes: WorkingChange[]) => attempt(async () => {
    await sync.flush();
    await saveVersionApi({ branch, message, changes: changes.map(({ node, property, before, after }) => ({ node, property, before, after })) });
    sync.markCommitted();
    await reload();
  }), [sync, branch, reload]);

  return { switchBranch, createBranch, deleteBranch, saveVersion };
}

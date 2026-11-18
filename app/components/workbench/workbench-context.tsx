"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { useSite } from "../site/site-context";
import { useToast } from "../ui/toast";
import { fileId, sameFile, type FileRef } from "./file-ref";
import { selectionFile } from "./selection-file";

interface WorkbenchState {
  /** Está abierto el editor. */
  open: boolean;
  tabs: FileRef[];
  activeId: string | null;
}

interface WorkbenchContextValue extends WorkbenchState {
  /** Abre el editor con un archivo (o con el de lo seleccionado, si no se indica). */
  openFile: (ref?: FileRef) => void;
  closeTab: (ref: FileRef) => void;
  activate: (ref: FileRef) => void;
  close: () => void;
}

const CLOSED: WorkbenchState = { open: false, tabs: [], activeId: null };

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export function useWorkbench() {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) throw new Error("Debe usarse dentro de <WorkbenchProvider>");
  return ctx;
}

/** Guarda si el editor de código está abierto, y con qué pestañas. */
export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const site = useSite();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [state, setState] = useState<WorkbenchState>(CLOSED);

  const openFile = useCallback(
    (ref?: FileRef) => {
      // Sin permiso de código no se abre el editor, aunque un botón antiguo siga en pantalla: se avisa para que no parezca un fallo.
      if (!hasPermission(currentUser, "editCode")) {
        toast.error("No puedes abrir el editor de código: tu cuenta no tiene ese permiso.");
        return;
      }
      const target = ref ?? selectionFile(site);
      setState((current) => ({
        open: true,
        tabs: current.tabs.some((tab) => sameFile(tab, target)) ? current.tabs : [...current.tabs, target],
        activeId: fileId(target),
      }));
    },
    // `currentUser` entero: si cambian los vetos (o el acceso se renueva) el botón debe abrir de verdad.
    [site, currentUser, toast],
  );

  const activate = useCallback((ref: FileRef) => setState((current) => ({ ...current, activeId: fileId(ref) })), []);

  const closeTab = useCallback((ref: FileRef) => {
    setState((current) => {
      const index = current.tabs.findIndex((tab) => sameFile(tab, ref));
      const tabs = current.tabs.filter((tab) => !sameFile(tab, ref));
      const closedActive = current.activeId === fileId(ref);
      const next = tabs[Math.min(index, tabs.length - 1)];
      return { ...current, tabs, activeId: closedActive ? (next ? fileId(next) : null) : current.activeId };
    });
  }, []);

  const close = useCallback(() => setState((current) => ({ ...current, open: false })), []);

  const value = useMemo(
    () => ({ ...state, openFile, closeTab, activate, close }),
    [state, openFile, closeTab, activate, close],
  );
  return <WorkbenchContext value={value}>{children}</WorkbenchContext>;
}

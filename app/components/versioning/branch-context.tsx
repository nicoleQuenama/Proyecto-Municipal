"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { VersionsPayload } from "../../server/versions/versions-state";
import { fetchVersions } from "./versions-api";

interface BranchValue {
  /** La rama que se está editando; `null` mientras el servidor no dice cuál es la de esta persona. */
  branch: string | null;
  setBranch: (name: string) => void;
  /** Ramas, versiones y pull requests tal como las tiene el servidor (`null` hasta que llegan). */
  payload: VersionsPayload | null;
  /** Vuelve a pedirlas (después de guardar una versión, crear una rama, fusionar…). */
  reload: () => Promise<void>;
}

const BranchContext = createContext<BranchValue | null>(null);

/** Con `?fresh` en la dirección el editor arranca de cero y no habla con el servidor (para pruebas). */
const isFresh = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("fresh");

/** Cada cuánto se pregunta si llegaron pull requests nuevas o ya se decidió alguna. */
const REFRESH_MS = 15_000;

/** Dice qué rama se edita. Va por encima del sitio: el sitio que se carga y se guarda es el de esa rama. */
export function BranchProvider({ children }: { children: ReactNode }) {
  const [fresh] = useState(isFresh);
  const [branch, setBranch] = useState<string | null>(fresh ? "main" : null);
  const [payload, setPayload] = useState<VersionsPayload | null>(null);

  const reload = useCallback(async () => {
    if (fresh) return;
    try {
      const next = await fetchVersions();
      setPayload(next);
      // Primera carga: la rama de esta persona. Si la rama en la que estaba ya no existe (la eliminaron), vuelve a la suya.
      setBranch((current) => (current && next.branches.some((item) => item.name === current) ? current : next.mine));
    } catch {
      // Sin conexión o sesión terminada: se queda lo que había.
    }
  }, [fresh]);

  useEffect(() => {
    const first = setTimeout(reload, 0);
    const timer = setInterval(reload, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [reload]);

  const value = useMemo(() => ({ branch, setBranch, payload, reload }), [branch, payload, reload]);
  return <BranchContext value={value}>{children}</BranchContext>;
}

/** `null` fuera de un `BranchProvider` (el visor del sitio publicado no tiene ramas). */
export const useBranch = () => useContext(BranchContext);

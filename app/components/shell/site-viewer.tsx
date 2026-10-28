"use client";

import { useEffect, useState } from "react";
import { AuthProvider } from "../auth/auth-context";
import type { SiteState } from "../site/types";
import { CanvasPages } from "../viewport/artboard";
import { CmsProviders } from "./cms-providers";

type Loaded = { kind: "loading" } | { kind: "empty" } | { kind: "ready"; site: SiteState };

/** El sitio publicado, tal como lo ve el público: sin editor, sin sesión y sin poder editar nada. */
export function SiteViewer() {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site")
      .then((response) => (response.ok ? (response.json() as Promise<SiteState>) : null))
      .then((site) => !cancelled && setLoaded(site ? { kind: "ready", site } : { kind: "empty" }))
      .catch(() => !cancelled && setLoaded({ kind: "empty" }));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loaded.kind === "loading") return <div className="h-screen bg-neutral-100" aria-label="Cargando" />;
  if (loaded.kind === "empty") {
    return <main className="flex h-screen items-center justify-center text-sm text-neutral-500">Este sitio aún no se publicó.</main>;
  }
  return (
    <AuthProvider>
      <CmsProviders viewer={loaded.site}>
        <CanvasPages />
      </CmsProviders>
    </AuthProvider>
  );
}

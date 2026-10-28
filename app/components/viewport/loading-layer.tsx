"use client";

import { useEffect, useState } from "react";
import { useNavigation } from "../navigation/navigation-context";
import { loadingSeconds, pageWithRole } from "../site/page-roles";
import { useSite } from "../site/site-context";
import { PageArtboard } from "./artboard";
import { isPageReady, shouldFinishLoading } from "./page-readiness";

const POLL_MS = 150;

/**
 * La página con la función «Carga», sobre todo lo demás: al entrar al sitio y cada vez que se cambia de página,
 * lo que duran sus animaciones y, además, hasta que la página termina de cargar de verdad (imágenes, tipografías y
 * datos), con un máximo de seguridad. Si el sitio no tiene una, no hace nada.
 */
export function LoadingLayer() {
  const { pages, currentPageId } = useSite();
  const { transitionKey } = useNavigation();
  const loading = pageWithRole(pages, "loading");
  const [finished, setFinished] = useState<string | null>(null);
  const seconds = loading ? loadingSeconds(loading) : 0;
  // Cada visita (entrar, o cambiar de página) tiene su propia clave.
  const visit = `${currentPageId}:${transitionKey}`;

  // La pantalla se queda mientras la página carga de verdad (imágenes, tipografías, datos), con un mínimo y un máximo.
  useEffect(() => {
    if (!loading) return;
    const start = performance.now();
    const timer = window.setInterval(() => {
      if (shouldFinishLoading(performance.now() - start, seconds, isPageReady())) setFinished(visit);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [visit, loading, seconds]);

  // Si la que se está probando es la propia página de carga, se ve normal (sin taparse a sí misma).
  if (!loading || finished === visit || currentPageId === loading.id) return null;

  return (
    <div key={visit} className="fixed inset-0 z-[60] overflow-hidden bg-neutral-300">
      <PageArtboard page={loading} active tiled={false} production />
    </div>
  );
}

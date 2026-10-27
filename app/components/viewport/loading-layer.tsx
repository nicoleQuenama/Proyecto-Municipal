"use client";

import { useEffect, useState } from "react";
import { useNavigation } from "../navigation/navigation-context";
import { loadingSeconds, pageWithRole } from "../site/page-roles";
import { useSite } from "../site/site-context";
import { PageArtboard } from "./artboard";

/**
 * La página con la función «Carga», sobre todo lo demás: al entrar al sitio y cada vez que se cambia de página,
 * el tiempo que duran sus propias animaciones. Si el sitio no tiene una, no hace nada.
 */
export function LoadingLayer() {
  const { pages, currentPageId } = useSite();
  const { transitionKey } = useNavigation();
  const loading = pageWithRole(pages, "loading");
  const [finished, setFinished] = useState<string | null>(null);
  const seconds = loading ? loadingSeconds(loading) : 0;
  // Cada visita (entrar, o cambiar de página) tiene su propia clave.
  const visit = `${currentPageId}:${transitionKey}`;

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setFinished(visit), seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [visit, loading, seconds]);

  // Si la que se está probando es la propia página de carga, se ve normal (sin taparse a sí misma).
  if (!loading || finished === visit || currentPageId === loading.id) return null;

  return (
    <div key={visit} className="fixed inset-0 z-[60] overflow-auto bg-neutral-300">
      <PageArtboard page={loading} active tiled={false} production />
    </div>
  );
}

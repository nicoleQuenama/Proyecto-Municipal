"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { pendingCount, subscribe } from "../data-sources/source-store";
import { useSite } from "../site/site-context";
import { pageWithRole } from "../site/page-roles";
import { PageArtboard } from "./artboard";

/** Solo se muestra si la espera dura más que esto: una respuesta rápida no hace parpadear el esqueleto. */
const SHOW_AFTER_MS = 250;

const SHIMMER = `
@keyframes cms-skeleton { 50% { opacity: .45; } }
[data-skeleton] [data-el] { animation: cms-skeleton 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { [data-skeleton] [data-el] { animation: none; } }`;

/**
 * La página con la función «Esqueleto»: aparece, con un brillo suave, sobre la página que se está viendo mientras sus
 * datos (APIs) siguen llegando, y se va sola cuando llegan. Si el sitio no tiene una, no hace nada.
 */
export function SkeletonLayer() {
  const { pages, currentPageId } = useSite();
  const skeleton = pageWithRole(pages, "skeleton");
  const waiting = useSyncExternalStore(subscribe, () => pendingCount() > 0, () => false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => setShown(true), SHOW_AFTER_MS);
    return () => {
      window.clearTimeout(timer);
      setShown(false);
    };
  }, [waiting]);

  const viewing = pages.find((page) => page.id === currentPageId);
  if (!skeleton || !shown || !waiting || viewing?.role) return null;

  return (
    <div data-skeleton className="fixed inset-0 z-[50] overflow-hidden bg-neutral-300">
      <style>{SHIMMER}</style>
      <PageArtboard page={skeleton} active tiled={false} production />
    </div>
  );
}

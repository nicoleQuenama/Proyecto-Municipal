"use client";

import { useEffect } from "react";
import { useSite } from "../site/site-context";

const SCRIPT_ID = "tailwind-runtime";

/**
 * Tailwind CSS del navegador: genera al vuelo el CSS de las clases que el usuario escribe en secciones y
 * elementos (las del propio editor ya vienen compiladas). Solo se carga cuando alguna clase propia existe.
 */
export function TailwindRuntime() {
  const { pages, components } = useSite();
  const hasClasses = (styles: Record<string, { classes: string }> | undefined) =>
    Object.values(styles ?? {}).some((style) => style.classes.trim() !== "");
  const needed = pages.some((page) => page.blocks.some((block) => hasClasses(block.custom))) || components.some((def) => hasClasses(def.styles));

  useEffect(() => {
    if (!needed || document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "/api/vendor/tailwind";
    document.head.appendChild(script);
  }, [needed]);

  return null;
}

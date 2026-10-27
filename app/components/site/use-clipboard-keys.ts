"use client";

import { useEffect } from "react";
import { useCommands } from "../commands/commands-context";
import { useNavigation } from "../navigation/navigation-context";
import { readClip } from "./clipboard";
import { selectionOf } from "./multi-select";
import { copySelection, pasteAction } from "./paste-actions";
import { useSite, useSiteDispatch } from "./site-context";

/** Dónde las teclas no copian ni pegan: está escribiendo o hay un cuadro abierto (ahí valen las del navegador). */
const TYPING = "input, textarea, select, [contenteditable], [role=dialog]";

/** Ctrl/⌘+C copia lo seleccionado, Ctrl/⌘+V lo pega en la página actual y Ctrl/⌘+D lo duplica. */
export function useClipboardKeys() {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const { mode } = useNavigation();
  const { builder } = useCommands();
  const { currentPageId } = site;
  const selected = selectionOf(site).join(",");

  useEffect(() => {
    if (mode !== "edit" || builder) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || (e.target as Element).closest?.(TYPING)) return;
      // Con texto seleccionado en la página, copiar es del navegador.
      if (window.getSelection()?.toString()) return;

      const key = e.key.toLowerCase();
      if (key === "c" || key === "d") {
        const clips = copySelection(site, currentPageId, selected ? selected.split(",") : []);
        if (clips.length === 0) return;
        e.preventDefault();
        if (key === "d") dispatch(pasteAction(currentPageId, clips));
      } else if (key === "v" && readClip().length > 0) {
        e.preventDefault();
        dispatch(pasteAction(currentPageId, readClip()));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, builder, site, selected, currentPageId, dispatch]);
}

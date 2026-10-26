"use client";

import { useEffect } from "react";
import { useCanvasSettings } from "../canvas-editing/settings-context";
import { useCommands } from "../commands/commands-context";
import { useNavigation } from "../navigation/navigation-context";
import { deletionPlan } from "./deletion-plan";
import { useCurrentPage, useSite, useSiteDispatch } from "./site-context";

/** Dónde Supr no elimina: está escribiendo o hay un cuadro abierto. */
const TYPING = "input, textarea, select, [contenteditable], [role=dialog]";
const DELETE_KEYS = ["Delete", "Backspace"];

/** Supr o Retroceso eliminan lo seleccionado en el lienzo (un elemento, varios o la sección). */
export function useDeleteKey() {
  const { selectedId, selectedElementId, alsoSelectedIds } = useSite();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const { mode } = useNavigation();
  const { builder } = useCommands();
  const { settings } = useCanvasSettings();

  useEffect(() => {
    if (mode !== "edit" || builder) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!DELETE_KEYS.includes(e.key) || (e.target as Element).closest?.(TYPING)) return;
      const action = deletionPlan(page, { selectedId, selectedElementId, alsoSelectedIds }, settings.scope);
      if (!action) return;
      e.preventDefault();
      dispatch(action);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, builder, page, selectedId, selectedElementId, alsoSelectedIds, settings.scope, dispatch]);
}

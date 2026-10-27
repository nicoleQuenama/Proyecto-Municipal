"use client";

import { useEffect } from "react";
import { useCommands } from "../commands/commands-context";
import { useNavigation } from "../navigation/navigation-context";
import { useHistoryControls } from "./history-context";

/** Dónde Ctrl+Z es del navegador: está escribiendo o hay un cuadro abierto. */
const TYPING = "input, textarea, select, [contenteditable], [role=dialog]";

/** Ctrl/⌘+Z deshace; Ctrl/⌘+Mayús+Z o Ctrl/⌘+Y rehacen. */
export function useHistoryKeys() {
  const { undo, redo } = useHistoryControls();
  const { mode } = useNavigation();
  const { builder } = useCommands();

  useEffect(() => {
    if (mode !== "edit" || builder) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || (e.target as Element).closest?.(TYPING)) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        (e.shiftKey ? redo : undo)();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, builder, undo, redo]);
}

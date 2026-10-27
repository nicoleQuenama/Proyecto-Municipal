"use client";

import { useEffect } from "react";
import { useCommands } from "../commands/commands-context";
import { useNavigation } from "../navigation/navigation-context";
import type { OrderMove } from "./order-rules";
import { selectionOf } from "./multi-select";
import { useSite, useSiteDispatch } from "./site-context";

const TYPING = "input, textarea, select, [contenteditable], [role=dialog]";

/** Ctrl/⌘+] sube una capa y Ctrl/⌘+[ la baja; con Mayús, al frente o al fondo (como en Figma). */
export function useOrderKeys() {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const { mode } = useNavigation();
  const { builder } = useCommands();
  const { currentPageId } = site;
  const selected = selectionOf(site).join(",");

  useEffect(() => {
    if (mode !== "edit" || builder || !selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || (e.target as Element).closest?.(TYPING)) return;
      const up = e.key === "]" || e.key === "}";
      const down = e.key === "[" || e.key === "{";
      if (!up && !down) return;
      const to: OrderMove = up ? (e.shiftKey ? "front" : "forward") : e.shiftKey ? "back" : "backward";
      e.preventDefault();
      dispatch({ type: "block/order", pageId: currentPageId, blockIds: selected.split(","), to });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, builder, selected, currentPageId, dispatch]);
}

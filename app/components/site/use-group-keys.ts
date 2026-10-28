"use client";

import { useEffect } from "react";
import { useCommands } from "../commands/commands-context";
import { useNavigation } from "../navigation/navigation-context";
import { useSite, useSiteDispatch } from "./site-context";

const TYPING = "input, textarea, select, [contenteditable], [role=dialog]";

/** Ctrl/⌘+G agrupa los elementos marcados en una tarjeta; con Mayús, deshace la tarjeta seleccionada. */
export function useGroupKeys() {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const { mode } = useNavigation();
  const { builder } = useCommands();
  const { selectedId, selectedElementId, alsoSelectedIds, currentPageId, pages } = site;
  const componentId = pages.find((p) => p.id === currentPageId)?.blocks.find((b) => b.id === selectedId)?.componentId;
  const picked = [selectedElementId, ...(alsoSelectedIds ?? [])].filter((id): id is string => !!id).join(",");

  useEffect(() => {
    if (mode !== "edit" || builder || !componentId || !picked) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== "g" || (e.target as Element).closest?.(TYPING)) return;
      e.preventDefault();
      const ids = picked.split(",");
      dispatch(e.shiftKey ? { type: "elements/ungroup", componentId, elementId: ids[0] } : { type: "elements/group", componentId, elementIds: ids });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, builder, componentId, picked, dispatch]);
}

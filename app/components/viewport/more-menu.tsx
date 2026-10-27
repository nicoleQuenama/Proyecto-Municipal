"use client";

import type { ReactNode } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { toolCommandId } from "../commands/command-definitions";
import { useCommands } from "../commands/commands-context";
import { formatShortcut } from "../commands/shortcut";
import { CodeIcon, CommentIcon, FrameIcon, MoreIcon, TextIcon } from "./icons";
import { MenuButton, type MenuItem } from "./menu-button";
import { active, iconButton, idle } from "./toolbar-parts";
import { useViewport, type Tool } from "./viewport-context";

/** Las herramientas menos usadas: se eligen una herramienta del lienzo o se abre el editor de código. */
type MoreValue = Extract<Tool, "frame" | "text" | "comment"> | "code";

const MORE_ITEMS: (MenuItem<MoreValue> & { icon: ReactNode })[] = [
  { value: "frame", label: "Marco", icon: <FrameIcon /> },
  { value: "text", label: "Texto", icon: <TextIcon /> },
  { value: "comment", label: "Comentar", icon: <CommentIcon /> },
  { value: "code", label: "Editor de código", icon: <CodeIcon />, dividerBefore: true },
];

const MORE_TOOLS: Tool[] = ["frame", "text", "comment"];

/** El menú «Más»: agrupa lo poco usado para que la barra no se llene de botones. */
export function MoreMenu() {
  const { tool, setTool } = useViewport();
  const { runCommand, shortcutOf } = useCommands();
  const { currentUser } = useAuth();
  const canEditCode = hasPermission(currentUser, "editCode");

  const hintOf = (value: MoreValue) => {
    const shortcut = shortcutOf(value === "code" ? "code.open" : toolCommandId(value));
    return shortcut ? formatShortcut(shortcut) : undefined;
  };
  const items = MORE_ITEMS.filter((item) => item.value !== "code" || canEditCode).map((item) => ({
    ...item,
    hint: hintOf(item.value),
  }));

  // Cada opción hace lo suyo: elegir una herramienta o abrir el editor.
  const run: Record<MoreValue, () => void> = {
    frame: () => setTool("frame"),
    text: () => setTool("text"),
    comment: () => setTool("comment"),
    code: () => runCommand("code.open"),
  };

  return (
    <MenuButton
      label="Más herramientas"
      items={items}
      selected={MORE_TOOLS.includes(tool) ? (tool as MoreValue) : undefined}
      onSelect={(value) => run[value]()}
      className={`${iconButton} ${MORE_TOOLS.includes(tool) ? active : idle}`}
    >
      <MoreIcon />
    </MenuButton>
  );
}

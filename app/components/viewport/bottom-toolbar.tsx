"use client";

import type { ReactNode } from "react";
import { CanvasSettingsMenu } from "../canvas-editing/canvas-settings-menu";
import { toolCommandId } from "../commands/command-definitions";
import { useCommands } from "../commands/commands-context";
import { AdaptAssistant } from "./adapt-assistant";
import { CursorIcon, HandIcon, SearchIcon } from "./icons";
import { InsertMenus } from "./insert-menus";
import { MoreMenu } from "./more-menu";
import { active, Divider, iconButton, idle } from "./toolbar-parts";
import { useViewport, type Tool } from "./viewport-context";
import { ZoomControls } from "./zoom-controls";

/** Las herramientas de uso constante: mover elementos y desplazar el lienzo. */
const BASIC_TOOLS: { value: Tool; label: string; icon: ReactNode }[] = [
  { value: "select", label: "Mover", icon: <CursorIcon /> },
  { value: "hand", label: "Mano", icon: <HandIcon /> },
];

/**
 * La barra flotante del lienzo. Solo lleva lo esencial; lo demás está agrupado en menús («Más», «Ajustes del
 * lienzo»), así que cabe en una sola fila aunque estén abiertos los paneles laterales.
 */
export function BottomToolbar() {
  const { tool, setTool } = useViewport();
  const { openDialog, withShortcut } = useCommands();

  return (
    <>
    <AdaptAssistant />
    <div
      role="toolbar"
      aria-label="Herramientas del lienzo"
      className="absolute bottom-4 left-1/2 z-30 flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-1 rounded-xl border border-line bg-panel p-1.5 text-ink shadow-2xl"
    >
      <button
        type="button"
        aria-label="Buscar comandos"
        title={withShortcut("Buscar comandos", "app.palette")}
        onClick={() => openDialog("palette")}
        className={`${iconButton} bg-canvas ${idle}`}
      >
        <SearchIcon />
      </button>

      <Divider />

      {BASIC_TOOLS.map((basic) => (
        <button
          key={basic.value}
          type="button"
          aria-label={basic.label}
          title={withShortcut(basic.label, toolCommandId(basic.value))}
          aria-pressed={tool === basic.value}
          onClick={() => setTool(basic.value)}
          className={`${iconButton} ${tool === basic.value ? active : idle}`}
        >
          {basic.icon}
        </button>
      ))}

      <Divider />

      <InsertMenus />
      <MoreMenu />

      <Divider />

      <CanvasSettingsMenu />

      <Divider />

      <ZoomControls />
    </div>
    </>
  );
}

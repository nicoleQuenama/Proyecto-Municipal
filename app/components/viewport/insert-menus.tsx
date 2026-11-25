"use client";

import type { ReactNode } from "react";
import { formatShortcut } from "../commands/shortcut";
import { toolCommandId } from "../commands/command-definitions";
import { useCommands } from "../commands/commands-context";
import {
  ChevronIcon,
  EllipseIcon,
  LineIcon,
  RectangleIcon,
  ShapesIcon,
  TriangleIcon,
} from "./icons";
import { MenuButton, type MenuItem } from "./menu-button";
import { pill } from "./toolbar-parts";
import { useViewport, type Tool } from "./viewport-context";

const SHAPES: { value: Tool; label: string; icon: ReactNode }[] = [
  { value: "rectangle", label: "Rectángulo", icon: <RectangleIcon /> },
  { value: "ellipse", label: "Elipse", icon: <EllipseIcon /> },
  { value: "line", label: "Línea", icon: <LineIcon /> },
  { value: "triangle", label: "Triángulo", icon: <TriangleIcon /> },
];

const SHAPE_TOOLS = SHAPES.map((shape) => shape.value);

/** Lo que se agrega al lienzo: figuras vectoriales. */
export function InsertMenus() {
  const { tool, setTool } = useViewport();
  const { shortcutOf } = useCommands();

  const hintOf = (commandId: string) => {
    const shortcut = shortcutOf(commandId);
    return shortcut ? formatShortcut(shortcut) : undefined;
  };
  const shapeItems: MenuItem<Tool>[] = SHAPES.map((shape) => ({ ...shape, hint: hintOf(toolCommandId(shape.value)) }));
  const shapeActive = SHAPE_TOOLS.includes(tool);

  return (
    <MenuButton
      label="Figuras"
      items={shapeItems}
      selected={shapeActive ? tool : undefined}
      onSelect={setTool}
      className={`${pill} ${shapeActive ? "bg-accent text-white" : "bg-accent/90 text-white hover:bg-accent"}`}
    >
      <ShapesIcon />
      <ChevronIcon />
    </MenuButton>
  );
}

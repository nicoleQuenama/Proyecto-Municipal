"use client";

import type { ReactNode } from "react";
import { formatShortcut } from "../commands/shortcut";
import { toolCommandId } from "../commands/command-definitions";
import { useCommands } from "../commands/commands-context";
import {
  ChevronIcon,
  EllipseIcon,
  ImageIcon,
  LineIcon,
  LinkIcon,
  RectangleIcon,
  ShapesIcon,
  TriangleIcon,
  UploadIcon,
  VideoIcon,
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

/** El valor de cada opción es el id del comando que ejecuta. */
const MEDIA_ITEMS: MenuItem<string>[] = [
  { value: "media.upload", label: "Subir desde el equipo", icon: <UploadIcon /> },
  { value: "media.image-url", label: "Imagen desde URL", icon: <LinkIcon /> },
  { value: "media.video-url", label: "Video desde URL", icon: <VideoIcon />, dividerBefore: true },
];

/** Lo que se agrega al lienzo: figuras e imágenes o videos. Solo icono, para ocupar poco. */
export function InsertMenus() {
  const { tool, setTool } = useViewport();
  const { runCommand, shortcutOf } = useCommands();

  const hintOf = (commandId: string) => {
    const shortcut = shortcutOf(commandId);
    return shortcut ? formatShortcut(shortcut) : undefined;
  };
  const shapeItems: MenuItem<Tool>[] = SHAPES.map((shape) => ({ ...shape, hint: hintOf(toolCommandId(shape.value)) }));
  const mediaItems = MEDIA_ITEMS.map((item) => ({ ...item, hint: hintOf(item.value) }));
  const shapeActive = SHAPE_TOOLS.includes(tool);

  return (
    <>
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

      <MenuButton
        label="Imágenes y videos"
        items={mediaItems}
        onSelect={runCommand}
        footer="También puedes arrastrar imágenes o enlaces al lienzo. Los videos, solo por URL."
        className={`${pill} bg-accent/20 text-accent hover:bg-accent/30`}
      >
        <ImageIcon />
        <ChevronIcon />
      </MenuButton>
    </>
  );
}

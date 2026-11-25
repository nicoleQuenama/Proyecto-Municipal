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

import { useSite, useSiteDispatch } from "../site/site-context";
import { BANNER_COMPONENT_ID, IMAGE_BLOCK_COMPONENT_ID } from "../site/component-templates";

const SHAPES: { value: Tool; label: string; icon: ReactNode }[] = [
  { value: "rectangle", label: "Rectángulo", icon: <RectangleIcon /> },
  { value: "ellipse", label: "Elipse", icon: <EllipseIcon /> },
  { value: "line", label: "Línea", icon: <LineIcon /> },
  { value: "triangle", label: "Triángulo", icon: <TriangleIcon /> },
];

const SHAPE_TOOLS = SHAPES.map((shape) => shape.value);

/** El valor de cada opción es el id del comando o componente que ejecuta. */
const MEDIA_ITEMS: MenuItem<string>[] = [
  { value: "component.image-block", label: "Insertar Bloque de Imagen", icon: <ImageIcon /> },
  { value: "component.banner-block", label: "Insertar Banner (ancho completo)", icon: <ImageIcon /> },
  { value: "media.upload", label: "Subir desde el equipo", icon: <UploadIcon />, dividerBefore: true },
  { value: "media.image-url", label: "Imagen desde URL", icon: <LinkIcon /> },
  { value: "media.video-url", label: "Video desde URL", icon: <VideoIcon />, dividerBefore: true },
];

/** Lo que se agrega al lienzo: figuras e imágenes o videos. Solo icono, para ocupar poco. */
export function InsertMenus() {
  const { tool, setTool } = useViewport();
  const { runCommand, shortcutOf } = useCommands();
  const { currentPageId } = useSite();
  const dispatch = useSiteDispatch();

  const handleSelectMedia = (value: string) => {
    if (value === "component.image-block") {
      const blockId = crypto.randomUUID();
      dispatch({ type: "block/add", id: blockId, componentId: IMAGE_BLOCK_COMPONENT_ID, pageId: currentPageId });
      return;
    }
    if (value === "component.banner-block") {
      const blockId = crypto.randomUUID();
      dispatch({ type: "block/add", id: blockId, componentId: BANNER_COMPONENT_ID, pageId: currentPageId });
      dispatch({ type: "block/box", pageId: currentPageId, blockId, patch: { span: "width" } });
      return;
    }
    runCommand(value);
  };

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
        onSelect={handleSelectMedia}
        footer="También puedes arrastrar imágenes o enlaces al lienzo. Los videos, solo por URL."
        className={`${pill} bg-accent/20 text-accent hover:bg-accent/30`}
      >
        <ImageIcon />
        <ChevronIcon />
      </MenuButton>
    </>
  );
}

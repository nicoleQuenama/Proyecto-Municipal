"use client";

import type { ReactNode } from "react";
import { Kbd } from "../commands/kbd";
import { formatShortcut } from "../commands/shortcut";
import { toolCommandId } from "../commands/command-definitions";
import { useCommands } from "../commands/commands-context";
import {
  ChevronIcon,
  CodeIcon,
  CommentIcon,
  CursorIcon,
  EllipseIcon,
  FrameIcon,
  HandIcon,
  ImageIcon,
  LineIcon,
  MinusIcon,
  PlusIcon,
  RectangleIcon,
  SearchIcon,
  ShapesIcon,
  TextIcon,
  TriangleIcon,
  LinkIcon,
  UploadIcon,
  VideoIcon,
} from "./icons";
import { MenuButton, type MenuItem } from "./menu-button";
import { ZOOM_STEPS, useViewport, type Tool } from "./viewport-context";

const BASIC_TOOLS: { value: Tool; label: string; icon: ReactNode }[] = [
  { value: "select", label: "Mover", icon: <CursorIcon /> },
  { value: "hand", label: "Mano", icon: <HandIcon /> },
  { value: "frame", label: "Marco", icon: <FrameIcon /> },
  { value: "text", label: "Texto", icon: <TextIcon /> },
];

const SHAPES: { value: Tool; label: string; icon: ReactNode }[] = [
  { value: "rectangle", label: "Rectángulo", icon: <RectangleIcon /> },
  { value: "ellipse", label: "Elipse", icon: <EllipseIcon /> },
  { value: "line", label: "Línea", icon: <LineIcon /> },
  { value: "triangle", label: "Triángulo", icon: <TriangleIcon /> },
];

/** El valor de cada opción es el id del comando que ejecuta. */
const MEDIA_ITEMS: MenuItem<string>[] = [
  { value: "media.upload", label: "Subir desde el equipo", icon: <UploadIcon /> },
  { value: "media.image-url", label: "Imagen desde URL", icon: <LinkIcon /> },
  { value: "media.video-url", label: "Video desde URL", icon: <VideoIcon />, dividerBefore: true },
];

const FIT = "fit";

const ZOOM_ITEMS: MenuItem<string>[] = [
  { value: FIT, label: "Ajustar a la ventana" },
  ...ZOOM_STEPS.map((z, index) => ({ value: String(z), label: `${z}%`, dividerBefore: index === 0 })),
];

const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors";
const idle = "text-ink-dim hover:bg-hover hover:text-ink";
const on = "bg-accent/25 text-accent";
const pill =
  "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors";

const SHAPE_TOOLS = SHAPES.map((s) => s.value);

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-line" />;
}

export function BottomToolbar() {
  const { tool, setTool, zoom, setZoom, stepZoom, fitted, fitToWindow } = useViewport();
  const { openDialog, runCommand, shortcutOf, withShortcut } = useCommands();

  const hintOf = (commandId: string) => {
    const shortcut = shortcutOf(commandId);
    return shortcut ? formatShortcut(shortcut) : undefined;
  };
  const shapeItems: MenuItem<Tool>[] = SHAPES.map((shape) => ({
    ...shape,
    hint: hintOf(toolCommandId(shape.value)),
  }));
  const mediaItems = MEDIA_ITEMS.map((item) => ({ ...item, hint: hintOf(item.value) }));
  const shapeActive = SHAPE_TOOLS.includes(tool);

  return (
    <div
      role="toolbar"
      aria-label="Herramientas del lienzo"
      className="absolute bottom-4 left-1/2 z-30 flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-xl border border-line bg-panel p-1.5 text-ink shadow-2xl"
    >
      <button
        type="button"
        aria-label="Buscar comandos"
        title={withShortcut("Buscar comandos", "app.palette")}
        onClick={() => openDialog("palette")}
        className="flex h-8 items-center gap-2 rounded-lg bg-canvas px-3 text-xs text-ink-dim transition-colors hover:text-ink"
      >
        <SearchIcon />
        Buscar
        <Kbd combo={shortcutOf("app.palette")} />
      </button>

      <Divider />

      {BASIC_TOOLS.map((t) => (
        <button
          key={t.value}
          type="button"
          aria-label={t.label}
          title={withShortcut(t.label, toolCommandId(t.value))}
          aria-pressed={tool === t.value}
          onClick={() => setTool(t.value)}
          className={`${iconButton} ${tool === t.value ? on : idle}`}
        >
          {t.icon}
        </button>
      ))}

      <Divider />

      <MenuButton
        label="Figuras"
        items={shapeItems}
        selected={shapeActive ? tool : undefined}
        onSelect={setTool}
        className={`${pill} ${shapeActive ? "bg-accent text-white" : "bg-accent/90 text-white hover:bg-accent"}`}
      >
        <ShapesIcon />
        Figuras
        <ChevronIcon />
      </MenuButton>

      <MenuButton
        label="Imágenes"
        items={mediaItems}
        onSelect={runCommand}
        footer="También puedes arrastrar imágenes o enlaces al lienzo. Los videos, solo por URL."
        className={`${pill} bg-accent/20 text-accent hover:bg-accent/30`}
      >
        <ImageIcon />
        Imágenes
        <ChevronIcon />
      </MenuButton>

      <button
        type="button"
        aria-label="Editor de código"
        title={withShortcut("Editor de código", "code.open")}
        onClick={() => runCommand("code.open")}
        className={`${iconButton} ${idle}`}
      >
        <CodeIcon />
      </button>

      <button
        type="button"
        aria-label="Comentar"
        title={withShortcut("Comentar", toolCommandId("comment"))}
        aria-pressed={tool === "comment"}
        onClick={() => setTool("comment")}
        className={`${iconButton} ${tool === "comment" ? on : idle}`}
      >
        <CommentIcon />
      </button>

      <Divider />

      <button
        type="button"
        aria-label="Alejar"
        title={withShortcut("Alejar", "zoom.out")}
        onClick={() => stepZoom(-1)}
        disabled={zoom <= ZOOM_STEPS[0]}
        className={`${iconButton} ${idle} disabled:opacity-40`}
      >
        <MinusIcon />
      </button>

      <MenuButton
        label="Nivel de zoom"
        items={ZOOM_ITEMS}
        selected={fitted ? FIT : String(zoom)}
        onSelect={(v) => (v === FIT ? fitToWindow() : setZoom(Number(v)))}
        className="flex h-8 min-w-16 items-center justify-center gap-1 rounded-lg px-2 text-xs hover:bg-hover"
      >
        {zoom}%
        <ChevronIcon size={10} />
      </MenuButton>

      <button
        type="button"
        aria-label="Acercar"
        title={withShortcut("Acercar", "zoom.in")}
        onClick={() => stepZoom(1)}
        disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
        className={`${iconButton} ${idle} disabled:opacity-40`}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

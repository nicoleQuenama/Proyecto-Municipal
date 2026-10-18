import type { NavMode } from "../navigation/types";
import {
  DEVICES,
  type Device,
  type Tool,
} from "../viewport/viewport-context";

export type Dialog = "palette" | "settings" | "versions" | "image-url" | "video-url";

export type CommandGroup =
  | "General"
  | "Versiones"
  | "Navegación"
  | "Herramientas"
  | "Figuras"
  | "Medios"
  | "Vista"
  | "Zoom";

export interface Command {
  id: string;
  label: string;
  group: CommandGroup;
  defaultShortcut: string | null;
  run: () => void;
}

/** Acciones de la app que los comandos pueden ejecutar. */
export interface CommandActions {
  setTool: (tool: Tool) => void;
  setDevice: (device: Device) => void;
  setZoom: (zoom: number) => void;
  fitToWindow: () => void;
  stepZoom: (direction: 1 | -1) => void;
  toggleDialog: (dialog: Dialog) => void;
  pickImages: () => void;
  setMode: (mode: NavMode) => void;
  openCode: () => void;
}

export const toolCommandId = (tool: Tool) => `tool.${tool}`;

const TOOL_COMMANDS: {
  tool: Tool;
  label: string;
  group: CommandGroup;
  shortcut: string | null;
}[] = [
  { tool: "select", label: "Mover", group: "Herramientas", shortcut: "v" },
  { tool: "hand", label: "Mano", group: "Herramientas", shortcut: "h" },
  { tool: "frame", label: "Marco", group: "Herramientas", shortcut: "f" },
  { tool: "text", label: "Texto", group: "Herramientas", shortcut: "t" },
  { tool: "comment", label: "Comentar", group: "Herramientas", shortcut: "c" },
  { tool: "rectangle", label: "Rectángulo", group: "Figuras", shortcut: "r" },
  { tool: "ellipse", label: "Elipse", group: "Figuras", shortcut: "o" },
  { tool: "line", label: "Línea", group: "Figuras", shortcut: "l" },
  { tool: "triangle", label: "Triángulo", group: "Figuras", shortcut: null },
];

const DEVICE_SHORTCUTS: Record<Device, string> = {
  desktop: "alt+1",
  tablet: "alt+2",
  mobile: "alt+3",
};

/** Registro único de comandos: la paleta, los atajos y los tooltips salen de aquí. */
export function createCommands(actions: CommandActions): Command[] {
  const { setTool, setDevice, setZoom, fitToWindow, stepZoom, toggleDialog, pickImages, setMode, openCode } = actions;

  return [
    {
      id: "code.open",
      label: "Abrir el editor de código",
      group: "General",
      defaultShortcut: "ctrl+e",
      run: openCode,
    },
    {
      id: "app.palette",
      label: "Buscar comandos",
      group: "General",
      defaultShortcut: "ctrl+b",
      run: () => toggleDialog("palette"),
    },
    {
      id: "app.shortcuts",
      label: "Configurar atajos de teclado",
      group: "General",
      defaultShortcut: "ctrl+,",
      run: () => toggleDialog("settings"),
    },
    {
      id: "versions.open",
      label: "Abrir control de versiones",
      group: "Versiones",
      defaultShortcut: "ctrl+shift+g",
      run: () => toggleDialog("versions"),
    },

    {
      id: "mode.preview",
      label: "Probar la navegación",
      group: "Navegación",
      defaultShortcut: "p",
      run: () => setMode("preview"),
    },
    {
      id: "mode.edit",
      label: "Volver a editar",
      group: "Navegación",
      defaultShortcut: null,
      run: () => setMode("edit"),
    },

    ...TOOL_COMMANDS.map(({ tool, label, group, shortcut }) => ({
      id: toolCommandId(tool),
      label,
      group,
      defaultShortcut: shortcut,
      run: () => setTool(tool),
    })),

    {
      id: "media.upload",
      label: "Subir imagen desde el equipo",
      group: "Medios",
      defaultShortcut: "i",
      run: pickImages,
    },
    {
      id: "media.image-url",
      label: "Insertar imagen desde URL",
      group: "Medios",
      defaultShortcut: "alt+i",
      run: () => toggleDialog("image-url"),
    },
    {
      id: "media.video-url",
      label: "Insertar video desde URL",
      group: "Medios",
      defaultShortcut: "alt+v",
      run: () => toggleDialog("video-url"),
    },

    ...DEVICES.map(({ value, label }) => ({
      id: `device.${value}`,
      label: `Vista ${label.toLowerCase()}`,
      group: "Vista" as const,
      defaultShortcut: DEVICE_SHORTCUTS[value],
      run: () => setDevice(value),
    })),

    {
      id: "zoom.in",
      label: "Acercar",
      group: "Zoom",
      defaultShortcut: "alt+arrowup",
      run: () => stepZoom(1),
    },
    {
      id: "zoom.out",
      label: "Alejar",
      group: "Zoom",
      defaultShortcut: "alt+arrowdown",
      run: () => stepZoom(-1),
    },
    {
      id: "zoom.fit",
      label: "Ajustar a la ventana",
      group: "Zoom",
      defaultShortcut: "shift+1",
      run: fitToWindow,
    },
    {
      id: "zoom.reset",
      label: "Zoom al 100%",
      group: "Zoom",
      defaultShortcut: "alt+0",
      run: () => setZoom(100),
    },
  ];
}

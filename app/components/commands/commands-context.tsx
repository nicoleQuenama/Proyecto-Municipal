"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { BuilderTarget } from "../builder/component-builder";
import { useMedia } from "../media/media-context";
import { useNavigation } from "../navigation/navigation-context";
import { useSite, useSiteDispatch } from "../site/site-context";
import { useViewport } from "../viewport/viewport-context";
import { useWorkbench } from "../workbench/workbench-context";
import {
  createCommands,
  type Command,
  type Dialog,
} from "./command-definitions";
import { scrollToTarget } from "./scroll-to-target";
import type { SlashContext } from "./slash/types";
import {
  eventToCombo,
  formatShortcut,
  hasModifier,
  isInsideDialog,
  isTypingTarget,
} from "./shortcut";
import {
  getServerSnapshot,
  getSnapshot,
  parseOverrides,
  saveOverrides,
  subscribe,
} from "./shortcut-store";

export interface ResolvedCommand extends Command {
  /** Atajo vigente: el personalizado si existe, si no el de fábrica. */
  shortcut: string | null;
}

interface CommandsContextValue {
  commands: ResolvedCommand[];
  dialog: Dialog | null;
  openDialog: (dialog: Dialog) => void;
  closeDialog: () => void;
  /** El constructor de componentes: qué está abierto, o null si está cerrado. */
  builder: BuilderTarget | null;
  openBuilder: (target: BuilderTarget) => void;
  closeBuilder: () => void;
  /** Lo que necesitan los comandos que se escriben con «/». */
  slash: SlashContext;
  runCommand: (commandId: string) => void;
  /** Texto listo para tooltips, p. ej. "Mano (H)". */
  withShortcut: (label: string, commandId: string) => string;
  shortcutOf: (commandId: string) => string | null;
  findConflict: (commandId: string, combo: string) => ResolvedCommand | undefined;
  setShortcut: (commandId: string, combo: string | null) => void;
  resetShortcut: (commandId: string) => void;
  resetAll: () => void;
}

const CommandsContext = createContext<CommandsContextValue | null>(null);

export function useCommands() {
  const ctx = useContext(CommandsContext);
  if (!ctx) throw new Error("Debe usarse dentro de <CommandsProvider>");
  return ctx;
}

export function CommandsProvider({ children }: { children: ReactNode }) {
  const { setTool, setDevice, setZoom, fitToWindow, stepZoom } = useViewport();
  const { pickImages, remove: removeMedia } = useMedia();
  const site = useSite();
  const siteDispatch = useSiteDispatch();
  const { setMode } = useNavigation();
  const { openFile } = useWorkbench();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [builder, setBuilder] = useState<BuilderTarget | null>(null);

  const rawOverrides = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const overrides = useMemo(() => parseOverrides(rawOverrides), [rawOverrides]);

  const toggleDialog = useCallback(
    (target: Dialog) => setDialog((current) => (current === target ? null : target)),
    [],
  );
  const closeDialog = useCallback(() => setDialog(null), []);
  const closeBuilder = useCallback(() => setBuilder(null), []);

  const goTo = useCallback(
    (pageId: string, blockId?: string) => {
      siteDispatch({ type: "page/select", id: pageId });
      if (blockId) siteDispatch({ type: "block/select", id: blockId });
      requestAnimationFrame(() => scrollToTarget(pageId, blockId));
    },
    [siteDispatch],
  );

  const slash = useMemo<SlashContext>(
    () => ({ site, dispatch: siteDispatch, openBuilder: setBuilder, goTo, removeMedia }),
    [site, siteDispatch, goTo, removeMedia],
  );

  const commands = useMemo<ResolvedCommand[]>(
    () =>
      createCommands({ setTool, setDevice, setZoom, fitToWindow, stepZoom, toggleDialog, pickImages, setMode, openCode: () => openFile() }).map(
        (command) => ({
          ...command,
          shortcut: command.id in overrides ? overrides[command.id] : command.defaultShortcut,
        }),
      ),
    [setTool, setDevice, setZoom, fitToWindow, stepZoom, toggleDialog, pickImages, setMode, openFile, overrides],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;

      const combo = eventToCombo(e);
      if (!combo) return;

      // Las teclas sueltas no deben dispararse al escribir ni con un modal abierto.
      const blocked =
        (isTypingTarget(e.target) || isInsideDialog(e.target) || dialog !== null) &&
        !hasModifier(combo);
      if (blocked) return;

      const command = commands.find((c) => c.shortcut === combo);
      if (!command) return;

      e.preventDefault();
      command.run();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commands, dialog]);

  const value = useMemo<CommandsContextValue>(() => {
    const byId = (id: string) => commands.find((c) => c.id === id);
    const shortcutOf = (id: string) => byId(id)?.shortcut ?? null;

    const writeOverride = (id: string, combo: string | null) => {
      const next = { ...overrides };
      if (combo === byId(id)?.defaultShortcut) delete next[id];
      else next[id] = combo;
      saveOverrides(next);
    };

    return {
      commands,
      dialog,
      openDialog: setDialog,
      closeDialog,
      builder,
      openBuilder: setBuilder,
      closeBuilder,
      slash,
      runCommand: (id) => byId(id)?.run(),
      shortcutOf,
      withShortcut: (label, id) => {
        const shortcut = shortcutOf(id);
        return shortcut ? `${label} (${formatShortcut(shortcut)})` : label;
      },
      findConflict: (id, combo) => commands.find((c) => c.id !== id && c.shortcut === combo),
      setShortcut: writeOverride,
      resetShortcut: (id) => {
        const next = { ...overrides };
        delete next[id];
        saveOverrides(next);
      },
      resetAll: () => saveOverrides({}),
    };
  }, [commands, dialog, closeDialog, builder, closeBuilder, slash, overrides]);

  return <CommandsContext value={value}>{children}</CommandsContext>;
}

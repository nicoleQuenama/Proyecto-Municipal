"use client";

import { useState, type KeyboardEvent } from "react";
import { useCommands, type ResolvedCommand } from "./commands-context";
import { Kbd } from "./kbd";
import { Modal } from "../ui/modal";
import { eventToCombo } from "./shortcut";

export function ShortcutsSettings() {
  const { dialog, closeDialog } = useCommands();
  if (dialog !== "settings") return null;

  return (
    <Modal label="Atajos de teclado" onClose={closeDialog}>
      <SettingsContent />
    </Modal>
  );
}

function SettingsContent() {
  const { commands, findConflict, setShortcut, resetShortcut, resetAll } = useCommands();
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCapturing = () => {
    setCapturingId(null);
    setError(null);
  };

  const capture = (command: ResolvedCommand, e: KeyboardEvent) => {
    // Evita que la tecla pulsada dispare otros atajos o cierre el modal.
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") return stopCapturing();
    if (e.key === "Backspace" || e.key === "Delete") {
      setShortcut(command.id, null);
      return stopCapturing();
    }

    const combo = eventToCombo(e.nativeEvent);
    if (!combo) return;

    const conflict = findConflict(command.id, combo);
    if (conflict) {
      setError(`Ese atajo ya lo usa «${conflict.label}».`);
      return;
    }

    setShortcut(command.id, combo);
    stopCapturing();
  };

  return (
    <div>
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">Atajos de teclado</h2>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-md px-2 py-1 text-xs text-ink-dim hover:bg-hover hover:text-ink"
        >
          Restablecer todo
        </button>
      </header>

      <ul className="max-h-96 overflow-y-auto p-2">
        {commands.map((command) => {
          const capturing = capturingId === command.id;
          const customized = command.shortcut !== command.defaultShortcut;

          return (
            <li key={command.id} className="flex h-10 items-center justify-between rounded-md px-2 hover:bg-hover">
              <span className="text-[13px]">{command.label}</span>

              <span className="flex items-center gap-2">
                {customized && !capturing && (
                  <button
                    type="button"
                    aria-label={`Restablecer atajo de ${command.label}`}
                    title="Restablecer"
                    onClick={() => resetShortcut(command.id)}
                    className="text-xs text-ink-dim hover:text-ink"
                  >
                    ⟲
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Cambiar atajo de ${command.label}`}
                  onClick={(e) => {
                    e.currentTarget.focus(); // Safari no enfoca los botones al hacer clic
                    setError(null);
                    setCapturingId(command.id);
                  }}
                  onKeyDown={capturing ? (e) => capture(command, e) : undefined}
                  onBlur={() => capturing && stopCapturing()}
                  className={`flex h-7 min-w-24 items-center justify-center rounded-md px-2 text-xs ${
                    capturing ? "bg-accent/25 text-accent" : "bg-canvas"
                  }`}
                >
                  {capturing ? (
                    "Presiona las teclas…"
                  ) : command.shortcut ? (
                    <Kbd combo={command.shortcut} />
                  ) : (
                    <span className="text-ink-dim">Sin atajo</span>
                  )}
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      <footer className="min-h-9 border-t border-line px-4 py-2 text-xs">
        {error ? (
          <p role="alert" className="text-red-400">{error}</p>
        ) : (
          <p className="text-ink-dim">
            Haz clic en un atajo y pulsa la nueva combinación. Retroceso lo quita; Esc cancela.
          </p>
        )}
      </footer>
    </div>
  );
}

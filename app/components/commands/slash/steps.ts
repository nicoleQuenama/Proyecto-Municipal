import type { ListStep, PromptStep, Suggestion } from "./types";

export const list = (placeholder: string, suggestions: Suggestion[]): ListStep => ({
  kind: "list",
  placeholder,
  suggestions,
});

export const prompt = (
  placeholder: string,
  submit: PromptStep["submit"],
  initial?: string,
): PromptStep => ({ kind: "prompt", placeholder, initial, submit });

/** Pide confirmar antes de una acción que no se puede deshacer. */
export const confirm = (message: string, onConfirm: () => void): ListStep =>
  list(message, [
    { id: "confirm", label: "Sí, continuar", run: onConfirm },
    { id: "cancel", label: "Cancelar", run: () => undefined },
  ]);

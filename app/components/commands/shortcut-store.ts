import { getPreference, loadPreferences, setPreference, subscribe as subscribeToPreferences } from "../persistence/preferences-store";

/**
 * Los atajos personalizados de la persona, guardados en la base de datos (preferencia `editor.shortcuts`) y expuestos como
 * store externo para `useSyncExternalStore` (sin desajustes de hidratación).
 *
 * Solo se guardan las diferencias respecto a los valores por defecto:
 * `{ "tool.hand": "g", "tool.text": null }` (null = sin atajo).
 */

export type ShortcutOverrides = Record<string, string | null>;

const KEY = "editor.shortcuts";
const EMPTY = "{}";

export function subscribe(onChange: () => void): () => void {
  void loadPreferences();
  return subscribeToPreferences(onChange);
}

/** Devuelve el texto crudo: al ser un string, React lo compara por valor y no re-renderiza de más. */
export function getSnapshot(): string {
  return JSON.stringify(getPreference<ShortcutOverrides>(KEY, {}));
}

export function getServerSnapshot(): string {
  return EMPTY;
}

export function parseOverrides(raw: string): ShortcutOverrides {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ShortcutOverrides) : {};
  } catch {
    return {};
  }
}

export function saveOverrides(overrides: ShortcutOverrides): void {
  setPreference(KEY, overrides);
}

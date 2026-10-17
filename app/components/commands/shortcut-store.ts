/**
 * Persistencia de los atajos personalizados en localStorage, expuesta como
 * store externo para `useSyncExternalStore` (sin desajustes de hidratación).
 *
 * Solo se guardan las diferencias respecto a los valores por defecto:
 * `{ "tool.hand": "g", "tool.text": null }` (null = sin atajo).
 */

export type ShortcutOverrides = Record<string, string | null>;

const STORAGE_KEY = "editor.shortcuts";
const CHANGE_EVENT = "editor:shortcuts-changed";
const EMPTY = "{}";

export function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Devuelve el texto crudo: al ser un string, React lo compara por valor y no re-renderiza de más. */
export function getSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Sin almacenamiento disponible: los atajos vuelven a los valores por defecto.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

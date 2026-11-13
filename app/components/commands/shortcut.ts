/**
 * Utilidades puras para atajos de teclado.
 *
 * Un atajo se guarda como texto normalizado: modificadores en orden fijo
 * (`ctrl`, `alt`, `shift`) y la tecla al final, todo en minúsculas.
 * Ejemplos: "v", "ctrl+b", "alt+arrowup", "ctrl+shift+k".
 * Se usa "plus" para la tecla "+", de modo que "+" sirva siempre de separador.
 */

const IGNORED_KEYS = new Set(["control", "shift", "alt", "altgraph", "meta", "dead"]);

const KEY_ALIASES: Record<string, string> = {
  " ": "space",
  "+": "plus",
};

const KEY_LABELS: Record<string, string> = {
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  plus: "+",
  escape: "Esc",
};

/** Convierte un KeyboardEvent en un atajo normalizado, o null si solo es un modificador. */
export function eventToCombo(e: KeyboardEvent): string | null {
  // Algunos navegadores, lectores de pantalla y teclados virtuales emiten keydown sin `key`
  // (o con la cadena vacía durante la composición). Sin tecla no hay atajo que resolver.
  if (typeof e.key !== "string" || e.key.length === 0) return null;

  const key = e.key.toLowerCase();
  if (IGNORED_KEYS.has(key)) return null;

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  parts.push(KEY_ALIASES[key] ?? key);

  return parts.join("+");
}

/** Los atajos con Ctrl o Alt no escriben texto, así que pueden dispararse aunque se esté escribiendo. */
export function hasModifier(combo: string): boolean {
  return combo.startsWith("ctrl+") || combo.startsWith("alt+");
}

export function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
}

/** Los modales (constructor de componentes, versiones…) tienen sus propias teclas. */
export function isInsideDialog(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("dialog") !== null;
}

function labelOf(part: string): string {
  if (KEY_LABELS[part]) return KEY_LABELS[part];
  return part.charAt(0).toUpperCase() + part.slice(1);
}

/** "ctrl+b" → ["Ctrl", "B"] */
export function formatCombo(combo: string): string[] {
  return combo.split("+").map(labelOf);
}

/** "ctrl+b" → "Ctrl+B" */
export function formatShortcut(combo: string): string {
  return formatCombo(combo).join("+");
}

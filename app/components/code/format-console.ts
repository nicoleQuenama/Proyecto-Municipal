/** Convierte lo que el código pasa a `console.log(...)` en una sola línea de texto legible. */
export function formatConsoleValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === "function") return `[Function ${value.name || "anónima"}]`;
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof Element !== "undefined" && value instanceof Element) return `<${value.tagName.toLowerCase()}>`;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export const formatConsoleValues = (values: readonly unknown[]) => values.map(formatConsoleValue).join(" ");

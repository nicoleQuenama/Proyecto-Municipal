/** Estilos y piezas comunes de la barra flotante de herramientas. */

export const iconButton = "flex h-8 w-8 items-center justify-center rounded-lg transition-colors";
export const idle = "text-ink-dim hover:bg-hover hover:text-ink";
export const active = "bg-accent/25 text-accent";
export const pill = "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors";

export function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-line" />;
}

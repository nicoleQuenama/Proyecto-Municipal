/**
 * Clases compartidas de la interfaz. Centralizarlas evita que cada pantalla
 * reinvente botones, campos y tarjetas con estilos ligeramente distintos.
 */

export const FIELD =
  "h-9 min-w-0 rounded-md border border-line bg-canvas px-3 text-[13px] text-ink outline-none placeholder:text-ink-dim focus:border-accent";

export const PRIMARY_BUTTON =
  "h-9 rounded-lg bg-accent px-4 text-xs font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50";

export const GHOST_BUTTON =
  "h-9 rounded-lg border border-line px-4 text-xs font-medium text-ink transition-colors hover:bg-hover disabled:opacity-50";

export const DANGER_BUTTON =
  "h-9 rounded-lg border border-red-500/60 px-4 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50";

export const PANEL_CARD = "rounded-xl border border-line bg-canvas/40 p-4";

export const LABEL = "text-[10px] font-semibold tracking-wider text-ink-dim uppercase";

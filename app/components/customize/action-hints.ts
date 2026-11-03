import type { ActionKind } from "../behaviors/types";

/** Explicación breve de las acciones que crean avisos, para que se entienda qué elegir. */
export const ACTION_HINTS: Partial<Record<ActionKind, string>> = {
  toast: "Un aviso breve aparece y desaparece solo. Úsalo para confirmar una acción.",
  dialog: "Una ventana con título, mensaje y botón. Úsala cuando quieras que la persona lo lea con calma.",
};

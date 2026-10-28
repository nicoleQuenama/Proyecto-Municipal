/** Notas sobre el diseño, como los comentarios de Word: ancladas a un punto de una página, para el equipo o solo para quien las escribe. */

import type { SiteState } from "../site/types";

export type CommentAudience = "team" | "private";

export interface DesignComment {
  id: string;
  pageId: string;
  /** Posición en píxeles de la página. */
  x: number;
  y: number;
  text: string;
  author: string;
  /** Fecha y hora en formato ISO. */
  at: string;
  audience: CommentAudience;
  resolved?: boolean;
}

export type CommentAction =
  | { type: "comment/add"; comment: DesignComment }
  | { type: "comment/resolve"; id: string; resolved: boolean }
  | { type: "comment/remove"; id: string };

/** Las que puede ver esa persona en esa página: las del equipo y las suyas. */
export function visibleComments(comments: DesignComment[] | undefined, pageId: string, viewer: string): DesignComment[] {
  return (comments ?? []).filter((c) => c.pageId === pageId && (c.audience === "team" || c.author === viewer));
}

/** Solo quien la escribió puede borrarla. */
export const canRemoveComment = (comment: DesignComment, viewer: string) => comment.author === viewer;

type Handlers = { [K in CommentAction["type"]]: (state: SiteState, action: Extract<CommentAction, { type: K }>) => SiteState };

export const COMMENT_HANDLERS: Handlers = {
  "comment/add": (state, { comment }) => ({ ...state, comments: [...(state.comments ?? []), comment] }),
  "comment/resolve": (state, { id, resolved }) => ({
    ...state,
    comments: (state.comments ?? []).map((c) => (c.id === id ? { ...c, resolved } : c)),
  }),
  "comment/remove": (state, { id }) => ({ ...state, comments: (state.comments ?? []).filter((c) => c.id !== id) }),
};

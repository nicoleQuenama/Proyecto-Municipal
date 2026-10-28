/** Mover varias secciones colocadas a la vez, como un grupo: todas se desplazan lo mismo que la que se arrastra. */

import { placeBlock } from "../placement/placement-rules";
import type { Placement } from "../placement/types";
import type { SiteState } from "./types";

export type GroupMoveAction = {
  type: "block/place-group";
  pageId: string;
  /** La sección que se arrastra y el sitio donde está ahora (con guías e imán ya aplicados). */
  anchorId: string;
  placement: Placement;
  /** Dónde estaba cada sección del grupo al empezar el arrastre. */
  origins: Record<string, Placement>;
};

export function moveGroup(state: SiteState, { pageId, anchorId, placement, origins }: Omit<GroupMoveAction, "type">): SiteState {
  const start = origins[anchorId];
  if (!start) return placeBlock(state, pageId, anchorId, placement);
  const dx = placement.x - start.x;
  const dy = placement.y - start.y;
  return Object.entries(origins).reduce(
    (next, [id, origin]) => placeBlock(next, pageId, id, id === anchorId ? placement : { ...origin, x: origin.x + dx, y: origin.y + dy }),
    state,
  );
}

type Handlers = { [K in GroupMoveAction["type"]]: (state: SiteState, action: Extract<GroupMoveAction, { type: K }>) => SiteState };

export const GROUP_MOVE_HANDLERS: Handlers = {
  "block/place-group": (state, action) => moveGroup(state, action),
};

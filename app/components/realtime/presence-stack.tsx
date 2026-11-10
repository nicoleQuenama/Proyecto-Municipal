"use client";

import { useMemo } from "react";
import { useSiteSyncState } from "../persistence/site-sync-context";
import { useSite } from "../site/site-context";
import { useBranch } from "../versioning/branch-context";
import { useRealtime } from "./realtime-context";
import type { Peer } from "./types";

const MAX_VISIBLE = 4;

/** Una frase corta con lo que hace esa persona ahora: en qué página está y si está en otra rama. */
function describe(peer: Peer, pageName: string | undefined, branch: string | null): string {
  const where = pageName ? `en «${pageName}»` : "en el proyecto";
  return `${peer.name} está ${where}${peer.branch !== branch ? ` (rama ${peer.branch})` : ""}${peer.selection.length > 0 ? ` · tiene ${peer.selection.length} seleccionada${peer.selection.length > 1 ? "s" : ""}` : ""}`;
}

/** Quién está en vivo en el proyecto, como en Canva: sus iniciales con su color, una por persona. */
export function PresenceStack() {
  const { peers, connected } = useRealtime();
  const { pages } = useSite();
  const branches = useBranch();
  const sync = useSiteSyncState();
  const branch = branches?.branch ?? null;
  /** Cada cuenta trabaja en su rama: para verse editar en vivo hay que estar en la misma. Al tocar a alguien se va a la suya. */
  const follow = async (peer: Peer) => {
    if (!branches || peer.branch === branch) return;
    await sync.flush();
    branches.setBranch(peer.branch);
  };

  // La misma persona con dos pestañas abiertas cuenta una vez.
  const people = useMemo(() => [...new Map(peers.map((peer) => [peer.uid, peer])).values()], [peers]);
  if (!connected || people.length === 0) return null;

  const shown = people.slice(0, MAX_VISIBLE);
  return (
    <div className="flex shrink-0 items-center gap-2" role="group" aria-label={`${people.length} ${people.length === 1 ? "persona" : "personas"} en vivo`}>
      <span className="flex items-center gap-1 text-[11px] text-ink-dim">
        <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
        En vivo
      </span>
      <div className="flex -space-x-2">
        {shown.map((peer) => (
          <button
            type="button"
            key={peer.uid}
            onClick={() => void follow(peer)}
            title={`${describe(peer, pages.find((page) => page.id === peer.page)?.name, branch)}${peer.branch !== branch ? " · clic para ir a su rama" : ""}`}
            style={{ backgroundColor: peer.color }}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-panel ${peer.branch !== branch ? "cursor-pointer opacity-70 hover:opacity-100" : "cursor-default"}`}
          >
            {peer.name.charAt(0).toUpperCase()}
          </button>
        ))}
        {people.length > MAX_VISIBLE && (
          <span title={people.slice(MAX_VISIBLE).map((peer) => peer.name).join(", ")} className="flex h-7 w-7 items-center justify-center rounded-full bg-hover text-[11px] font-medium ring-2 ring-panel">
            +{people.length - MAX_VISIBLE}
          </span>
        )}
      </div>
    </div>
  );
}

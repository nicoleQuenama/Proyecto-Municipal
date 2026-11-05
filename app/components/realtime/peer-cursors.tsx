"use client";

import { useBranch } from "../versioning/branch-context";
import { useRealtime } from "./realtime-context";

/** Los cursores de las demás personas sobre esta página, con su nombre y su color. Van dentro de la página: se mueven con ella y su zoom. */
export function PeerCursors({ pageId }: { pageId: string }) {
  const { peers } = useRealtime();
  const branch = useBranch()?.branch;
  const here = peers.filter((peer) => peer.page === pageId && peer.cursor && peer.branch === branch);
  if (here.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-50 overflow-visible">
      {here.map((peer) => (
        <div
          key={peer.id}
          className="absolute left-0 top-0 transition-transform duration-75 ease-linear"
          style={{ transform: `translate(${peer.cursor!.x}px, ${peer.cursor!.y}px)` }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill={peer.color} stroke="white" strokeWidth="1.2" className="drop-shadow">
            <path d="M2 2l13 5.5-5.2 1.7L7.5 15z" />
          </svg>
          <span className="ml-3.5 -mt-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow" style={{ backgroundColor: peer.color }}>
            {peer.name}
          </span>
        </div>
      ))}
    </div>
  );
}

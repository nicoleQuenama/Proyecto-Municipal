import type { DragEvent } from "react";
import type { PathNode } from "./paths";
import { DRAG_TYPE, type DragPayload } from "./types";

function startDrag(event: DragEvent, payload: DragPayload) {
  event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "copy";
}

function Node({ node, sourceId, depth }: { node: PathNode; sourceId: string; depth: number }) {
  return (
    <li>
      <div
        draggable
        onDragStart={(e) => startDrag(e, { sourceId, path: node.path, isList: node.isList })}
        title={node.isList ? "Sobre una sección la repite por cada elemento; sobre un elemento, lo rellena con la lista" : "Suéltala sobre un elemento (o sobre una sección para rellenarla)"}
        className="flex cursor-grab items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-hover"
        style={{ paddingLeft: depth * 12 + 4 }}
      >
        <span className="font-mono text-accent">{node.key}</span>
        <span className="truncate text-ink-dim">{node.preview}</span>
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <Node key={child.path} node={child} sourceId={sourceId} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Las claves de la respuesta; cada una se arrastra a la página. */
export function KeyTree({ root, sourceId }: { root: PathNode; sourceId: string }) {
  return (
    <ul className="max-h-72 overflow-auto rounded-md border border-line p-1">
      <Node node={root} sourceId={sourceId} depth={0} />
    </ul>
  );
}

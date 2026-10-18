"use client";

import { useState } from "react";
import { CODE_COMPONENT_ID } from "../site/code-defaults";
import { useSite, useSiteDispatch } from "../site/site-context";
import { kindOf, sameFile, type CodeLanguage, type FileRef } from "./file-ref";
import { buildTree, type TreeAction, type TreeNode } from "./tree";
import { useWorkbench } from "./workbench-context";

/** Cómo se distingue cada lenguaje en el explorador. */
const LANGUAGE_BADGES: Record<CodeLanguage, { label: string; className: string }> = {
  html: { label: "<>", className: "text-orange-400" },
  css: { label: "#", className: "text-sky-400" },
  typescript: { label: "TS", className: "text-sky-300" },
};

const ROW = "flex h-7 w-full items-center gap-1.5 rounded px-2 text-left text-xs";

/** Un nombre libre para una función nueva: nuevaFuncion, nuevaFuncion2… */
function freeName(taken: string[]): string {
  let name = "nuevaFuncion";
  for (let n = 2; taken.includes(name); n += 1) name = `nuevaFuncion${n}`;
  return name;
}

interface NodeViewProps {
  node: TreeNode;
  depth: number;
  collapsed: Set<string>;
  toggle: (id: string) => void;
  active: FileRef | null;
  onAction: (action: TreeAction) => void;
}

function NodeView({ node, depth, collapsed, toggle, active, onAction }: NodeViewProps) {
  const dispatch = useSiteDispatch();
  const { openFile, closeTab } = useWorkbench();
  const indent = { paddingLeft: 8 + depth * 12 };

  // Un archivo.
  if (node.ref) {
    const badge = LANGUAGE_BADGES[kindOf(node.ref).language];
    const isActive = active !== null && sameFile(active, node.ref);
    const ref = node.ref;

    return (
      <li className="group/file flex items-center">
        <button
          type="button"
          onClick={() => openFile(ref)}
          title={node.label}
          className={`${ROW} min-w-0 ${isActive ? "bg-accent/25 text-ink" : "text-ink-dim hover:bg-hover hover:text-ink"}`}
          style={indent}
        >
          <span aria-hidden className={`w-5 shrink-0 text-center font-mono text-[10px] font-bold ${badge.className}`}>{badge.label}</span>
          <span className="truncate">{node.label}</span>
        </button>
        {node.functionId && (
          <button
            type="button"
            aria-label={`Quitar la función ${node.label}`}
            title="Quitar función"
            onClick={() => {
              closeTab(ref);
              dispatch({ type: "function/remove", id: node.functionId! });
            }}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded text-ink-dim hover:text-red-400 group-hover/file:flex"
          >
            ×
          </button>
        )}
      </li>
    );
  }

  // Una carpeta.
  const open = !collapsed.has(node.id);
  return (
    <li>
      <div className="group/folder flex items-center">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => toggle(node.id)}
          className={`${ROW} min-w-0 font-medium text-ink hover:bg-hover`}
          style={indent}
        >
          <span aria-hidden className={`w-3 shrink-0 text-[10px] text-ink-dim transition-transform ${open ? "" : "-rotate-90"}`}>▾</span>
          <span className="truncate">{node.label}</span>
        </button>
        {node.action && (
          <button
            type="button"
            aria-label={node.action.type === "add-block" ? `Añadir un bloque de código a ${node.label}` : "Añadir una función"}
            title={node.action.type === "add-block" ? "Añadir un bloque de código a la página" : "Añadir una función"}
            onClick={() => onAction(node.action!)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-ink-dim hover:bg-hover hover:text-ink"
          >
            +
          </button>
        )}
      </div>
      {open && (
        <ul>
          {node.children?.map((child) => (
            <NodeView key={child.id} node={child} depth={depth + 1} collapsed={collapsed} toggle={toggle} active={active} onAction={onAction} />
          ))}
          {node.children?.length === 0 && (
            <li className="px-2 py-1 text-[11px] text-ink-dim" style={{ paddingLeft: 8 + (depth + 1) * 12 }}>
              {node.action?.type === "add-function" ? "Selecciona código y conviértelo en función, o pulsa +." : "Vacío"}
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

/** El explorador: la selección actual, el proyecto y cada página, con sus archivos de código. */
export function Explorer({ active }: { active: FileRef | null }) {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const { openFile } = useWorkbench();
  // Empieza recogido salvo la selección y la página actual: el proyecto entero a la vista abruma.
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(["project", ...site.pages.filter((p) => p.id !== site.currentPageId).map((p) => `page:${p.id}`)]),
  );

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  /** Qué hace cada acción de una carpeta. */
  const actions: { [K in TreeAction["type"]]: (action: Extract<TreeAction, { type: K }>) => void } = {
    "add-block": ({ pageId }) => {
      const blockId = crypto.randomUUID();
      dispatch({ type: "block/add", id: blockId, componentId: CODE_COMPONENT_ID, pageId });
      openFile({ kind: "block-html", pageId, blockId });
    },
    "add-function": () => {
      const name = freeName(site.functions.map((f) => f.name));
      const id = crypto.randomUUID();
      dispatch({ type: "function/save", fn: { id, name, code: `function ${name}() {\n  \n}`, scope: { kind: "global" } } });
      openFile({ kind: "function", functionId: id });
    },
  };
  const onAction = (action: TreeAction) => (actions[action.type] as (action: TreeAction) => void)(action);

  return (
    <nav aria-label="Archivos de código" className="flex w-64 shrink-0 flex-col border-r border-line bg-panel">
      <p className="px-3 py-2 text-[10px] font-semibold tracking-wider text-ink-dim uppercase">Explorador</p>
      <ul className="min-h-0 flex-1 overflow-y-auto pb-3">
        {buildTree(site).map((node) => (
          <NodeView key={node.id} node={node} depth={0} collapsed={collapsed} toggle={toggle} active={active} onAction={onAction} />
        ))}
      </ul>
    </nav>
  );
}

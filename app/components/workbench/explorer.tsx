"use client";

import { useState } from "react";
import { CODE_COMPONENT_ID } from "../site/code-defaults";
import { useSite, useSiteDispatch } from "../site/site-context";
import { fileId, kindOf, sameFile, type CodeLanguage, type FileRef } from "./file-ref";
import { ConfirmDelete } from "./confirm-dialog";
import { ContextMenu } from "./context-menu";
import { currentName, menuFor, nameProblem, renameAction, type MenuItem } from "./node-menu";
import { RenameField } from "./rename-field";
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
  /** Clic derecho sobre un nodo. */
  onMenu: (node: TreeNode, x: number, y: number) => void;
  /** El nodo que se está renombrando y cómo terminar de hacerlo. */
  renaming: { id: string; submit: (node: TreeNode, name: string) => void; cancel: () => void } | null;
}

function NodeView({ node, depth, collapsed, toggle, active, onAction, onMenu, renaming }: NodeViewProps) {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const { openFile, closeTab } = useWorkbench();
  const indent = { paddingLeft: 8 + depth * 12 };
  const menu = (e: React.MouseEvent) => {
    if (!node.owner) return;
    e.preventDefault();
    onMenu(node, e.clientX, e.clientY);
  };
  const rename =
    renaming?.id === node.id && node.owner ? (
      <div className="flex min-w-0 flex-1" style={indent}>
        <RenameField
          initial={currentName(site, node.owner)}
          problem={(name) => nameProblem(site, node.owner!, name)}
          onSubmit={(name) => renaming.submit(node, name)}
          onCancel={renaming.cancel}
        />
      </div>
    ) : null;

  // Un archivo.
  if (node.ref) {
    const badge = LANGUAGE_BADGES[kindOf(node.ref).language];
    const isActive = active !== null && sameFile(active, node.ref);
    const ref = node.ref;

    return (
      <li className="group/file flex items-center" onContextMenu={menu}>
        {rename ?? <button
          type="button"
          onClick={() => openFile(ref)}
          title={node.label}
          className={`${ROW} min-w-0 ${isActive ? "bg-accent/25 text-ink" : "text-ink-dim hover:bg-hover hover:text-ink"} cursor-pointer`}
          style={indent}
        >
          <span aria-hidden className={`w-5 shrink-0 text-center font-mono text-[10px] font-bold ${badge.className}`}>{badge.label}</span>
          <span className="truncate">{node.label}</span>
        </button>}
        {node.functionId && !rename && (
          <button
            type="button"
            aria-label={`Quitar la función ${node.label}`}
            title="Quitar función"
            onClick={() => {
              closeTab(ref);
              dispatch({ type: "function/remove", id: node.functionId! });
            }}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded text-ink-dim hover:text-red-400 group-hover/file:flex cursor-pointer"
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
      <div className="group/folder flex items-center" onContextMenu={menu}>
        {rename ?? <button
          type="button"
          aria-expanded={open}
          onClick={() => toggle(node.id)}
          className={`${ROW} min-w-0 font-medium text-ink hover:bg-hover cursor-pointer`}
          style={indent}
        >
          <span aria-hidden className={`w-3 shrink-0 text-[10px] text-ink-dim transition-transform ${open ? "" : "-rotate-90"}`}>▾</span>
          <span className="truncate">{node.label}</span>
        </button>}
        {node.action && !rename && (
          <button
            type="button"
            aria-label={node.action.type === "add-block" ? `Añadir un bloque de código a ${node.label}` : "Añadir una función"}
            title={node.action.type === "add-block" ? "Añadir un bloque de código a la página" : "Añadir una función"}
            onClick={() => onAction(node.action!)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-ink-dim hover:bg-hover hover:text-ink cursor-pointer"
          >
            +
          </button>
        )}
      </div>
      {open && (
        <ul>
          {node.children?.map((child) => (
            <NodeView key={child.id} node={child} depth={depth + 1} collapsed={collapsed} toggle={toggle} active={active} onAction={onAction} onMenu={onMenu} renaming={renaming} />
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
  const { openFile, closeTab, tabs } = useWorkbench();
  const [menu, setMenu] = useState<{ node: TreeNode; x: number; y: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Extract<MenuItem["run"], { type: "delete" }> | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
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

  const pick = (item: MenuItem) => {
    const node = menu?.node;
    setMenu(null);
    if (!node) return;
    if (item.run.type === "rename") return setRenamingId(node.id);
    if (item.run.type === "open") return openFile(item.run.ref);
    setPendingDelete(item.run);
  };
  const confirmDelete = () => {
    if (!pendingDelete) return;
    pendingDelete.closes.forEach(closeTab);
    dispatch(pendingDelete.action);
    setPendingDelete(null);
  };
  const renaming = renamingId
    ? {
        id: renamingId,
        cancel: () => setRenamingId(null),
        submit: (node: TreeNode, name: string) => {
          const action = node.owner ? renameAction(site, node.owner, name) : null;
          if (action) dispatch(action);
          setRenamingId(null);
        },
      }
    : null;

  return (
    <nav aria-label="Archivos de código" className="flex w-56 shrink-0 flex-col border-r border-line bg-panel">
      <p className="px-3 py-2 text-[10px] font-semibold tracking-wider text-ink-dim uppercase">Explorador</p>
      <ul className="min-h-0 flex-1 overflow-y-auto pb-3">
        {buildTree(site, new Set(tabs.map(fileId))).map((node) => (
          <NodeView key={node.id} node={node} depth={0} collapsed={collapsed} toggle={toggle} active={active} onAction={onAction} onMenu={(n, x, y) => setMenu({ node: n, x, y })} renaming={renaming} />
        ))}
      </ul>
      {menu ? <ContextMenu x={menu.x} y={menu.y} items={menuFor(menu.node, site)} onPick={pick} onClose={() => setMenu(null)} /> : null}
      {pendingDelete ? <ConfirmDelete title={pendingDelete.title} warnings={pendingDelete.warnings} onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} /> : null}
    </nav>
  );
}

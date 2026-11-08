/** Las opciones del clic derecho en el explorador, según de quién es cada nodo. Un dueño nuevo es una entrada nueva. */

import { FUNCTION_NAME } from "../functions/scope";
import type { SiteAction, SiteState } from "../site/types";
import { kindOf, type FileRef } from "./file-ref";
import { removalOf } from "./removal";
import { usageWarnings } from "./usage";
import type { NodeOwner, TreeNode } from "./tree";

export interface MenuItem {
  label: string;
  danger?: boolean;
  /** Renombrar abre un campo de texto en el nodo; lo demás se ejecuta al pulsar. */
  run: { type: "rename" } | { type: "open"; ref: FileRef } | { type: "delete"; title: string; action: SiteAction; closes: FileRef[]; warnings: string[] };
}

/** El texto con que empieza el campo al renombrar. */
export function currentName(site: SiteState, owner: NodeOwner): string {
  if (owner.type === "function") return site.functions.find((f) => f.id === owner.functionId)?.name ?? "";
  if (owner.type === "page") return site.pages.find((p) => p.id === owner.pageId)?.name ?? "";
  return "";
}

/** Si el nombre sirve para ese dueño; devuelve el motivo si no. */
export function nameProblem(site: SiteState, owner: NodeOwner, name: string): string | null {
  if (!name.trim()) return "El nombre no puede estar vacío.";
  if (owner.type === "function") {
    if (!FUNCTION_NAME.test(name)) return "Usa letras, números, _ o $, sin empezar por número.";
    if (site.functions.some((f) => f.name === name && f.id !== owner.functionId)) return "Ya hay una función con ese nombre.";
  }
  return null;
}

/** Lo que hay que enviar al sitio para dar ese nombre. */
export function renameAction(site: SiteState, owner: NodeOwner, name: string): SiteAction | null {
  if (owner.type === "page") return { type: "page/rename", id: owner.pageId, name: name.trim() };
  if (owner.type !== "function") return null;
  const fn = site.functions.find((f) => f.id === owner.functionId);
  if (!fn) return null;
  // El nombre también está en la declaración del código: se cambia ahí para que la función siga llamándose igual.
  const code = fn.code.replace(/^(\s*(?:async\s+)?function\s*\*?\s*)[A-Za-z_$][\w$]*/, `$1${name}`);
  return { type: "function/save", fn: { ...fn, name, code } };
}

const OWNER_MENUS: { [K in NodeOwner["type"]]: (owner: Extract<NodeOwner, { type: K }>, node: TreeNode, site: SiteState) => MenuItem[] } = {
  function: (owner, node, site) => [
    { label: "Cambiar nombre", run: { type: "rename" } },
    {
      label: "Eliminar función",
      danger: true,
      run: {
        type: "delete",
        title: `¿Eliminar la función ${node.label}?`,
        action: { type: "function/remove", id: owner.functionId },
        closes: node.ref ? [node.ref] : [],
        warnings: node.ref ? usageWarnings(site, node.ref) : [],
      },
    },
  ],
  block: (owner, node) => [
    {
      label: "Eliminar bloque de código",
      danger: true,
      run: {
        type: "delete",
        title: "¿Eliminar este bloque de código?",
        action: { type: "block/remove", id: owner.blockId },
        closes: (node.children ?? []).flatMap((child) => (child.ref ? [child.ref] : [])),
        warnings: ["Se elimina la sección entera de la página, con su HTML, CSS y TypeScript."],
      },
    },
  ],
  page: (owner, _node, site) => [
    { label: "Cambiar nombre de la página", run: { type: "rename" } },
    ...newFiles(site, [
      { kind: "page-css", pageId: owner.pageId },
      { kind: "page-js", pageId: owner.pageId },
    ]),
  ],
  project: (_owner, _node, site) => newFiles(site, [{ kind: "global-css" }]),
  file: (owner, node, site) => {
    const removal = removalOf(owner.ref, site);
    if (!removal) return [];
    const clearing = removal.label !== "Eliminar archivo";
    return [
      {
        label: removal.label,
        danger: true,
        run: {
          type: "delete",
          title: `¿${clearing ? "Vaciar" : "Eliminar"} ${node.label}?`,
          action: removal.action,
          closes: clearing ? [] : [owner.ref],
          warnings: usageWarnings(site, owner.ref),
        },
      },
    ];
  },
};

/** «Nuevo archivo» para los que aún no existen (están vacíos y por tanto ocultos): se crean al abrirlos y escribir. */
function newFiles(site: SiteState, refs: FileRef[]): MenuItem[] {
  return refs.flatMap((ref) => {
    const kind = kindOf(ref);
    if (kind.read(site, ref).trim() !== "") return [];
    const name = kind.name(site, ref);
    return name ? [{ label: `Nuevo archivo: ${name}`, run: { type: "open" as const, ref } }] : [];
  });
}

export function menuFor(node: TreeNode, site: SiteState): MenuItem[] {
  if (!node.owner) return [];
  return (OWNER_MENUS[node.owner.type] as (owner: NodeOwner, node: TreeNode, site: SiteState) => MenuItem[])(node.owner, node, site);
}

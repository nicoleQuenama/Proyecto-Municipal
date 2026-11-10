/** El explorador de archivos del editor: carpetas y archivos derivados de lo que hay en el sitio. */

import { elementLabel } from "../navigation/links";
import { SECTION_KEY, type BlockInstance, type ComponentDef, type FunctionScope, type Page, type SiteState } from "../site/types";
import { fileId, kindOf, type FileRef } from "./file-ref";
import { HIDDEN_WHEN_EMPTY, isEmptyFile } from "./removal";

/** Lo que se puede hacer desde una carpeta, además de abrir sus archivos. */
export type TreeAction = { type: "add-block"; pageId: string } | { type: "add-function" };

/** De quién es un nodo, para ofrecerle renombrar o eliminar. */
export type NodeOwner =
  | { type: "function"; functionId: string }
  | { type: "block"; pageId: string; blockId: string }
  | { type: "page"; pageId: string }
  | { type: "project" }
  | { type: "file"; ref: FileRef };

export interface TreeNode {
  id: string;
  label: string;
  /** Un archivo; sin él, es una carpeta. */
  ref?: FileRef;
  children?: TreeNode[];
  action?: TreeAction;
  /** Si es una función, se puede quitar. */
  functionId?: string;
  owner?: NodeOwner;
}

const file = (site: SiteState, ref: FileRef, label?: string): TreeNode[] => {
  const name = kindOf(ref).name(site, ref);
  return name === null ? [] : [{ id: fileId(ref), label: label ?? name, ref, owner: { type: "file", ref } }];
};

const folder = (id: string, label: string, children: TreeNode[], extra: Partial<TreeNode> = {}): TreeNode => ({
  id,
  label,
  children,
  ...extra,
});

const defOf = (site: SiteState, block: BlockInstance): ComponentDef | undefined =>
  site.components.find((c) => c.id === block.componentId);

/** Dónde vale una función, dicho en pocas palabras para el explorador. */
function scopeLabel(site: SiteState, scope: FunctionScope): string {
  if (scope.kind === "global") return "global";

  const block = site.pages.flatMap((p) => p.blocks).find((b) => b.id === scope.blockId);
  const name = (block && defOf(site, block)?.name) ?? "sección";
  if (scope.kind === "block") return name;

  const element = block && defOf(site, block)?.elements.find((e) => e.id === scope.elementId);
  return `${name} › ${element ? elementLabel(element) : "elemento"}`;
}

/** Los archivos de código de una sección o de uno de sus elementos: su CSS y las interacciones con código. */
function scopeFiles(site: SiteState, page: Page, block: BlockInstance, key: string): TreeNode[] {
  const behaviors = (block.behaviors ?? []).filter((b) => b.scope === key && b.action.kind === "code");
  return [
    ...file(site, { kind: "custom-css", pageId: page.id, blockId: block.id, key }),
    ...file(site, { kind: "component-css", componentId: block.componentId, key }),
    ...behaviors.flatMap((b) => file(site, { kind: "behavior-js", pageId: page.id, blockId: block.id, behaviorId: b.id })),
  ];
}

/** Lo que está seleccionado ahora, siempre a mano arriba del todo. */
function selectionFolder(site: SiteState): TreeNode[] {
  const page = site.pages.find((p) => p.id === site.currentPageId);
  const block = page?.blocks.find((b) => b.id === site.selectedId);
  const def = block && defOf(site, block);
  if (!page || !block || !def) return [];

  const element = def.elements.find((e) => e.id === site.selectedElementId);
  const children = block.code
    ? [
        ...file(site, { kind: "block-html", pageId: page.id, blockId: block.id }),
        ...file(site, { kind: "block-css", pageId: page.id, blockId: block.id }),
        ...file(site, { kind: "block-js", pageId: page.id, blockId: block.id }),
      ]
    : scopeFiles(site, page, block, element ? element.id : SECTION_KEY);

  return [folder("selection", `Selección · ${element ? elementLabel(element) : def.name}`, children)];
}

function projectFolder(site: SiteState): TreeNode {
  const functions = site.functions.map<TreeNode>((fn) => ({
    id: fileId({ kind: "function", functionId: fn.id }),
    label: `${fn.name}.ts · ${scopeLabel(site, fn.scope)}`,
    ref: { kind: "function", functionId: fn.id },
    functionId: fn.id,
    owner: { type: "function", functionId: fn.id },
  }));

  return folder("project", "Proyecto", [
    ...file(site, { kind: "global-css" }),
    folder("functions", "Funciones reutilizables", functions, { action: { type: "add-function" } }),
  ], { owner: { type: "project" } });
}

function pageFolder(site: SiteState, page: Page): TreeNode {
  const sections = page.blocks.flatMap<TreeNode>((block, index) => {
    const def = defOf(site, block);
    if (!def) return [];

    if (block.code) {
      return [
        folder(`${page.id}:${block.id}`, `${def.name} ${index + 1}`, [
          ...file(site, { kind: "block-html", pageId: page.id, blockId: block.id }),
          ...file(site, { kind: "block-css", pageId: page.id, blockId: block.id }),
          ...file(site, { kind: "block-js", pageId: page.id, blockId: block.id }),
        ], { owner: { type: "block", pageId: page.id, blockId: block.id } }),
      ];
    }

    // Una sección normal aparece solo si tiene código propio, para no llenar el explorador.
    const keys = [SECTION_KEY, ...def.elements.map((e) => e.id)];
    const children = keys.flatMap((key) => {
      const hasCode = block.custom?.[key]?.css.trim() || (block.behaviors ?? []).some((b) => b.scope === key && b.action.kind === "code");
      return hasCode ? scopeFiles(site, page, block, key) : [];
    });
    return children.length > 0 ? [folder(`${page.id}:${block.id}`, def.name, children)] : [];
  });

  return folder(
    `page:${page.id}`,
    page.name,
    [
      ...file(site, { kind: "page-css", pageId: page.id }),
      ...file(site, { kind: "page-js", pageId: page.id }),
      ...sections,
    ],
    { action: { type: "add-block", pageId: page.id }, owner: { type: "page", pageId: page.id } },
  );
}

/** Quita los archivos eliminados: los que se muestran solo si tienen algo escrito o están abiertos. */
function prune(nodes: TreeNode[], site: SiteState, open: ReadonlySet<string>): TreeNode[] {
  return nodes.flatMap((node) => {
    if (node.ref) {
      const hidden = HIDDEN_WHEN_EMPTY.has(node.ref.kind) && isEmptyFile(node.ref, site) && !open.has(node.id);
      return hidden ? [] : [node];
    }
    return [{ ...node, children: node.children && prune(node.children, site, open) }];
  });
}

/** El árbol completo: la selección, el proyecto y cada página. `open`: los archivos con pestaña abierta. */
export function buildTree(site: SiteState, open: ReadonlySet<string> = new Set()): TreeNode[] {
  return prune(
    [
      ...selectionFolder(site),
      projectFolder(site),
      folder("pages", "Páginas", site.pages.map((page) => pageFolder(site, page))),
    ],
    site,
    open,
  );
}

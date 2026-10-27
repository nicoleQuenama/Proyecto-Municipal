import type { Behavior } from "../behaviors/types";
import { buildTree, type StackNode } from "../responsive/stack-tree";
import type { Variable } from "../styles/types";
import type { BlockInstance, ComponentDef } from "../site/types";
import { describeElement, type SpecContext } from "./spec-elements";

export interface SpecInput {
  /** La sección tal como se ve (con el formato propio ya aplicado) y con las imágenes incrustadas ya sacadas. */
  view: ComponentDef;
  block: BlockInstance;
  pageName: string;
  route?: string;
  variables: Variable[];
  context: SpecContext & { sourcePath: (sourceId: string, path: string) => string };
}

/** Cómo se cuenta cada acción de una interacción. Una nueva es una entrada nueva. */
const ACTIONS: Record<Behavior["action"]["kind"], (action: never, ctx: SpecContext) => string> = {
  navigate: ((a: { pageId: string }, ctx: SpecContext) => `ir a la página «${ctx.pageName(a.pageId)}»`) as never,
  animate: ((a: { effect: string; seconds: number }) => `animación «${a.effect}» de ${a.seconds}s`) as never,
  count: ((a: { from: number; to: number; seconds: number; suffix: string }) => `contar de ${a.from} a ${a.to}${a.suffix} en ${a.seconds}s`) as never,
  toast: ((a: { message: string; tone: string }) => `mostrar una notificación (${a.tone}): «${a.message}»`) as never,
  dialog: ((a: { title: string; message: string }) => `mostrar un diálogo «${a.title}»: ${a.message}`) as never,
  play: (() => "reproducir una animación grabada del editor") as never,
  toggle: ((a: { mode: string; targetKey: string }) => `${a.mode === "show" ? "mostrar" : a.mode === "hide" ? "ocultar" : "alternar"} otro elemento`) as never,
  openUrl: ((a: { url: string }) => `abrir ${a.url}`) as never,
  code: ((a: { source: string }) => `ejecutar código propio:\n\`\`\`ts\n${a.source}\n\`\`\``) as never,
};

const TRIGGERS: Record<Behavior["trigger"], string> = {
  click: "al hacer clic", hover: "al pasar el cursor", enter: "al entrar el cursor", leave: "al salir el cursor", scroll: "al hacer scroll hasta verlo", load: "al cargar",
};

const bullets = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

function treeLines(nodes: StackNode[], depth: number, describe: (n: StackNode["el"]) => string): string[] {
  return nodes.flatMap((node) => [`${"  ".repeat(depth)}- ${describe(node.el)}`, ...treeLines(node.children, depth + 1, describe)]);
}

const variablesUsed = (input: SpecInput): Variable[] => {
  const text = JSON.stringify({ view: input.view, block: input.block });
  const used = new Set([...text.matchAll(/var\(--([\w-]+)\)/g)].map((match) => match[1]));
  return input.variables.filter((variable) => used.has(variable.name));
};

/** Cada parte de la especificación; si no hay nada que contar, devuelve null y no sale. */
const PARTS: ((input: SpecInput) => string | null)[] = [
  ({ view, pageName, route }) =>
    `# Sección «${view.name}»\n\nPágina: ${pageName}${route ? ` (ruta ${route})` : ""}. Tamaño de diseño: ${view.width}×${view.height}px (escritorio).${view.description ? `\n\n${view.description}` : ""}`,

  ({ view, block, context }) => {
    const visible = view.elements.filter((element) => !element.hidden);
    const bindings = Object.fromEntries(Object.entries(block.bindings ?? {}).map(([id, ref]) => [id, context.sourcePath(ref.sourceId, ref.path)]));
    const lines = treeLines(buildTree(visible), 0, (element) => describeElement(element, view.links, bindings, context));
    return `## Estructura y elementos\n\nCada elemento está en una caja posicionada (coordenadas desde la esquina de la sección). Los que están anidados van dentro del panel de arriba.\n\n${lines.join("\n")}`;
  },

  ({ block, context }) =>
    block.repeat
      ? `## Se repite con datos\n\nEsta sección se repite una vez por cada elemento de la lista ${context.sourcePath(block.repeat.sourceId, block.repeat.path)}.`
      : null,

  (input) => {
    const used = variablesUsed(input);
    return used.length ? `## Variables de diseño usadas\n\n${bullets(used.map((v) => `\`--${v.name}\` = ${v.value} (${v.kind})`))}\n\nConviene mantenerlas como variables (CSS custom properties o los tokens del proyecto), no como valores sueltos.` : null;
  },

  ({ block }) => {
    const rules = [block.hiddenOn?.length ? `Oculta en: ${block.hiddenOn.join(", ")}.` : null, block.responsive && Object.keys(block.responsive).length ? `Tiene un diseño propio, ajustado a mano, para: ${Object.keys(block.responsive).join(", ")}. En el resto se adapta solo (se reduce en proporción o se apila en una columna).` : null].filter(Boolean) as string[];
    return rules.length ? `## Responsive\n\n${bullets(rules)}` : null;
  },

  ({ block, context }) => {
    const list = block.behaviors ?? [];
    return list.length ? `## Interacciones\n\n${bullets(list.map((b) => `${TRIGGERS[b.trigger]}: ${ACTIONS[b.action.kind](b.action as never, context)}`))}` : null;
  },

  ({ block }) =>
    block.code ? `## Código propio de la sección\n\n\`\`\`html\n${block.code.html}\n\`\`\`\n\`\`\`css\n${block.code.css}\n\`\`\`\n\`\`\`js\n${block.code.js}\n\`\`\`${block.code.tailwind ? "\n\nUsa Tailwind CSS." : ""}` : null,

  ({ block }) => {
    const entries = Object.entries(block.custom ?? {});
    return entries.length ? `## Clases y CSS propios\n\n${bullets(entries.map(([key, c]) => `${key === "$section" ? "Sección" : `Elemento ${key}`}: ${[c.classes && `clases \`${c.classes}\``, c.css && `CSS \`${c.css.replace(/\s+/g, " ")}\``].filter(Boolean).join("; ")}`))}` : null;
  },
];

/** La especificación del diseño en Markdown: determinista, sin interpretar nada. */
export function buildSpec(input: SpecInput): string {
  return PARTS.map((part) => part(input)).filter((text): text is string => text !== null).join("\n\n");
}

/**
 * Sugerencias del editor: al escribir `var(--` salen las variables del proyecto y en `class="…"` las clases de
 * Tailwind que esas variables generan (`bg-primario`). En TypeScript, las funciones y `api` salen de sus tipos.
 */

import type { Monaco } from "@monaco-editor/react";
import type { IPosition, editor } from "monaco-editor";
import type { Variable } from "../styles/types";

/** Un elemento de la sección al que el CSS puede apuntar. */
export interface TargetElement {
  id: string;
  label: string;
}

let current: { variables: Variable[]; elements: TargetElement[] } = { variables: [], elements: [] };
let registered = false;

/** Las variables que el editor sugiere en CSS y en clases; se actualiza al cambiar las variables del proyecto. */
export function updateCompletionContext(next: { variables: Variable[]; elements: TargetElement[] }) {
  current = next;
}

/** Qué clases de Tailwind genera cada familia de variables: `--color-primario` → `bg-primario`, `text-primario`… */
const UTILITIES: { prefix: string; utilities: string[] }[] = [
  { prefix: "color-", utilities: ["bg", "text", "border", "ring", "fill", "stroke", "outline"] },
  { prefix: "font-", utilities: ["font"] },
  { prefix: "radius-", utilities: ["rounded"] },
];

const beforeCursor = (model: editor.ITextModel, line: number, column: number) =>
  model.getLineContent(line).slice(0, column - 1);

/** Registra las sugerencias una sola vez; después solo cambia `current`. */
export function registerCompletions(monaco: Monaco) {
  if (registered) return;
  registered = true;
  const { CompletionItemKind } = monaco.languages;

  monaco.languages.registerCompletionItemProvider("css", {
    triggerCharacters: ["-", "(", " "],
    provideCompletionItems(model: editor.ITextModel, position: IPosition) {
      const before = beforeCursor(model, position.lineNumber, position.column);
      const inVar = /var\(\s*(--[\w-]*)?$/.exec(before);
      const word = model.getWordUntilPosition(position);
      const typed = inVar?.[1]?.length ?? 0;

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: position.column,
      };
      // Los elementos de la sección, ya con su selector: «bot» sugiere el Botón y escribe `& [data-el="…"] { }`.
      const elements = inVar
        ? []
        : current.elements.map((element) => ({
            label: `${element.label} (elemento)`,
            filterText: element.label,
            kind: CompletionItemKind.Snippet,
            detail: "Estilos de este elemento",
            insertText: `& [data-el="${element.id}"] {\n\t$0\n}`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          }));

      return {
        suggestions: [
          ...elements,
          ...current.variables.map((variable) => ({
          label: `--${variable.name}`,
          kind: variable.kind === "color" ? CompletionItemKind.Color : CompletionItemKind.Variable,
          detail: variable.value,
          documentation: "Variable del proyecto",
          // Dentro de `var(` solo se completa el nombre; fuera, se escribe la llamada completa.
          insertText: inVar ? `--${variable.name}` : `var(--${variable.name})`,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: inVar ? position.column - typed : word.startColumn,
            endColumn: position.column,
          },
        })),
        ],
      };
    },
  });

  monaco.languages.registerCompletionItemProvider("html", {
    triggerCharacters: ['"', " ", "-"],
    provideCompletionItems(model: editor.ITextModel, position: IPosition) {
      const before = beforeCursor(model, position.lineNumber, position.column);
      if (!/class\s*=\s*"[^"]*$/.test(before)) return { suggestions: [] };

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: position.column,
      };

      return {
        suggestions: current.variables.flatMap((variable) => {
          const family = UTILITIES.find(({ prefix }) => variable.name.startsWith(prefix));
          if (!family) return [];
          const short = variable.name.slice(family.prefix.length);
          return family.utilities.map((utility) => ({
            label: `${utility}-${short}`,
            kind: CompletionItemKind.Value,
            detail: `--${variable.name} · ${variable.value}`,
            documentation: "Clase de Tailwind que usa una variable del proyecto",
            insertText: `${utility}-${short}`,
            range,
          }));
        }),
      };
    },
  });
}

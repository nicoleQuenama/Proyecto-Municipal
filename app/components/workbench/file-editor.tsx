"use client";

import Editor, { loader, type Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditor, Selection, Uri } from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import { useDebounced } from "../code/use-debounced";
import { resolveCdnVersion } from "../libraries/cdn";
import { declaredName, extractFunction, functionsFor, FUNCTION_NAME } from "../functions/scope";
import { cssProblem } from "../site/custom-code";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { FunctionScope } from "../site/types";
import { registerCompletions, updateCompletionContext } from "./completions";
import { configureTypescript, setProjectTypes } from "./typescript-setup";
import { unwrapDeclarations, wrapDeclarations, wrapperLines } from "./css-wrapper";
import { fileId, kindOf, type FileKindName, type FileRef } from "./file-ref";
import { fileTarget } from "./file-target";
import { HtmlOutline } from "./html-outline";
import { fragmentCode } from "./block-fragment";
import { adoptExternal } from "./external-change";
import { CHOICES, MakeBlock, type BlockChoice } from "./make-block";
import { MakeFunction, SCOPE_LABELS } from "./make-function";
import { TargetBar } from "./target-bar";

// Monaco se sirve desde este mismo proyecto (app/api/vendor/monaco), sin depender de un CDN.
loader.config({ paths: { vs: "/api/vendor/monaco" } });

const SAVE_DELAY_MS = 180;

export interface LineRange {
  startLine: number;
  endLine: number;
}

/** Los archivos cuyo contenido son declaraciones sueltas: se muestran dentro de un bloque `& { }` (ver css-wrapper.ts). */
const WRAPPED_KINDS: ReadonlySet<FileKindName> = new Set(["custom-css", "component-css"]);

/** Un ejemplo para empezar en cada tipo de archivo vacío (se ve en gris y desaparece al escribir). */
const PLACEHOLDERS: Partial<Record<FileKindName, string>> = {
  "custom-css": "/* p. ej.: display: flex; gap: 8px; color: var(--color-primario); */",
  "component-css": "/* Vale en todos los lugares donde se use este componente. p. ej.: display: flex; gap: 8px; */",
  "page-css": "/* Estilos de esta página, p. ej.: */\n:scope { background: var(--color-fondo); }",
  "global-css": "/* Estilos de todo el sitio, p. ej.: */\nh1 { color: var(--color-primario); }",
  "page-js": '// Se ejecuta al abrir la página en «Probar».\napi.log("Página lista");',
  "behavior-js": '// Se ejecuta con la interacción. «element» es este destino:\nelement.classList.toggle("activo");\napi.animate("bounce");',
};
const MIN_SELECTION = 2;

interface SelectionInfo {
  text: string;
  range: Selection;
  top: number;
  left: number;
}

const sameScope = (a: FunctionScope, b: FunctionScope) => JSON.stringify(a) === JSON.stringify(b);

/** Lo que se escribe en la barra de estado del archivo. */
function Status({ problem, saving, message }: { problem: string | null; saving: boolean; message: string | null }) {
  return (
    <>
      {problem && <span className="text-red-400">{problem} (no se aplica hasta corregirlo)</span>}
      {message && <span className="text-emerald-400">{message}</span>}
      <span className="ml-auto text-ink-dim">{saving ? "Guardando…" : "Guardado"}</span>
    </>
  );
}

/** Cambiar dónde vale una función ya creada. */
function ScopeSelect({ file }: { file: Extract<FileRef, { kind: "function" }> }) {
  const { functions } = useSite();
  const dispatch = useSiteDispatch();
  const fn = functions.find((f) => f.id === file.functionId);
  if (!fn) return null;

  // Solo se puede ir hacia alcances más amplios que conoce: global, y la sección o el elemento de origen.
  const options: FunctionScope[] = [{ kind: "global" }];
  if (fn.scope.kind !== "global") options.push({ kind: "block", blockId: fn.scope.blockId });
  if (fn.scope.kind === "element") options.push(fn.scope);

  return (
    <label className="flex items-center gap-1.5 text-ink-dim">
      Alcance
      <select
        aria-label="Alcance de la función"
        value={options.findIndex((scope) => sameScope(scope, fn.scope))}
        onChange={(e) => dispatch({ type: "function/save", fn: { ...fn, scope: options[Number(e.target.value)] } })}
        className="h-6 rounded border border-line bg-canvas px-1 text-xs text-ink [&>option]:bg-panel"
      >
        {options.map((scope, index) => (
          <option key={scope.kind} value={index}>{SCOPE_LABELS[scope.kind]}</option>
        ))}
      </select>
    </label>
  );
}

/** El editor de un archivo: Monaco a tamaño completo, con guardado automático y sugerencias del proyecto. */
export default function FileEditor({
  file,
  onCursorLine,
  highlightRange,
}: {
  file: FileRef;
  /** La línea donde está el cursor o el puntero, para resaltar lo mismo en la vista previa. */
  onCursorLine?: (line: number | null) => void;
  /** Las líneas del elemento elegido en la vista previa. */
  highlightRange?: LineRange | null;
}) {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const kind = kindOf(file);
  const path = fileId(file);

  const [draft, setDraft] = useState(() => kind.read(site, file));
  const [initialDraft] = useState(draft);
  const [saved, setSaved] = useState(draft);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  /** Paquetes que el código importa pero el proyecto aún no tiene. */
  const [missing, setMissing] = useState<string[]>([]);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  // El aviso de la línea que se señala cambia sin volver a montar Monaco: se lee siempre el último.
  const cursorListener = useRef(onCursorLine);
  useEffect(() => {
    cursorListener.current = onCursorLine;
  }, [onCursorLine]);
  const picked = useRef<{ collection: MonacoEditor.IEditorDecorationsCollection; line: number } | null>(null);
  // Lo último que vio este editor, para guardar desde Ctrl+S y desde el guardado automático sin repetir efectos.
  const latest = useRef({ draft, saved, site, file });
  useEffect(() => {
    latest.current = { draft, saved, site, file };
  });

  // Un cambio hecho fuera del editor (el modal «Contenido», deshacer…) se muestra aquí, en lugar de pisarse al guardar.
  const stored = kind.read(site, file);
  useEffect(() => {
    const external = adoptExternal(stored, latest.current.saved);
    if (external === null) return;
    setDraft(external);
    setSaved(external);
    // Solo cuando cambia lo guardado en el sitio; lo que el editor escribe él mismo ya coincide con `saved`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  /** Guarda lo escrito si cambió. */
  const flush = () => {
    const { draft: value, saved: last, site: current, file: target } = latest.current;
    if (value === last) return;
    dispatch(kindOf(target).write(current, target, value));
    setSaved(value);
  };

  // Guardado automático: al dejar de escribir medio segundo.
  const debounced = useDebounced(draft, SAVE_DELAY_MS);
  useEffect(() => {
    if (debounced === draft) flush();
    // `flush` lee lo último desde una referencia: no hace falta que sea dependencia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, draft]);

  const target = fileTarget(site, file);
  const wrapped = WRAPPED_KINDS.has(file.kind);

  // Qué sabe el editor del proyecto: sus variables, los elementos de la sección y, para TypeScript,
  // las funciones que este archivo puede llamar.
  const syncProject = () => {
    const callSite = kind.callSite(site, file);
    updateCompletionContext({ variables: site.variables, elements: target?.elements ?? [] });
    setProjectTypes(callSite ? functionsFor(site.functions, callSite) : [], site.libraries);
  };
  useEffect(syncProject);

  const onMount = (editor: MonacoEditor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;

    // El bloque `& { }` se ve atenuado y el cursor empieza dentro de él.
    if (wrapped) {
      const markers = editor.createDecorationsCollection();
      const mark = () => {
        const count = editor.getModel()?.getLineCount() ?? 1;
        markers.set(
          wrapperLines(count).map((line) => ({
            range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1000 },
            options: { isWholeLine: true, inlineClassName: "editor-wrapper-text" },
          })),
        );
      };
      mark();
      editor.onDidChangeModelContent(mark);
      if (editor.getModel()?.getLineCount() === 3) editor.setPosition({ lineNumber: 2, column: 1 });
      editor.focus();
    }
    registerCompletions(monaco);
    syncProject();
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, flush);

    // La línea bajo el cursor o el puntero se avisa una sola vez por línea, para resaltarla en la vista previa.
    let lastLine: number | null = null;
    const reportLine = (line: number | null) => {
      if (line === lastLine) return;
      lastLine = line;
      cursorListener.current?.(line);
    };
    editor.onDidChangeCursorPosition(({ position }) => reportLine(position.lineNumber));
    editor.onMouseMove((event) => reportLine(event.target.position?.lineNumber ?? null));
    editor.onMouseLeave(() => reportLine(null));
    editor.onDidDispose(() => reportLine(null));

    // Si el código importa un paquete que el proyecto no tiene, se ofrece añadirlo en lugar de dejar solo el error.
    const model = editor.getModel();
    if (model) {
      const scan = () => {
        const markers: MonacoEditor.IMarker[] = monaco.editor.getModelMarkers({ resource: model.uri });
        const names = markers
          .map((marker) => /Cannot find module '([^']+)'/.exec(marker.message)?.[1])
          .filter((name): name is string => name !== undefined && !name.startsWith(".") && !name.startsWith("/"));
        setMissing([...new Set(names)]);
      };
      const listener = monaco.editor.onDidChangeMarkers((uris: readonly Uri[]) => {
        if (uris.some((uri) => uri.toString() === model.uri.toString())) scan();
      });
      editor.onDidDispose(() => listener.dispose());
    }

    // Al seleccionar código aparece, bajo la selección, la opción de convertirlo en función.
    editor.onDidChangeCursorSelection(({ selection: range }) => {
      const text = editor.getModel()?.getValueInRange(range) ?? "";
      const at = editor.getScrolledVisiblePosition(range.getEndPosition());
      if (range.isEmpty() || text.trim().length < MIN_SELECTION || !at) return setSelection(null);

      setMessage(null);
      setSelection({ text, range, top: at.top + at.height + 6, left: at.left });
    });
  };

  // El elemento elegido en la vista previa se marca en el código y se trae a la pantalla.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    picked.current?.collection.clear();
    picked.current = null;
    if (!highlightRange) return;

    const start = Math.max(1, Math.min(highlightRange.startLine, highlightRange.endLine));
    const end = Math.max(start, highlightRange.startLine, highlightRange.endLine);
    const collection = editor.createDecorationsCollection([
      {
        range: { startLineNumber: start, startColumn: 1, endLineNumber: end, endColumn: 1000 },
        options: { isWholeLine: true, className: "editor-picked-line" },
      },
    ]);
    picked.current = { collection, line: start };
    editor.revealLineInCenter(start);
  }, [highlightRange]);

  const create = (scope: FunctionScope, name: string): string | null => {
    if (!FUNCTION_NAME.test(name)) return "Usa letras, números, _ o $, sin empezar por un número.";
    if (site.functions.some((fn) => fn.name === name && sameScope(fn.scope, scope))) {
      return "Ya hay una función con ese nombre en ese alcance.";
    }
    if (!selection) return "Vuelve a seleccionar el código.";

    // En lugar de lo seleccionado queda la llamada (o nada, si ya era una función completa).
    const { code, call } = extractFunction(selection.text, name);
    dispatch({ type: "function/save", fn: { id: crypto.randomUUID(), name, code, scope } });
    // Si se seleccionaron líneas completas, la llamada conserva el salto de línea de la última.
    const lineBreak = call && selection.text.endsWith("\n") ? "\n" : "";
    editorRef.current?.executeEdits("hacer-funcion", [{ range: selection.range, text: call + lineBreak }]);

    setSelection(null);
    setMessage(`Función «${name}» creada: ${SCOPE_LABELS[scope.kind].toLowerCase()}.`);
    return null;
  };

  /** La página a la que pertenece el archivo; sin ella (CSS global, funciones) no hay dónde poner un bloque. */
  const ownerPageId = "pageId" in file ? file.pageId : null;

  /**
   * Guarda lo seleccionado como componente o plantilla. Un componente o una plantilla de sección pasan a un bloque
   * nuevo de la página y se quitan del archivo; una plantilla de página es solo una copia y el código se queda.
   */
  const createBlock = (choice: BlockChoice, name: string): string | null => {
    if (!selection || !ownerPageId) return "Vuelve a seleccionar el código.";

    const { kind: blockKind, scope, label } = CHOICES[choice];
    dispatch({
      type: "page/add-code-block",
      pageId: ownerPageId,
      kind: blockKind,
      scope,
      name,
      blockId: crypto.randomUUID(),
      code: fragmentCode(kind.language, selection.text),
    });
    if (scope === "section") editorRef.current?.executeEdits("hacer-bloque", [{ range: selection.range, text: "" }]);

    setSelection(null);
    setMessage(`${label} «${name}» guardada${scope === "page" ? ": está en Plantillas › Páginas." : " en la página."}`);
    return null;
  };

  /** Añade al proyecto, desde el CDN, un paquete que el código importa. */
  const addMissing = async (name: string) => {
    try {
      const version = await resolveCdnVersion(name, "");
      dispatch({ type: "library/add", library: { id: crypto.randomUUID(), name, version, source: "cdn" } });
      setMessage(`Librería «${name}» ${version} añadida.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo añadir la librería.");
    }
  };

  /** Escribe en el editor, donde está el cursor (o en lugar de lo seleccionado). */
  const insertAtCursor = (text: string) => {
    const editor = editorRef.current;
    const range = editor?.getSelection();
    if (!editor || !range) return;
    editor.executeEdits("insertar-selector", [{ range, text, forceMoveMarkers: true }]);
    editor.focus();
  };

  const scopes = kind.scopes(site, file);
  const problem = kind.language === "css" ? cssProblem(draft) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {target && <TargetBar file={file} language={kind.language} target={target} />}
      <div className="flex min-h-0 flex-1">
      <div className="relative min-h-0 min-w-0 flex-1">
        {draft === "" && PLACEHOLDERS[file.kind] && (
          <pre className={`pointer-events-none absolute left-[68px] z-10 font-mono text-[13px] leading-[19px] text-ink-dim/50 ${wrapped ? "top-[31px]" : "top-3"}`}>
            {PLACEHOLDERS[file.kind]}
          </pre>
        )}
        <Editor
          height="100%"
          theme="vs-dark"
          path={path}
          language={kind.language}
          // Sin `value`: el editor es dueño de su texto. Con `value`, si React se retrasaba y llegaba otra tecla antes
          // de repintar, el editor volvía a poner un texto viejo y el cursor saltaba al final.
          defaultValue={wrapped ? wrapDeclarations(initialDraft) : initialDraft}
          onChange={(value) => setDraft(wrapped ? unwrapDeclarations(value ?? "") : (value ?? ""))}
          beforeMount={configureTypescript}
          onMount={onMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            tabSize: 2,
            wordWrap: "off",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            quickSuggestions: { other: true, comments: false, strings: true },
          }}
        />

        {selection && (scopes.length > 0 || ownerPageId) && (
          <div
            className="absolute z-30 flex w-72 flex-col gap-1"
            style={{ top: selection.top, left: Math.max(8, selection.left) }}
            // Pulsar aquí no debe quitar la selección del editor.
            onMouseDown={(e) => e.target instanceof HTMLInputElement || e.preventDefault()}
            // key: cada selección nueva empieza con los formularios cerrados y el nombre que le toca.
            key={`${selection.range.startLineNumber}:${selection.range.startColumn}:${selection.range.endLineNumber}:${selection.range.endColumn}`}
          >
            {scopes.length > 0 && (
              <MakeFunction scopes={scopes} initialName={declaredName(selection.text) ?? "miFuncion"} onCreate={create} />
            )}
            {ownerPageId && <MakeBlock initialName="Bloque nuevo" pageCode={file.kind === "page-js" || file.kind === "page-css"} onCreate={createBlock} />}
          </div>
        )}
      </div>
      {target && target.outline.length > 0 && (
        <HtmlOutline lines={target.outline} language={kind.language} nested={wrapped} onInsert={insertAtCursor} />
      )}
      </div>

      <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-line bg-canvas px-3 text-[11px]">
        <span className="text-ink-dim">{kindOf(file).name(site, file)} · {kind.language}</span>
        {file.kind === "function" && <ScopeSelect file={file} />}
        {missing.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => addMissing(name)}
            className="rounded bg-accent/25 px-2 py-0.5 text-accent hover:bg-accent hover:text-white cursor-pointer"
          >
            Falta «{name}»: añadir desde el CDN
          </button>
        ))}
        <Status problem={problem} saving={draft !== saved} message={message} />
      </footer>
    </div>
  );
}

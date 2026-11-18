"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { useSite } from "../site/site-context";
import { Modal } from "../ui/modal";
import { BlockPreview, type CodePick } from "./block-preview";
import { ConsoleHost } from "./console-host";
import { Explorer } from "./explorer";
import { SitePreview } from "./site-preview";
import { fileId, kindOf, type FileKindName, type FileRef } from "./file-ref";
import { useExplorerCollapsed } from "./use-explorer-collapsed";
import { useWorkbench } from "./workbench-context";
import { PanelCollapseIcon } from "../viewport/icons";

// Monaco necesita el navegador: el editor se carga solo allí.
const FileEditor = dynamic(() => import("./file-editor"), {
  ssr: false,
  loading: () => <p className="p-6 text-xs text-ink-dim">Cargando el editor…</p>,
});

/** Los archivos que se ven en vivo junto al editor: los de un bloque de código. */
const PREVIEWED: ReadonlySet<FileKindName> = new Set(["block-html", "block-css", "block-js"]);

/** Ancho de la vista previa (en % de la fila), dentro de los límites que deja espacio a ambos paneles. */
const MIN_PREVIEW = 20;
const MAX_PREVIEW = 80;
const DEFAULT_PREVIEW = 40;
const KEY_STEP = 2;

const clampPreview = (value: number) => Math.min(MAX_PREVIEW, Math.max(MIN_PREVIEW, value));

/**
 * La barra divisoria entre el editor y la vista previa: se arrastra con el ratón o se mueve con las flechas
 * (con Shift, más rápido; doble clic, vuelve al ancho de fábrica).
 */
function SplitBar({
  value,
  onChange,
  containerRef,
}: {
  value: number;
  onChange: (preview: number) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [dragging, setDragging] = useState(false);

  const startResize = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const moveResize = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    onChange(clampPreview(((rect.right - e.clientX) / rect.width) * 100));
  };
  const stopResize = () => setDragging(false);
  const resizeWithKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? KEY_STEP * 5 : KEY_STEP;
    if (e.key === "ArrowLeft") onChange(clampPreview(value + step));
    else if (e.key === "ArrowRight") onChange(clampPreview(value - step));
    else return;
    e.preventDefault();
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Cambiar el ancho de la vista previa"
      aria-valuenow={Math.round(value)}
      aria-valuemin={MIN_PREVIEW}
      aria-valuemax={MAX_PREVIEW}
      tabIndex={0}
      title="Arrastra para cambiar el ancho (doble clic: restablecer)"
      onPointerDown={startResize}
      onPointerMove={moveResize}
      onPointerUp={stopResize}
      onPointerCancel={stopResize}
      onDoubleClick={() => onChange(DEFAULT_PREVIEW)}
      onKeyDown={resizeWithKeys}
      className={`w-1.5 shrink-0 cursor-col-resize touch-none outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 ${
        dragging ? "bg-accent/50" : ""
      }`}
    />
  );
}

/** El archivo abierto y su vista previa. La clave de este componente es el archivo: cada uno empieza limpio. */
function ActiveFile({
  file,
  preview,
  onPreview,
}: {
  file: FileRef;
  preview: number;
  onPreview: (value: number) => void;
}) {
  const [cursorLine, setCursorLine] = useState<number | null>(null);
  const [pick, setPick] = useState<CodePick | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={rowRef} className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* key: cada archivo tiene su propio editor, con su historial de deshacer. */}
        <FileEditor key={fileId(file)} file={file} onCursorLine={setCursorLine} highlightRange={pick} />
      </div>

      <SplitBar value={preview} onChange={onPreview} containerRef={rowRef} />

      <div className="flex min-w-0 flex-col" style={{ width: `${preview}%` }}>
        {/* Un bloque de código se ve aislado; todo lo demás (CSS, TypeScript…) se ve en la página real. */}
        {PREVIEWED.has(file.kind) ? (
          <BlockPreview
            key={`preview:${fileId(file)}`}
            file={file as Extract<FileRef, { blockId: string }>}
            hoverLine={cursorLine}
            onPick={setPick}
          />
        ) : (
          <SitePreview pageId={"pageId" in file ? file.pageId : null} />
        )}
      </div>
    </div>
  );
}

function Workbench() {
  const site = useSite();
  const { tabs, activeId, activate, closeTab, openFile, close } = useWorkbench();
  const [explorerHidden, toggleExplorer] = useExplorerCollapsed();
  // El ancho de la vista previa (en % de la fila): se arrastra con la barra divisoria y se recuerda mientras el editor siga abierto.
  const [previewWidth, setPreviewWidth] = useState(DEFAULT_PREVIEW);

  // Las pestañas de lo que ya no existe (una función quitada, un bloque eliminado) no se muestran.
  const open = tabs.filter((tab) => kindOf(tab).name(site, tab) !== null);
  const active = open.find((tab) => fileId(tab) === activeId) ?? null;

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex h-10 shrink-0 items-center gap-3 border-b border-line bg-panel px-4">
        <button
          type="button"
          aria-label={explorerHidden ? "Mostrar el explorador de archivos" : "Ocultar el explorador de archivos"}
          aria-pressed={!explorerHidden}
          title="Mostrar u ocultar el explorador (Ctrl+B)"
          onClick={toggleExplorer}
          className="-ml-2 flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink cursor-pointer"
        >
          <PanelCollapseIcon collapsed={explorerHidden} />
        </button>
        <h2 className="text-sm font-semibold">Editor de código</h2>
        <span className="text-xs text-ink-dim">Los cambios se guardan solos</span>
        <button
          type="button"
          aria-label="Cerrar el editor"
          title="Cerrar el editor (Esc)"
          onClick={close}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink cursor-pointer"
        >
          ×
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {!explorerHidden && <Explorer active={active} />}

        <div className="flex min-w-0 flex-1 flex-col">
          <div role="tablist" aria-label="Archivos abiertos" className="flex h-9 shrink-0 overflow-x-auto border-b border-line bg-panel">
            {open.map((tab) => {
              const selected = active !== null && fileId(tab) === fileId(active);
              return (
                <div
                  key={fileId(tab)}
                  className={`group/tab flex shrink-0 items-center border-r border-line text-xs ${
                    selected ? "bg-canvas text-ink" : "text-ink-dim hover:text-ink"
                  }`}
                >
                  <button type="button" role="tab" aria-selected={selected} onClick={() => activate(tab)} className="h-9 pr-1 pl-3 cursor-pointer">
                    {kindOf(tab).name(site, tab)}
                  </button>
                  <button
                    type="button"
                    aria-label={`Cerrar ${kindOf(tab).name(site, tab)}`}
                    onClick={() => closeTab(tab)}
                    className="mr-1 flex h-5 w-5 items-center justify-center rounded text-ink-dim hover:bg-hover hover:text-ink cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <ConsoleHost>
            <div className="flex min-h-0 flex-1">
              {active ? (
                <ActiveFile key={fileId(active)} file={active} preview={previewWidth} onPreview={setPreviewWidth} />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-ink-dim">
                  <p>Abre un archivo del explorador para empezar.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => openFile()}
                      className="rounded-md bg-hover px-3 py-1.5 text-xs text-ink hover:bg-accent hover:text-white cursor-pointer"
                    >
                      Abrir el código de la página actual
                    </button>
                    <button
                      type="button"
                      onClick={() => openFile({ kind: "global-css" })}
                      className="rounded-md bg-hover px-3 py-1.5 text-xs text-ink hover:bg-accent hover:text-white cursor-pointer"
                    >
                      Abrir estilos-globales.css
                    </button>
                  </div>
                </div>
              )}
            </div>
          </ConsoleHost>
        </div>
      </div>
    </div>
  );
}

/** El editor de código a pantalla completa, como un editor de escritorio. Se abre con el icono ‹› o con Ctrl+E. */
export function WorkbenchHost() {
  const { open, close } = useWorkbench();
  const { currentUser } = useAuth();
  if (!open || !hasPermission(currentUser, "editCode")) return null;

  return (
    <Modal label="Editor de código" size="full" onClose={close}>
      <Workbench />
    </Modal>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { useSite } from "../site/site-context";
import { Modal } from "../ui/modal";
import { BlockPreview, type CodePick } from "./block-preview";
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

/** El archivo abierto y su vista previa. La clave de este componente es el archivo: cada uno empieza limpio. */
function ActiveFile({ file }: { file: FileRef }) {
  const [cursorLine, setCursorLine] = useState<number | null>(null);
  const [pick, setPick] = useState<CodePick | null>(null);

  return (
    <>
      {/* key: cada archivo tiene su propio editor, con su historial de deshacer. */}
      <FileEditor key={fileId(file)} file={file} onCursorLine={setCursorLine} highlightRange={pick} />
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
    </>
  );
}

function Workbench() {
  const site = useSite();
  const { tabs, activeId, activate, closeTab, openFile, close } = useWorkbench();
  const [explorerHidden, toggleExplorer] = useExplorerCollapsed();

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
          className="-ml-2 flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink"
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
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink"
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
                  <button type="button" role="tab" aria-selected={selected} onClick={() => activate(tab)} className="h-9 pr-1 pl-3">
                    {kindOf(tab).name(site, tab)}
                  </button>
                  <button
                    type="button"
                    aria-label={`Cerrar ${kindOf(tab).name(site, tab)}`}
                    onClick={() => closeTab(tab)}
                    className="mr-1 flex h-5 w-5 items-center justify-center rounded text-ink-dim hover:bg-hover hover:text-ink"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex min-h-0 flex-1">
            {active ? (
              <ActiveFile key={fileId(active)} file={active} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-ink-dim">
                <p>Abre un archivo del explorador para empezar.</p>
                <button
                  type="button"
                  onClick={() => openFile({ kind: "global-css" })}
                  className="rounded-md bg-hover px-3 py-1.5 text-xs text-ink hover:bg-accent hover:text-white"
                >
                  Abrir estilos-globales.css
                </button>
              </div>
            )}
          </div>
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

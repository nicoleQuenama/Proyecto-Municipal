"use client";

import { useState } from "react";
import type { BlockInstance, ComponentDef } from "../site/types";
import { ExportDialog } from "./export-dialog";

/** El botón «Exportar» de la sección seleccionada (solo para quien puede abrir el código). */
export function ExportButton({ pageId, block, def }: { pageId: string; block: BlockInstance; def: ComponentDef }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Exportar el diseño para tu IA"
        title="Exportar el diseño como mensaje para Claude Code, Codex, opencode u otro modelo"
        onClick={() => setOpen(true)}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-medium hover:bg-hover"
      >
        Exportar
      </button>
      {open && <ExportDialog pageId={pageId} block={block} def={def} onClose={() => setOpen(false)} />}
    </>
  );
}

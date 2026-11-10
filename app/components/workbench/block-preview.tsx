"use client";

import { useCallback, useMemo, useState } from "react";
import { CodeFrame } from "../code/code-frame";
import type { ElementHighlight, ElementPick } from "../code/messages";
import { useSharedAssets } from "../code/use-shared-assets";
import { useSite } from "../site/site-context";
import type { CodeSource } from "../site/types";
import type { FileRef } from "./file-ref";
import { usePreviewZoom } from "./use-preview-zoom";
import { ZoomBar } from "./zoom-bar";
import { buildSourceMap, nodeAtLine, selectorAtLine } from "./source-map";

type BlockFile = Extract<FileRef, { blockId: string }>;

export interface CodePick {
  startLine: number;
  endLine: number;
  tag: string;
  html: string;
}

const FIELD: Partial<Record<BlockFile["kind"], keyof Pick<CodeSource, "html" | "css" | "js">>> = {
  "block-html": "html",
  "block-css": "css",
  "block-js": "js",
};

/**
 * La vista previa de un bloque de código (su consola está en el panel de abajo del editor). Al pasar por una línea del editor se resalta
 * el elemento que dibuja, y al pulsar un elemento de la vista se muestran sus líneas de HTML.
 */
export function BlockPreview({
  file,
  hoverLine,
  onPick,
}: {
  file: BlockFile;
  hoverLine: number | null;
  onPick: (pick: CodePick | null) => void;
}) {
  const { libraries, pages } = useSite();
  const shared = useSharedAssets(file.blockId);
  const block = pages.find((page) => page.id === file.pageId)?.blocks.find((item) => item.id === file.blockId);

  const [peek, setPeek] = useState<{ tag: string; html: string } | null>(null);

  // Un bloque se ve a tamaño real (100%) hasta que se acerque o se aleje.
  const zoom = usePreviewZoom(1);

  const sourceMap = useMemo(() => buildSourceMap(block?.code?.html ?? ""), [block?.code?.html]);
  const field = FIELD[file.kind];

  const highlight = useMemo<ElementHighlight | null>(() => {
    if (hoverLine === null || !block?.code) return null;
    if (file.kind === "block-html") {
      const node = nodeAtLine(sourceMap, hoverLine);
      return node ? { path: node.path, kind: "hover" } : null;
    }
    if (file.kind === "block-css") {
      const selector = selectorAtLine(block.code.css, hoverLine);
      return selector ? { selector, kind: "hover" } : null;
    }
    return null;
  }, [hoverLine, file.kind, sourceMap, block]);

  const handleElement = useCallback(
    (event: ElementPick) => {
      if (event.action !== "select") return;
      const node = sourceMap.byPath.get(event.path);
      const tag = event.tag ?? node?.tagName ?? "elemento";
      const html = event.html ?? node?.outerHtml ?? "";
      setPeek({ tag, html });
      onPick(
        file.kind === "block-html" && node
          ? { startLine: node.startLine, endLine: node.endLine, tag, html }
          : null,
      );
    },
    [file.kind, onPick, sourceMap],
  );

  if (!block?.code || !field) return null;

  const code: CodeSource = block.code;

  return (
    <aside aria-label="Vista previa" className="flex w-[40%] min-w-72 flex-col border-l border-line bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-1 text-[11px] text-neutral-500">
        <span className="truncate">Vista previa en vivo</span>
        <ZoomBar zoom={zoom} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div style={{ zoom: zoom.zoom }}>
        <CodeFrame
          code={code}
          libraries={libraries}
          shared={shared}
          title="Vista previa del código"
          onElement={handleElement}
          highlight={highlight}
        />
        </div>
      </div>

      {peek && (
        <div className="max-h-32 shrink-0 overflow-auto border-t border-line bg-panel px-3 py-2">
          <div className="flex items-center gap-2">
            <code className="rounded bg-accent/20 px-1.5 py-0.5 text-[11px] text-accent">&lt;{peek.tag}&gt;</code>
            <button
              type="button"
              onClick={() => {
                setPeek(null);
                onPick(null);
              }}
              className="ml-auto rounded px-1.5 text-xs text-ink-dim hover:bg-hover hover:text-ink cursor-pointer"
            >
              ×
            </button>
          </div>
          <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-ink-dim">{peek.html}</pre>
        </div>
      )}
    </aside>
  );
}

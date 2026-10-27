"use client";

import { useState } from "react";
import { CopyButton, DownloadButton } from "./copy-button";
import { TOOLS, TOOL_IDS, type ToolId } from "./skills";

/** Las reglas permanentes: se instalan una vez en el proyecto y los mensajes de cada diseño quedan cortos. */
export function SkillTab() {
  const [tool, setTool] = useState<ToolId>("claude-code");
  const target = TOOLS[tool];

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Herramienta" className="flex flex-wrap gap-2">
        {TOOL_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={tool === id}
            onClick={() => setTool(id)}
            className={`h-8 rounded-md border px-3 text-xs ${tool === id ? "border-accent bg-accent/10 text-accent" : "border-line hover:bg-hover"}`}
          >
            {TOOLS[id].label}
          </button>
        ))}
      </div>

      <p className="text-xs text-ink-dim">{target.install}</p>
      {target.path && (
        <p className="text-xs">
          Archivo: <code className="rounded bg-hover px-1.5 py-0.5">{target.path}</code>
        </p>
      )}

      <div className="flex items-center gap-2">
        <CopyButton text={target.content} />
        {target.path && <DownloadButton text={target.content} filename={target.path.split("/").pop() ?? "reglas.md"} />}
      </div>
      <textarea readOnly aria-label="Reglas" value={target.content} onFocus={(e) => e.currentTarget.select()} className="h-72 w-full resize-none rounded-md border border-line bg-canvas p-3 font-mono text-[11px] leading-relaxed outline-none" />
    </div>
  );
}

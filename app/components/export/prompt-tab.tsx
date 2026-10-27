"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "./copy-button";
import { buildPrompt } from "./prompt";
import { TOOLS, TOOL_IDS, type ToolId } from "./skills";
import type { DesignExport } from "./use-export";

/** Por encima de esto muchos modelos pierden detalle o se quedan sin espacio. */
const LONG_PROMPT = 30_000;

/** El mensaje para pegar en tu modelo, completo o corto si ya instalaste la skill. */
export function PromptTab({ design }: { design: DesignExport }) {
  const [installed, setInstalled] = useState<ToolId | null>(null);
  const prompt = useMemo(
    () => buildPrompt({ ...design, installed, assets: design.assets.map((asset) => asset.name) }),
    [design, installed],
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-xs">
        <span className="text-ink-dim">¿Ya instalaste la skill?</span>
        <select
          aria-label="Skill instalada"
          value={installed ?? ""}
          onChange={(e) => setInstalled((e.target.value || null) as ToolId | null)}
          className="h-8 rounded-md border border-line bg-canvas px-2 outline-none [&>option]:bg-panel"
        >
          <option value="">No: incluir las reglas en el mensaje</option>
          {TOOL_IDS.map((id) => (
            <option key={id} value={id}>
              Sí, en {TOOLS[id].label} (mensaje corto)
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2">
        <CopyButton text={prompt} label="Copiar mensaje" />
        <span className="text-[11px] text-ink-dim">{prompt.length.toLocaleString("es")} caracteres</span>
      </div>
      {prompt.length > LONG_PROMPT && (
        <p className="text-xs text-amber-400">Es largo: algunos modelos pierden detalle. Exporta por secciones más pequeñas o instala la skill para acortarlo.</p>
      )}

      <textarea readOnly aria-label="Mensaje para tu modelo" value={prompt} onFocus={(e) => e.currentTarget.select()} className="h-72 w-full resize-none rounded-md border border-line bg-canvas p-3 font-mono text-[11px] leading-relaxed outline-none" />

      {design.assets.length > 0 && (
        <div className="rounded-md bg-hover p-3 text-xs">
          <p className="mb-1 font-medium">Imágenes subidas (no caben en el texto): entrégaselas a tu modelo</p>
          <ul className="flex flex-wrap gap-2">
            {design.assets.map((asset) => (
              <li key={asset.name}>
                <a href={asset.dataUrl} download={asset.name} className="rounded-md border border-line px-2 py-1 hover:bg-canvas">
                  ⬇ {asset.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

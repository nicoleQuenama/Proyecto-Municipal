"use client";

import { useState } from "react";
import type { BlockInstance, ComponentDef } from "../site/types";
import { Modal } from "../ui/modal";
import { CopyButton } from "./copy-button";
import { PromptTab } from "./prompt-tab";
import { SkillTab } from "./skill-tab";
import { useDesignExport } from "./use-export";

type Tab = "prompt" | "skill" | "reference";

const TABS: { id: Tab; label: string }[] = [
  { id: "prompt", label: "Mensaje para tu IA" },
  { id: "skill", label: "Skill / reglas" },
  { id: "reference", label: "Código de referencia" },
];

interface ExportDialogProps {
  pageId: string;
  block: BlockInstance;
  def: ComponentDef;
  onClose: () => void;
}

/** Exportar una sección para que tu propio modelo (Claude Code, Codex, opencode…) la rehaga en tu proyecto. */
export function ExportDialog({ pageId, block, def, onClose }: ExportDialogProps) {
  const [tab, setTab] = useState<Tab>("prompt");
  const design = useDesignExport(pageId, block, def);
  const reference = `${design.reference.html}\n\n<style>\n${design.reference.css}\n</style>`;

  return (
    <Modal label="Exportar el diseño" size="lg" onClose={onClose}>
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Exportar «{def.name}»</h2>
          <p className="mt-0.5 text-xs text-ink-dim">
            El CMS no usa ninguna IA: arma este texto con reglas fijas. Pégalo en el modelo que uses y él lo adapta a tu proyecto.
          </p>
        </div>
        <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink">
          ×
        </button>
      </header>

      <div role="tablist" className="flex gap-1 border-b border-line px-5">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px h-10 border-b-2 px-3 text-xs ${tab === id ? "border-accent font-medium text-accent" : "border-transparent text-ink-dim hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-h-[65vh] overflow-y-auto p-5">
        {tab === "prompt" && <PromptTab design={design} />}
        {tab === "skill" && <SkillTab />}
        {tab === "reference" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-ink-dim">HTML y CSS que reproducen el diseño tal cual, con posiciones absolutas. Es la referencia visual, no código para dejar así.</p>
            <div>
              <CopyButton text={reference} />
            </div>
            <textarea readOnly aria-label="Código de referencia" value={reference} onFocus={(e) => e.currentTarget.select()} className="h-72 w-full resize-none rounded-md border border-line bg-canvas p-3 font-mono text-[11px] leading-relaxed outline-none" />
          </div>
        )}
      </div>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { ACTIONS } from "../behaviors/actions";
import { TRIGGERS } from "../behaviors/triggers";
import type { TriggerKind } from "../behaviors/types";
import { useSite, useSiteDispatch } from "../site/site-context";
import { fileId, type CodeLanguage, type FileRef } from "./file-ref";
import type { FileTarget } from "./file-target";
import { useWorkbench } from "./workbench-context";

/** Cómo funciona el destino en cada lenguaje, en una frase. */
const HOW_IT_WORKS: Record<CodeLanguage, string> = {
  css: "Aquí «&» es este destino: escribe propiedades directamente o «&:hover { … }».",
  typescript: "«element» es este destino y «api.query(…)» busca dentro de la sección.",
  html: "",
};

interface TargetBarProps {
  file: FileRef;
  language: CodeLanguage;
  target: FileTarget;
}

/**
 * La barra sobre el editor: dice a qué se aplica lo que escribes, da el selector ya hecho, deja ponerle nombre
 * a una interacción y saltar entre los archivos del mismo destino.
 */
export function TargetBar({ file, language, target }: TargetBarProps) {
  const { pages } = useSite();
  const dispatch = useSiteDispatch();
  const { openFile } = useWorkbench();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!target.selector) return;
    await navigator.clipboard.writeText(target.selector);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  /** Añade una interacción de código a la sección o elemento y la abre. */
  const addCode = () => {
    if (!target.scope) return;
    const behavior = {
      id: crypto.randomUUID(),
      scope: target.scope.key,
      trigger: "click" as const,
      action: ACTIONS.code.create(pages),
    };
    dispatch({ type: "behavior/save", pageId: target.scope.pageId, blockId: target.scope.blockId, behavior });
    openFile({ kind: "behavior-js", pageId: target.scope.pageId, blockId: target.scope.blockId, behaviorId: behavior.id });
  };

  const behavior =
    file.kind === "behavior-js"
      ? pages.find((p) => p.id === file.pageId)?.blocks.find((x) => x.id === file.blockId)?.behaviors?.find((x) => x.id === file.behaviorId)
      : undefined;
  const rename = (name: string) => {
    if (file.kind !== "behavior-js" || !behavior) return;
    dispatch({ type: "behavior/save", pageId: file.pageId, blockId: file.blockId, behavior: { ...behavior, name } });
  };

  const chip = "h-6 rounded px-2 text-[11px]";
  const hint = HOW_IT_WORKS[language];

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line bg-panel px-3 py-1.5 text-xs">
      <span className="font-medium text-ink">Aplica a: {target.label}</span>

      {target.selector && (
        <button
          type="button"
          onClick={copy}
          title="Copiar el selector"
          className={`${chip} max-w-72 truncate bg-canvas font-mono text-ink-dim hover:text-ink`}
        >
          {copied ? "¡Copiado!" : target.selector}
        </button>
      )}

      {target.siblings.length > 1 && (
        <span role="group" aria-label="Archivos de este destino" className="flex items-center gap-1">
          {target.siblings.map((sibling) => (
            <button
              key={fileId(sibling.ref)}
              type="button"
              aria-pressed={fileId(sibling.ref) === fileId(file)}
              onClick={() => openFile(sibling.ref)}
              className={`${chip} ${
                fileId(sibling.ref) === fileId(file) ? "bg-accent/25 text-accent" : "bg-hover text-ink-dim hover:text-ink"
              }`}
            >
              {sibling.label}
            </button>
          ))}
        </span>
      )}

      {behavior && (
        <label className="flex items-center gap-1.5 text-[11px] text-ink-dim">
          Nombre de este código
          <input
            value={behavior.name ?? ""}
            onChange={(e) => rename(e.target.value)}
            placeholder="p. ej. contador"
            maxLength={40}
            className="h-6 w-36 rounded border border-line bg-canvas px-1.5 text-ink outline-none focus:border-accent"
          />
        </label>
      )}

      {behavior && (
        <label className="flex items-center gap-1.5 text-[11px] text-ink-dim">
          Se ejecuta
          <select
            value={behavior.trigger}
            onChange={(e) => file.kind === "behavior-js" && dispatch({ type: "behavior/save", pageId: file.pageId, blockId: file.blockId, behavior: { ...behavior, trigger: e.target.value as TriggerKind } })}
            className="h-6 rounded border border-line bg-canvas px-1 text-ink [&>option]:bg-panel"
          >
            {Object.entries(TRIGGERS).map(([value, trigger]) => (
              <option key={value} value={value}>{trigger.label}</option>
            ))}
          </select>
        </label>
      )}

      {target.scope && (
        <button type="button" onClick={addCode} className={`${chip} bg-hover text-ink-dim hover:text-ink`}>
          + Código TS
        </button>
      )}

      {hint && <span className="basis-full text-[11px] text-ink-dim">{hint}</span>}
    </div>
  );
}

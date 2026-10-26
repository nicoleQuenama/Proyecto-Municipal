"use client";

import { useState } from "react";
import { SEVERITY_COLORS, SEVERITY_LABELS } from "./category-meta";
import type { Finding, Fix } from "./types";

interface FindingCardProps {
  finding: Finding;
  onFix: (fix: Fix, text?: string) => void;
  onGo: (finding: Finding) => void;
}

const button = "h-7 rounded-md border border-line px-3 text-xs hover:bg-hover";

/** Un problema: qué es, por qué importa, cómo se arregla y los botones para hacerlo. */
export function FindingCard({ finding, onFix, onGo }: FindingCardProps) {
  const [asking, setAsking] = useState<Fix | null>(null);
  const [draft, setDraft] = useState("");

  const choose = (fix: Fix) => {
    if (!fix.ask) return onFix(fix);
    setAsking(asking === fix ? null : fix);
    setDraft(fix.ask.initial);
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3" data-rule={finding.ruleId}>
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 shrink-0 rounded px-1.5 py-px text-[10px] font-semibold uppercase text-black"
          style={{ background: SEVERITY_COLORS[finding.severity] }}
        >
          {SEVERITY_LABELS[finding.severity]}
        </span>
        <span className="flex-1 text-[13px] font-medium">{finding.title}</span>
        {finding.points > 0 && <span className="shrink-0 text-[11px] text-ink-dim">−{finding.points} pts</span>}
      </div>

      <p className="text-xs text-ink-dim">
        <strong className="font-medium text-ink">Por qué importa: </strong>
        {finding.why}
      </p>
      <p className="text-xs text-ink-dim">
        <strong className="font-medium text-ink">Cómo arreglarlo: </strong>
        {finding.how}
      </p>

      <div className="flex flex-wrap gap-2">
        {finding.fixes.map((fix) => (
          <button
            key={fix.label}
            type="button"
            onClick={() => choose(fix)}
            className="h-7 rounded-md bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90"
          >
            {fix.label}
          </button>
        ))}
        {(finding.target || finding.fixes.length === 0) && (
          <button type="button" onClick={() => onGo(finding)} className={button}>
            Ir al elemento
          </button>
        )}
      </div>

      {asking?.ask && (
        <form
          className="flex flex-col gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            onFix(asking, draft);
            setAsking(null);
          }}
        >
          <label className="text-[11px] text-ink-dim">
            {asking.ask.label}
            <span className="mt-1 flex gap-2">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-8 min-w-0 flex-1 rounded-md border border-line bg-panel px-2 text-xs text-ink outline-none focus:border-accent"
              />
              <button type="submit" className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90">
                Aplicar
              </button>
            </span>
          </label>
        </form>
      )}
    </li>
  );
}

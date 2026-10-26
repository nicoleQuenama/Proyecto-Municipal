"use client";

import { useState } from "react";
import { useCommands } from "../commands/commands-context";
import { useSiteDispatch } from "../site/site-context";
import { CATEGORY_HINTS, CATEGORY_LABELS } from "./category-meta";
import { FindingCard } from "./finding-card";
import { LighthouseReal } from "./lighthouse-real";
import { ScoreRing } from "./score-ring";
import { CATEGORIES } from "./score";
import type { Category, Finding, Fix } from "./types";
import { useAudit } from "./use-audit";

type Tab = Category | "real";

/** Panel de auditoría: notas por categoría, problemas con su arreglo y cómo hacer la prueba real. */
export function AuditPanel() {
  const { site, reports, recheck, checkedAt } = useAudit();
  const dispatch = useSiteDispatch();
  const { closeDialog, slash } = useCommands();
  const [pageId, setPageId] = useState(site.currentPageId);
  const [tab, setTab] = useState<Tab>("accessibility");

  const report = reports.find((r) => r.pageId === pageId) ?? reports[0];
  const findings = report.findings.filter((f) => f.category === tab).sort((a, b) => b.points - a.points);

  const applyFix = (fix: Fix, text?: string) => fix.build(text).forEach(dispatch);
  const goTo = (finding: Finding) => {
    closeDialog();
    slash.goTo(finding.pageId, finding.target?.blockId);
    if (finding.target?.elementId) dispatch({ type: "element/select", id: finding.target.elementId });
  };

  return (
    <div className="flex h-full flex-col" data-audit-panel>
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
        <h2 className="text-sm font-semibold">Auditoría antes de publicar</h2>
        <label className="flex items-center gap-2 text-xs text-ink-dim">
          Página
          <select
            value={report.pageId}
            onChange={(e) => setPageId(e.target.value)}
            className="h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink [&>option]:bg-panel"
          >
            {site.pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
        </label>
        <span className="flex-1" />
        <span className="text-[11px] text-ink-dim">Revisado a las {new Date(checkedAt).toLocaleTimeString()}</span>
        <button type="button" onClick={recheck} className="h-8 rounded-md border border-line px-3 text-xs hover:bg-hover">
          Volver a revisar
        </button>
        <button type="button" onClick={closeDialog} className="h-8 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink">
          Cerrar
        </button>
      </header>

      <div role="tablist" className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            role="tab"
            type="button"
            aria-selected={tab === category}
            data-tab={category}
            onClick={() => setTab(category)}
            className={`flex w-36 flex-col items-center gap-1 rounded-lg border px-2 py-2 ${tab === category ? "border-accent bg-accent/10" : "border-transparent hover:bg-hover"}`}
          >
            <ScoreRing score={report.scores[category]} />
            <span className="text-xs font-medium">{CATEGORY_LABELS[category]}</span>
          </button>
        ))}
        <button
          role="tab"
          type="button"
          aria-selected={tab === "real"}
          onClick={() => setTab("real")}
          className={`flex w-36 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium ${tab === "real" ? "border-accent bg-accent/10" : "border-transparent hover:bg-hover"}`}
        >
          Lighthouse real
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {tab === "real" ? (
          <LighthouseReal />
        ) : (
          <div className="flex max-w-4xl flex-col gap-3">
            <p className="text-xs text-ink-dim">{CATEGORY_HINTS[tab]}</p>
            {findings.length === 0 ? (
              <p className="rounded-md border border-line p-4 text-[13px]">Sin problemas en esta categoría para esta página.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {findings.map((finding, i) => (
                  <FindingCard key={`${finding.ruleId}-${i}-${finding.title}`} finding={finding} onFix={applyFix} onGo={goTo} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

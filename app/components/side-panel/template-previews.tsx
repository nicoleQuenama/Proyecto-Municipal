"use client";

interface SectionVisualPreviewProps {
  templateId: string;
}

/** Previsualización gráfica tipo Canva / Figma para cada plantilla de sección. */
export function SectionVisualPreview({ templateId }: SectionVisualPreviewProps) {
  switch (templateId) {
    case "navbar":
      return (
        <div className="flex h-12 w-full items-center justify-between rounded-md border border-line/70 bg-panel px-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-accent" />
            <div className="h-2 w-14 rounded-full bg-ink/70" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-8 rounded-full bg-ink-dim/40" />
            <div className="h-1.5 w-8 rounded-full bg-ink-dim/40" />
            <div className="h-1.5 w-8 rounded-full bg-ink-dim/40" />
          </div>
          <div className="h-4 w-12 rounded bg-accent/90" />
        </div>
      );

    case "container-row":
      return (
        <div className="flex h-24 w-full items-center justify-center gap-2 rounded-md border border-dashed border-teal-500/40 bg-teal-500/5 p-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex h-full flex-1 flex-col justify-between rounded border border-line bg-panel p-1.5 shadow-2xs">
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded bg-teal-500/80" />
                <div className="h-1.5 w-8 rounded-full bg-ink/70" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-1 w-full rounded-full bg-ink-dim/30" />
                <div className="h-1 w-3/4 rounded-full bg-ink-dim/30" />
              </div>
              <div className="h-2.5 w-8 rounded bg-teal-500/20" />
            </div>
          ))}
        </div>
      );

    case "grid-cards":
      return (
        <div className="grid h-24 w-full grid-cols-4 gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/5 p-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col justify-between rounded border border-line bg-panel p-1.5 shadow-2xs">
              <div className="h-3 w-3 rounded-full bg-sky-500/80" />
              <div className="flex flex-col gap-1">
                <div className="h-1.5 w-full rounded-full bg-ink/70" />
                <div className="h-1 w-3/4 rounded-full bg-ink-dim/30" />
              </div>
              <div className="h-2 w-full rounded-xs bg-sky-500/20" />
            </div>
          ))}
        </div>
      );

    case "bento-grid":
      return (
        <div className="grid h-24 w-full grid-cols-3 gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/5 p-2">
          <div className="row-span-2 flex flex-col justify-between rounded border border-line bg-panel p-2 shadow-2xs">
            <div className="h-3.5 w-3.5 rounded bg-purple-500" />
            <div className="flex flex-col gap-1">
              <div className="h-2 w-12 rounded-full bg-ink/80" />
              <div className="h-1 w-full rounded-full bg-ink-dim/30" />
              <div className="h-1 w-4/5 rounded-full bg-ink-dim/30" />
            </div>
            <div className="h-3 w-10 rounded bg-purple-500/20" />
          </div>
          <div className="flex items-center justify-between rounded border border-line bg-panel px-2 py-1 shadow-2xs">
            <div className="h-1.5 w-10 rounded-full bg-ink/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-purple-500/60" />
          </div>
          <div className="flex items-center justify-between rounded border border-line bg-panel px-2 py-1 shadow-2xs">
            <div className="h-1.5 w-8 rounded-full bg-ink/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-purple-500/60" />
          </div>
          <div className="col-span-2 flex items-center justify-between rounded border border-line bg-panel px-2 py-1 shadow-2xs">
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-14 rounded-full bg-ink/70" />
              <div className="h-1 w-20 rounded-full bg-ink-dim/30" />
            </div>
            <div className="h-3 w-8 rounded bg-purple-500/20" />
          </div>
        </div>
      );

    case "hero-banner":
      return (
        <div className="relative flex h-24 w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-md border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-indigo-500/5 p-3 text-center">
          <div className="h-2 w-16 rounded-full bg-indigo-500/40" />
          <div className="h-3 w-36 rounded-full bg-ink/90 font-bold" />
          <div className="h-1.5 w-44 rounded-full bg-ink-dim/50" />
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-4 w-14 rounded-md bg-accent shadow-xs" />
            <div className="h-4 w-12 rounded-md border border-line bg-panel shadow-2xs" />
          </div>
        </div>
      );

    case "stats-metrics":
      return (
        <div className="grid h-24 w-full grid-cols-4 gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2">
          {[
            { num: "+15K", label: "Vecinos" },
            { num: "98%", label: "Atención" },
            { num: "24/7", label: "En línea" },
            { num: "120", label: "Obras" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center rounded border border-line bg-panel p-1 text-center shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{item.num}</span>
              <span className="text-[9px] text-ink-dim">{item.label}</span>
            </div>
          ))}
        </div>
      );

    case "carousel":
      return (
        <div className="relative flex h-24 w-full items-center justify-center gap-2 overflow-hidden rounded-md border border-violet-500/30 bg-violet-500/5 p-2">
          <div className="h-16 w-8 shrink-0 rounded border border-line/60 bg-panel/50 opacity-40" />
          <div className="flex h-20 flex-1 flex-col justify-between rounded-md border border-line bg-panel p-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-2 w-16 rounded-full bg-violet-500/80" />
              <div className="h-2 w-4 rounded-full bg-violet-500/30" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-full rounded-full bg-ink/70" />
              <div className="h-1 w-3/4 rounded-full bg-ink-dim/40" />
            </div>
            <div className="flex justify-center gap-1">
              <div className="h-1 w-3 rounded-full bg-violet-500" />
              <div className="h-1 w-1.5 rounded-full bg-ink-dim/30" />
              <div className="h-1 w-1.5 rounded-full bg-ink-dim/30" />
            </div>
          </div>
          <div className="h-16 w-8 shrink-0 rounded border border-line/60 bg-panel/50 opacity-40" />
        </div>
      );

    case "reviews":
      return (
        <div className="flex h-24 w-full flex-col justify-between rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-amber-500">
                <path d="M8 0.5l2.4 4.9 5.4 0.8-3.9 3.8 0.9 5.4-4.8-2.5-4.8 2.5 0.9-5.4-3.9-3.8 5.4-0.8z" />
              </svg>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-full rounded-full bg-ink/80" />
            <div className="h-1.5 w-4/5 rounded-full bg-ink-dim/40" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-amber-500/70" />
            <div className="flex flex-col gap-0.5">
              <div className="h-1.5 w-12 rounded-full bg-ink/80" />
              <div className="h-1 w-8 rounded-full bg-ink-dim/40" />
            </div>
          </div>
        </div>
      );

    case "content-section":
      return (
        <div className="grid h-24 w-full grid-cols-2 gap-2 rounded-md border border-line bg-panel p-2 shadow-xs">
          <div className="flex flex-col justify-between">
            <div className="flex flex-col gap-1">
              <div className="h-2 w-14 rounded-full bg-accent" />
              <div className="h-1.5 w-full rounded-full bg-ink/70" />
              <div className="h-1 w-4/5 rounded-full bg-ink-dim/40" />
            </div>
            <div className="h-3 w-10 rounded bg-accent/80" />
          </div>
          <div className="flex items-center justify-center rounded border border-dashed border-line bg-canvas/50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-dim/40">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        </div>
      );

    case "card-service":
      return (
        <div className="flex h-24 w-full flex-col justify-between rounded-md border border-cyan-500/30 bg-cyan-500/5 p-2.5">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-cyan-500/80" />
            <div className="flex flex-col gap-1">
              <div className="h-2 w-20 rounded-full bg-ink/80" />
              <div className="h-1 w-12 rounded-full bg-ink-dim/40" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-full rounded-full bg-ink/70" />
            <div className="h-1 w-3/4 rounded-full bg-ink-dim/40" />
          </div>
          <div className="flex items-center justify-between border-t border-line/60 pt-1">
            <div className="h-1.5 w-10 rounded-full bg-cyan-600 dark:text-cyan-400" />
            <div className="h-3 w-8 rounded bg-cyan-500/20" />
          </div>
        </div>
      );

    case "cta-buttons":
      return (
        <div className="flex h-20 w-full items-center justify-center gap-3 rounded-md border border-pink-500/30 bg-pink-500/5 p-3">
          <div className="flex h-7 items-center justify-center rounded-md bg-pink-600 px-3 text-[10px] font-medium text-white shadow-xs">
            Acción principal
          </div>
          <div className="flex h-7 items-center justify-center rounded-md border border-line bg-panel px-3 text-[10px] font-medium text-ink shadow-2xs">
            Secundaria
          </div>
        </div>
      );

    case "footer":
      return (
        <div className="flex h-24 w-full flex-col justify-between rounded-md border border-line bg-panel p-2.5 shadow-xs">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((col) => (
              <div key={col} className="flex flex-col gap-1">
                <div className="h-1.5 w-full rounded-full bg-ink/70" />
                <div className="h-1 w-3/4 rounded-full bg-ink-dim/40" />
                <div className="h-1 w-1/2 rounded-full bg-ink-dim/40" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-line/60 pt-1">
            <div className="h-1 w-20 rounded-full bg-ink-dim/40" />
            <div className="h-1 w-12 rounded-full bg-ink-dim/40" />
          </div>
        </div>
      );

    default:
      return (
        <div className="flex h-20 w-full items-center justify-center rounded-md border border-dashed border-line bg-canvas/40 text-xs text-ink-dim">
          Vista previa
        </div>
      );
  }
}

interface PageVisualPreviewProps {
  templateId: string;
}

/** Previsualización de página completa con su estructura de bloques apilados. */
export function PageVisualPreview({ templateId }: PageVisualPreviewProps) {
  return (
    <div className="flex w-full flex-col gap-1 rounded-md border border-line/80 bg-canvas/80 p-2 shadow-xs">
      {/* Barra superior de navegador miniatura */}
      <div className="flex h-2 w-full items-center justify-between rounded-xs bg-ink/70 px-1">
        <div className="h-1 w-4 rounded-xs bg-accent" />
        <div className="flex gap-0.5">
          <div className="h-0.5 w-2 rounded-xs bg-white/50" />
          <div className="h-0.5 w-2 rounded-xs bg-white/50" />
          <div className="h-0.5 w-2 rounded-xs bg-white/50" />
        </div>
      </div>

      {templateId === "portal" && (
        <>
          <div className="flex h-9 w-full flex-col items-center justify-center gap-0.5 rounded-xs bg-indigo-500/15 p-1">
            <div className="h-1.5 w-20 rounded-full bg-indigo-500/80" />
            <div className="h-1 w-28 rounded-full bg-ink-dim/40" />
            <div className="h-2 w-8 rounded-xs bg-accent" />
          </div>
          <div className="grid grid-cols-4 gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex h-3 items-center justify-center rounded-xs bg-emerald-500/15">
                <div className="h-1 w-3 rounded-full bg-emerald-600/60" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            <div className="row-span-2 rounded-xs bg-purple-500/15" />
            <div className="h-3 rounded-xs bg-panel border border-line" />
            <div className="h-3 rounded-xs bg-panel border border-line" />
            <div className="col-span-2 h-3 rounded-xs bg-panel border border-line" />
          </div>
        </>
      )}

      {templateId === "about" && (
        <>
          <div className="flex h-8 w-full flex-col items-center justify-center gap-0.5 rounded-xs bg-panel border border-line p-1">
            <div className="h-1.5 w-16 rounded-full bg-ink/80" />
            <div className="h-1 w-24 rounded-full bg-ink-dim/40" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="h-7 rounded-xs border border-line bg-panel p-1 flex flex-col justify-between">
              <div className="h-1 w-full bg-ink/60 rounded-full" />
              <div className="h-0.5 w-4/5 bg-ink-dim/40 rounded-full" />
            </div>
            <div className="h-7 rounded-xs bg-accent/15 border border-dashed border-accent/40" />
          </div>
          <div className="grid grid-cols-4 gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 rounded-xs bg-emerald-500/15" />
            ))}
          </div>
        </>
      )}

      {templateId === "services" && (
        <>
          <div className="h-6 w-full rounded-xs bg-panel border border-line flex flex-col justify-center px-1.5 gap-0.5">
            <div className="h-1.5 w-20 rounded-full bg-sky-500/80" />
            <div className="h-0.5 w-32 rounded-full bg-ink-dim/40" />
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 rounded-xs border border-line bg-panel p-1 flex flex-col justify-between">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                <div className="h-1 w-full bg-ink/50 rounded-full" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="h-5 rounded-xs bg-purple-500/15" />
            <div className="h-5 rounded-xs bg-teal-500/15" />
          </div>
        </>
      )}

      {templateId === "contact" && (
        <>
          <div className="h-6 w-full rounded-xs bg-panel border border-line flex flex-col justify-center items-center gap-0.5">
            <div className="h-1.5 w-16 rounded-full bg-ink/80" />
            <div className="h-0.5 w-24 rounded-full bg-ink-dim/40" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="h-10 rounded-xs border border-line bg-panel p-1 flex flex-col justify-between">
              <div className="h-1 w-full bg-ink-dim/30 rounded-xs" />
              <div className="h-1 w-full bg-ink-dim/30 rounded-xs" />
              <div className="h-2 w-8 bg-accent rounded-xs" />
            </div>
            <div className="h-10 rounded-xs bg-canvas border border-dashed border-line flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-accent" />
            </div>
          </div>
        </>
      )}

      {templateId === "news" && (
        <>
          <div className="h-8 w-full rounded-xs bg-violet-500/15 flex items-center justify-center">
            <div className="h-2 w-24 rounded-full bg-violet-500/70" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 rounded-xs border border-line bg-panel p-1 flex flex-col justify-between">
                <div className="h-3 w-full rounded-2xs bg-canvas" />
                <div className="h-1 w-full bg-ink/60 rounded-full" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pie de página miniatura */}
      <div className="h-2.5 w-full rounded-xs bg-panel border border-line flex items-center justify-between px-1">
        <div className="h-0.5 w-8 rounded-full bg-ink-dim/40" />
        <div className="h-0.5 w-6 rounded-full bg-ink-dim/40" />
      </div>
    </div>
  );
}

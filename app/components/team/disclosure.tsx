import type { ReactNode } from "react";

interface Props {
  /** Lo que se ve siempre, aunque esté plegado. */
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** «section» para los bloques del panel; «row» para una fila de lista. */
  variant?: "section" | "row";
  className?: string;
}

const SHELL = {
  section: "rounded-xl border border-line bg-canvas/30",
  row: "rounded-xl border border-line bg-panel",
} as const;

/** Un bloque plegable con <details>: el navegador guarda si está abierto, sin estado ni condicionales. */
export function Disclosure({ summary, children, defaultOpen = false, variant = "row", className = "" }: Props) {
  return (
    <details open={defaultOpen} className={`group ${SHELL[variant]} ${className}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 p-2.5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">{summary}</span>
        <span aria-hidden className="text-ink-dim transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="border-t border-line p-3">{children}</div>
    </details>
  );
}

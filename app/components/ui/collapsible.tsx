"use client";

import { useId, useState, type ReactNode } from "react";

interface CollapsibleProps {
  title: string;
  /** Resumen visible aunque la sección esté cerrada (p. ej. cuántas reglas hay). */
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Sección plegable. El contenido sigue montado al cerrarla (solo se oculta),
 * así no se pierde lo que se estaba escribiendo.
 */
export function Collapsible({ title, badge, defaultOpen = true, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-2 rounded-md py-1 text-left uppercase hover:text-ink"
        >
          <span aria-hidden className={`transition-transform ${open ? "" : "-rotate-90"}`}>▾</span>
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {badge}
        </button>
      </h3>

      <div id={contentId} hidden={!open} className="flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

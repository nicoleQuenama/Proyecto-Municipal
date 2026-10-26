"use client";

import { useState, type ReactNode } from "react";
import { IconGlyph } from "../icons/icon-glyph";
import type { ComponentDef } from "../site/types";
import { accordionTitle, collapseToTitle } from "./fold-accordion";
import type { AccordionFold } from "./types";

interface FoldAccordionProps {
  fold: AccordionFold;
  view: ComponentDef;
  /** Al editar se ve la sección entera, sin plegar. */
  active: boolean;
  render: (view: ComponentDef, overlay?: ReactNode) => ReactNode;
}

/** Acordeón: la sección se pliega bajo su título; tocar el título la abre y la cierra. */
export function FoldAccordion({ fold, view, active, render }: FoldAccordionProps) {
  const [open, setOpen] = useState(fold.open);
  const title = accordionTitle(view, fold.titleId);
  if (!active || !title) return <>{render(view)}</>;

  const toggle = (
    <button
      key="accordion-toggle"
      type="button"
      aria-expanded={open}
      aria-label={`${open ? "Plegar" : "Desplegar"} ${title.text.trim() || "la sección"}`}
      onClick={() => setOpen(!open)}
      className="absolute inset-x-0 z-20 flex cursor-pointer items-center justify-end px-2"
      style={{ top: title.y, height: Math.max(title.height, 36) }}
    >
      <span className={`transition-transform ${open ? "rotate-180" : ""}`} style={{ color: title.color }}>
        <IconGlyph name="chevron-down" size={22} />
      </span>
    </button>
  );
  return <>{render(open ? view : collapseToTitle(view, fold.titleId), toggle)}</>;
}

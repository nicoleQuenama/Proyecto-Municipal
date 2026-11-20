"use client";

import { useState } from "react";
import { myTemplates } from "../site/my-templates";
import { useSite } from "../site/site-context";
import { MyTemplates } from "./my-templates";

type Kind = "section" | "page";

const KINDS: { value: Kind; label: string }[] = [
  { value: "section", label: "Secciones" },
  { value: "page", label: "Páginas" },
];

/** Las plantillas de la persona (guardadas desde el editor de código). No hay plantillas prehechas. */
export function TemplatesTab() {
  const [kind, setKind] = useState<Kind>("section");
  const { components } = useSite();
  const total = (value: Kind) => myTemplates(components, value).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-lg bg-canvas p-1">
        {KINDS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              kind === value ? "bg-accent text-white shadow-sm" : "text-ink-dim hover:text-ink"
            } cursor-pointer`}
          >
            {label} ({total(value)})
          </button>
        ))}
      </div>

      {total(kind) === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-dim">
          Aún no tienes plantillas de {kind === "section" ? "sección" : "página"}. Guárdalas desde el editor de código.
        </p>
      ) : (
        <MyTemplates target={kind} />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { myTemplates } from "../site/my-templates";
import { useSite } from "../site/site-context";
import { MyTemplates } from "./my-templates";
import { VisualTemplates } from "./visual-templates";
import { useCommands } from "../commands/commands-context";
import { hasPermission, useAuth } from "../auth/auth-context";

type Kind = "section" | "page";

const KINDS: { value: Kind; label: string }[] = [
  { value: "section", label: "Secciones" },
  { value: "page", label: "Páginas" },
];

/** Las plantillas de la persona (guardadas desde el editor de código). No hay plantillas prehechas. */
export function TemplatesTab() {
  const [kind, setKind] = useState<Kind>("section");
  const { components } = useSite();
  const { openBuilder } = useCommands();
  const { currentUser } = useAuth();
  const visualCount = components.filter((c) => !c.codeKind && c.templateFor === "section").length;
  const total = (value: Kind) => myTemplates(components, value).length + (value === "section" ? visualCount : 0);

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

      {kind === "section" && hasPermission(currentUser, "editContent") && <button type="button" onClick={() => openBuilder("new")} className="h-9 rounded-md border border-dashed border-line text-xs hover:bg-hover cursor-pointer">+ Diseñar plantilla visual</button>}
      {kind === "section" && visualCount > 0 && <VisualTemplates />}
      {total(kind) === 0 && !(kind === "section" && visualCount > 0) ? (
        <p className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-dim">
          Aún no tienes plantillas de {kind === "section" ? "sección" : "página"}. {kind === "section" ? "Diseña una visual o guárdala desde el editor de código." : "Guárdalas desde el editor de código."}
        </p>
      ) : total(kind) > 0 && (
        <MyTemplates target={kind} />
      )}
    </div>
  );
}

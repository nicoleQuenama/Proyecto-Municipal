"use client";

import { useState } from "react";
import { inviteLink, inviteToken } from "./versioning-rules";

/** Enlace de invitación del prototipo: siempre el mismo para el mismo proyecto. */
export function InviteLink() {
  const [copied, setCopied] = useState(false);
  const link = inviteLink(typeof location === "undefined" ? "" : location.origin, inviteToken("proyecto-municipal"));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso del portapapeles: la persona puede seleccionar y copiar el texto.
    }
  };

  return (
    <div className="flex gap-2">
      <input
        readOnly
        aria-label="Enlace de invitación"
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        className="h-9 min-w-0 flex-1 rounded-md border border-line bg-canvas px-3 text-xs outline-none focus:border-accent"
      />
      <button type="button" onClick={copy} className="h-9 shrink-0 rounded-md border border-line px-3 text-xs hover:bg-hover">
        {copied ? "Copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}

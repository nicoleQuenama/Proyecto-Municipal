"use client";

import { useState } from "react";
import { checklistText } from "./publish-checklist";

const STEPS = [
  "Publica el sitio para tener una dirección pública (la prueba real necesita una página en internet).",
  "Abre esa dirección en Chrome, pulsa F12, entra en la pestaña «Lighthouse» y pulsa «Analizar». Mejor en una ventana de incógnito.",
  "O pega la dirección en pagespeed.web.dev (PageSpeed Insights), que además mide con datos de usuarios reales.",
];

/** Explica cómo hacer la prueba de verdad y deja copiar la lista de comprobaciones para el publicador. */
export function LighthouseReal() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(checklistText());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-4 text-[13px]">
      <p className="rounded-md border border-line bg-canvas p-3 text-ink-dim">
        Esta auditoría es <strong className="text-ink">interna y orientativa</strong>: revisa tu diseño antes de publicar, pero no
        mide la velocidad real ni garantiza un 100. Lighthouse de verdad analiza la página ya publicada, con tu servidor y tu conexión.
      </p>

      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 rounded-md border border-line p-3">
        <span className="font-medium">Lista de comprobaciones para el publicador</span>
        <span className="text-ink-dim">
          Lo que el HTML publicado debe cumplir (viewport, idioma, título, descripción, un H1, alt, tamaños de imagen, carga diferida…).
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="h-8 w-fit rounded-md bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90"
        >
          {copied ? "Copiada" : "Copiar la lista"}
        </button>
      </div>
    </div>
  );
}

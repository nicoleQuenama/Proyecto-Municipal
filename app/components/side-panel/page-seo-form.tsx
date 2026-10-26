"use client";

import { useSiteDispatch } from "../site/site-context";
import type { PageSeo } from "../site/seo-rules";
import type { Page } from "../site/types";

const inputClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent";

const LANGUAGES = [
  { value: "", label: "Sin indicar" },
  { value: "es", label: "Español (es)" },
  { value: "en", label: "Inglés (en)" },
  { value: "pt", label: "Portugués (pt)" },
  { value: "fr", label: "Francés (fr)" },
];

/** Los campos de una página para buscadores y redes: título, descripción, imagen para compartir e idioma. */
export function PageSeoForm({ page }: { page: Page }) {
  const dispatch = useSiteDispatch();
  const seo = page.seo ?? {};
  const set = (patch: Partial<PageSeo>) => dispatch({ type: "page/seo", pageId: page.id, patch });

  return (
    <div className="flex flex-col gap-2 rounded-md bg-canvas/60 p-2" aria-label={`Buscadores de ${page.name}`}>
      <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
        Título en Google ({(seo.title ?? "").length}/60)
        <input value={seo.title ?? ""} maxLength={90} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
        Descripción ({(seo.description ?? "").length}/160)
        <textarea
          value={seo.description ?? ""}
          maxLength={300}
          rows={3}
          onChange={(e) => set({ description: e.target.value })}
          className={`${inputClass} h-auto resize-none py-1.5`}
        />
      </label>
      <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
        Imagen para compartir (URL)
        <input value={seo.image ?? ""} placeholder="https://…" onChange={(e) => set({ image: e.target.value })} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
        Idioma de la página
        <select value={seo.lang ?? ""} onChange={(e) => set({ lang: e.target.value })} className={`${inputClass} [&>option]:bg-panel`}>
          {LANGUAGES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

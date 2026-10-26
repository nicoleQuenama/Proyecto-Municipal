"use client";

import { useState } from "react";
import { useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { plural } from "../versioning/versioning-rules";

const small = "flex h-6 shrink-0 items-center rounded px-1.5 text-xs hover:bg-hover hover:text-ink";

/** Lo que la etiqueta de una página en el lienzo ofrece: hacerla la de inicio y eliminarla (con confirmación). */
export function PageLabelActions({ page }: { page: Page }) {
  const dispatch = useSiteDispatch();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span role="alert" className="flex flex-wrap items-center gap-1.5 rounded bg-red-500/10 px-2 py-1 text-xs text-red-300">
        {page.isHome ? (
          <>La página de inicio (la ruta «/») no se puede eliminar. Elige otra página como inicio y podrás borrar esta.</>
        ) : (
          <>
            ¿Eliminar «{page.name}»? Se perderán {plural(page.blocks.length, "bloque", "bloques")} y{" "}
            {plural(page.media.length, "medio", "medios")}.
            <button type="button" onClick={() => dispatch({ type: "page/delete", id: page.id })} className={`${small} border border-red-500/60 text-red-400`}>
              Eliminar
            </button>
          </>
        )}
        <button type="button" onClick={() => setConfirming(false)} className={small}>
          {page.isHome ? "Entendido" : "Cancelar"}
        </button>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={page.isHome ? `${page.name} es la página de inicio` : `Usar ${page.name} como página de inicio`}
        title={page.isHome ? "Es la página de inicio" : "Usar como página de inicio"}
        aria-pressed={page.isHome}
        disabled={page.isHome}
        onClick={() => dispatch({ type: "page/home", id: page.id })}
        className={`${small} ${page.isHome ? "text-accent" : ""}`}
      >
        ⌂
      </button>
      <button
        type="button"
        aria-label={`Eliminar la página ${page.name}`}
        title="Eliminar esta página"
        onClick={() => setConfirming(true)}
        className={`${small} hover:text-red-400`}
      >
        ×
      </button>
    </>
  );
}

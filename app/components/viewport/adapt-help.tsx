import type { Suggestion } from "../responsive/adapt-suggest";

/** Lo que hace el CMS solo, en lenguaje llano (coincide con las reglas de `responsive/strategies`). */
const RULES = [
  ["Varias piezas en una sección", "se apilan en una columna, en orden de lectura."],
  ["Una pieza sola (banner, imagen)", "se escala hasta que quepa."],
  ["Una cabecera con enlaces", "los enlaces pasan a un menú con botón."],
  ["Una lista repetida muy larga", "pasa a carrusel deslizable."],
  ["Una sección muy alta", "se recorta con «Ver más»."],
] as const;

/** Explica cómo se adapta la página y qué hacer para cambiarlo, más las ideas que el asistente encontró. */
export function AdaptHelp({ device, suggestions }: { device: string; suggestions: Suggestion[] }) {
  return (
    <div className="flex w-full flex-col gap-2 border-t border-line pt-2 text-[11px] text-ink-dim">
      <p className="text-ink">
        No tienes que rehacer nada: el CMS ya adapta tu diseño a {device}. Esto es lo que hace:
      </p>
      <ul className="flex flex-col gap-0.5">
        {RULES.map(([when, what]) => (
          <li key={when}>
            <span className="text-ink">{when}:</span> {what}
          </li>
        ))}
      </ul>
      <p>
        <span className="text-ink">¿Algo no te gusta?</span> Pulsa la sección en el lienzo: bajo ella aparece «En {device}» con
        Escalar, Apilar, Menú o «Lo defino yo» (mover cada pieza a mano solo para {device}). El escritorio nunca cambia.
      </p>
      {suggestions.length > 0 && (
        <div>
          <p className="text-ink">Ideas para esta página:</p>
          <ul className="list-disc pl-4">
            {suggestions.map((s) => (
              <li key={s.blockId}>Una sección {s.reason}.</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

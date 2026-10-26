"use client";

import { BindingBadge } from "../data-sources/binding-badge";
import { useDataDrop } from "../data-sources/use-data-drop";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { BlockInstance, CanvasElement } from "../site/types";
import { targetsPage } from "../navigation/links";
import { paramsOf } from "./route-params";
import type { LinkParamValue } from "./types";

interface ParamFieldProps {
  name: string;
  value: LinkParamValue | undefined;
  onChange: (value: LinkParamValue | null) => void;
}

/** Un parámetro: se escribe un valor o se arrastra una clave de la pestaña «Datos». */
function ParamField({ name, value, onChange }: ParamFieldProps) {
  const drop = useDataDrop(onChange);

  return (
    <div {...drop.handlers} className={`flex items-center gap-2 rounded-md ${drop.over ? "ring-2 ring-emerald-500" : ""}`}>
      <code className="w-14 shrink-0 truncate text-ink-dim" title={name}>:{name}</code>
      {typeof value === "object" ? (
        <BindingBadge label={`Valor de ${name}`} reference={value} onClear={() => onChange(null)} className="max-w-none" />
      ) : (
        <input
          aria-label={`Valor de ${name}`}
          placeholder="escribe o arrastra una clave"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent"
        />
      )}
    </div>
  );
}

interface LinkParamsControlsProps {
  pageId: string;
  block: BlockInstance;
  element: CanvasElement;
}

/** Los valores de los parámetros de un elemento enlazado a una página dinámica (no sale si el enlace no lo es). */
export function LinkParamsControls({ pageId, block, element }: LinkParamsControlsProps) {
  const { pages, components } = useSite();
  const dispatch = useSiteDispatch();

  const link = components.find((c) => c.id === block.componentId)?.links[element.id];
  const target = link && targetsPage(link) ? pages.find((p) => p.id === link.pageId) : undefined;
  const names = paramsOf(target?.route);
  if (!target || names.length === 0) return null;

  const set = (param: string, value: LinkParamValue | null) =>
    dispatch({ type: "link-param/set", pageId, blockId: block.id, elementId: element.id, param, value });

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-xs">
      <p className="font-medium text-sky-400">Datos para {target.name} ({target.route})</p>
      {names.map((name) => (
        <ParamField key={name} name={name} value={block.linkParams?.[element.id]?.[name]} onChange={(value) => set(name, value)} />
      ))}
      <p className="text-[11px] text-ink-dim">
        {block.repeat
          ? "Arrastra aquí una clave de la lista que repite esta sección (por ejemplo su id): cada copia usa su propio dato."
          : "Escribe un valor o arrastra una clave de la pestaña «Datos»."}{" "}
        Sin valor se usa el de ejemplo de la página.
      </p>
    </section>
  );
}

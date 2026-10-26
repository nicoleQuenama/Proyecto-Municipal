import { CacheSelect } from "./cache-select";
import { fieldClass } from "./field-class";
import { PairsEditor } from "./pairs-editor";
import { SourceResult } from "./source-result";
import { TokenHelp } from "./token-help";
import type { DataSource, HttpMethod } from "./types";
import { useSourceData } from "./use-source-data";

interface SourceEditorProps {
  source: DataSource;
  onChange: (source: DataSource) => void;
  onRemove: () => void;
}

/** Una fuente: a dónde se pide, parámetros, código opcional, caché y el resultado de probarla. */
export function SourceEditor({ source, onChange, onRemove }: SourceEditorProps) {
  const { state, reload } = useSourceData(source, false);
  const set = (patch: Partial<DataSource>) => onChange({ ...source, ...patch });

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line p-2.5">
      <input aria-label="Nombre" value={source.name} onChange={(e) => set({ name: e.target.value })} className={`${fieldClass} font-medium`} />
      <div className="flex gap-1">
        <select aria-label="Método" value={source.method} onChange={(e) => set({ method: e.target.value as HttpMethod })} className={`${fieldClass} w-20`}>
          <option>GET</option>
          <option>POST</option>
        </select>
        <input aria-label="URL" placeholder="https://apiejemplo.com/noticias" value={source.url} onChange={(e) => set({ url: e.target.value })} className={fieldClass} />
      </div>
      <TokenHelp />
      <PairsEditor label="Parámetros (query)" keyPlaceholder="clave" pairs={source.query} onChange={(query) => set({ query })} />
      <PairsEditor label="Cabeceras" keyPlaceholder="Authorization" pairs={source.headers} onChange={(headers) => set({ headers })} />
      <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
        Código opcional (TypeScript)
        <textarea
          rows={3}
          spellCheck={false}
          placeholder="(data: any) => data.articles"
          value={source.transform}
          onChange={(e) => set({ transform: e.target.value })}
          className="rounded-md border border-line bg-canvas p-2 font-mono text-xs text-ink outline-none focus:border-accent"
        />
      </label>
      <CacheSelect value={source.cache} onChange={(cache) => set({ cache })} />
      <div className="flex gap-2">
        <button type="button" onClick={reload} disabled={!source.url.trim()} className="h-8 flex-1 rounded-md bg-accent text-xs font-medium text-white hover:opacity-90 disabled:opacity-50">
          {state.status === "loading" ? "Pidiendo…" : "Probar"}
        </button>
        <button type="button" onClick={onRemove} className="h-8 rounded-md bg-hover px-3 text-xs hover:text-red-400">
          Eliminar
        </button>
      </div>
      <SourceResult state={state} sourceId={source.id} />
    </div>
  );
}

import { KeyTree } from "./key-tree";
import { toTree } from "./paths";
import type { SourceState } from "./types";

/** Lo que respondió la fuente: las claves para arrastrar, «cargando» o el error. */
export function SourceResult({ state, sourceId }: { state: SourceState; sourceId: string }) {
  if (state.status === "idle") return <p className="text-xs text-ink-dim">Pulsa «Probar» para ver las claves.</p>;
  if (state.status === "loading" && state.data === undefined) return <p className="text-xs text-ink-dim">Pidiendo…</p>;

  return (
    <div className="flex flex-col gap-1.5">
      {state.status === "error" && <p className="text-xs text-red-400">{state.message}</p>}
      {state.data !== undefined && (
        <>
          <p className="text-xs text-ink-dim">Arrastra cualquier clave —dato, objeto o lista— a un elemento o a una sección.</p>
          <KeyTree root={toTree(state.data)} sourceId={sourceId} />
        </>
      )}
    </div>
  );
}

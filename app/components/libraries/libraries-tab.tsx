"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "../ui/badge";
import { CODE_COMPONENT_ID } from "../site/code-defaults";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { Library } from "../site/types";
import { resolveCdnVersion } from "./cdn";
import { installWithPnpm, uninstallWithPnpm } from "./libs-api";
import { snippetFor } from "./snippets";
import { useLibsStatus } from "./use-libs-status";

const PACKAGE_NAME = /^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

/** Cómo se instala y se muestra cada origen de librería. Un origen nuevo es una entrada nueva. */
const SOURCES: Record<
  Library["source"],
  { label: string; hint: string; install: (name: string, version: string) => Promise<{ name: string; version: string }> }
> = {
  cdn: {
    label: "CDN",
    hint: "Se carga desde internet como módulo; no toca el proyecto.",
    install: async (name, version) => ({ name, version: await resolveCdnVersion(name, version) }),
  },
  pnpm: {
    label: "pnpm",
    hint: "Se instala en este proyecto con pnpm (solo con `pnpm dev`).",
    install: installWithPnpm,
  },
};

const fieldClass =
  "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent disabled:opacity-50";

function LibraryRow({ library, onUse, onRemove, busy }: { library: Library; onUse: () => void; onRemove: () => void; busy: boolean }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-line p-2">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[13px] font-medium">
          <span className="truncate">{library.name}</span>
          <Badge tone="accent">{SOURCES[library.source].label}</Badge>
        </p>
        <p className="text-xs text-ink-dim">v{library.version}</p>
      </div>
      <button
        type="button"
        onClick={onUse}
        title="Agrega un bloque de código con un ejemplo de uso"
        className="h-7 rounded-md bg-hover px-2 text-xs hover:bg-accent hover:text-white"
      >
        Usar
      </button>
      <button
        type="button"
        disabled={busy}
        aria-label={`Desinstalar ${library.name}`}
        title="Desinstalar"
        onClick={onRemove}
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-red-400 disabled:opacity-40"
      >
        ×
      </button>
    </li>
  );
}

export function LibrariesTab() {
  const { libraries, currentPageId } = useSite();
  const dispatch = useSiteDispatch();
  const { status, refresh } = useLibsStatus();

  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [source, setSource] = useState<Library["source"]>("cdn");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = (library: Omit<Library, "id">) => dispatch({ type: "library/add", library: { ...library, id: crypto.randomUUID() } });

  const install = async (event: FormEvent) => {
    event.preventDefault();
    const packageName = name.trim().toLowerCase();
    if (!PACKAGE_NAME.test(packageName)) return setError("Escribe el nombre de un paquete de npm (p. ej. gsap).");
    if (libraries.some((l) => l.name === packageName)) return setError("Esa librería ya está en el proyecto.");

    setBusy(true);
    setError(null);
    try {
      const installed = await SOURCES[source].install(packageName, version.trim());
      add({ name: installed.name, version: installed.version, source });
      setName("");
      setVersion("");
      refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo instalar.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (library: Library) => {
    setBusy(true);
    setError(null);
    try {
      if (library.source === "pnpm") await uninstallWithPnpm(library.name);
      dispatch({ type: "library/remove", id: library.id });
      refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo desinstalar.");
    } finally {
      setBusy(false);
    }
  };

  /** Un bloque de código nuevo con un ejemplo que usa la librería. */
  const use = (library: Library) => {
    const blockId = crypto.randomUUID();
    dispatch({ type: "block/add", id: blockId, componentId: CODE_COMPONENT_ID });
    dispatch({ type: "block/code", pageId: currentPageId, blockId, patch: snippetFor(library.name) });
  };

  // Lo instalado con pnpm que aún no está en la lista de este sitio (p. ej. tras recargar la página).
  const available = status.installed.filter((lib) => !libraries.some((l) => l.name === lib.name));

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={install} className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Instalar una librería</h3>

        <input
          aria-label="Nombre del paquete"
          placeholder="gsap, chart.js, @scope/paquete…"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          className={fieldClass}
        />
        <input
          aria-label="Versión (opcional)"
          placeholder="Versión (vacío = la última)"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className={fieldClass}
        />

        <div role="radiogroup" aria-label="Origen" className="grid grid-cols-2 gap-1">
          {(Object.keys(SOURCES) as Library["source"][]).map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={source === key}
              disabled={key === "pnpm" && !status.available}
              onClick={() => setSource(key)}
              className={`h-8 rounded-md text-xs transition-colors disabled:opacity-40 ${
                source === key ? "bg-accent text-white" : "bg-hover text-ink-dim hover:text-ink"
              }`}
            >
              {SOURCES[key].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-dim">
          {source === "pnpm" || status.available ? SOURCES[source].hint : `${SOURCES[source].hint} ${status.reason ?? ""}`}
        </p>

        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="h-9 rounded-md bg-accent text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Instalando…" : "Instalar"}
        </button>
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      </form>

      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Librerías del proyecto · {libraries.length}</h3>
        {libraries.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {libraries.map((library) => (
              <LibraryRow key={library.id} library={library} busy={busy} onUse={() => use(library)} onRemove={() => remove(library)} />
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-dim">Aún no hay librerías. Las que instales se pueden importar en los bloques de código.</p>
        )}
      </section>

      {available.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Instaladas con pnpm en el proyecto</h3>
          <ul className="flex flex-col gap-1.5">
            {available.map((lib) => (
              <li key={lib.name} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate">{lib.name} · v{lib.version}</span>
                <button
                  type="button"
                  onClick={() => add({ name: lib.name, version: lib.version, source: "pnpm" })}
                  className="h-7 rounded-md bg-hover px-2 hover:bg-accent hover:text-white"
                >
                  Añadir al sitio
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

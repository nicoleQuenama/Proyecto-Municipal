"use client";

import { useState } from "react";
import { ViewportSwitcher } from "../../viewport/viewport-switcher";
import { useViewport } from "../../viewport/viewport-context";
import { useExternal } from "../external-context";
import { AddressBar } from "./address-bar";
import { Inspector } from "./inspector";
import { PageFrame } from "./page-frame";
import { PatchList } from "./patch-list";
import type { PickedElement } from "./use-patch-editing";
import type { PatchDevice } from "../types";

/** Qué pantalla se está viendo decide dónde valen, de partida, los estilos nuevos. */
const SCOPE_OF_DEVICE = { desktop: "all", tablet: "tablet", mobile: "mobile" } as const satisfies Record<string, PatchDevice>;

/** Pantalla completa: la página real del cliente a un lado y, al otro, lo que se puede cambiar del elemento elegido. */
export function ExternalEditor() {
  const { state, dispatch, editorOpen, setEditorOpen } = useExternal();
  const { device } = useViewport();
  const [picked, setPicked] = useState<PickedElement | null>(null);

  if (!editorOpen || !state.site) return null;

  const path = new URL(state.pageUrl).pathname;
  const here = state.patches.filter((patch) => patch.path === path || patch.path === "*");

  return (
    <div role="dialog" aria-label="Editar la página publicada" className="fixed inset-0 z-50 flex flex-col bg-canvas text-ink">
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-panel px-4 py-2">
        <h2 className="shrink-0 text-sm font-semibold">Tu página publicada</h2>
        <AddressBar />
        <ViewportSwitcher />
        <button
          type="button"
          onClick={() => setEditorOpen(false)}
          className="h-8 shrink-0 rounded-md bg-accent px-3 text-xs font-medium text-white"
        >
          Listo
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto p-4">
          <PageFrame key={state.pageUrl} state={state} device={device} onPick={setPicked} />
        </div>

        <aside aria-label="Cambios" className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-line bg-panel p-4">
          {picked && picked.path === path ? (
            <Inspector key={`${picked.selector}:${device}`} picked={picked} initialScope={SCOPE_OF_DEVICE[device]} />
          ) : (
            <p className="rounded-md bg-hover p-3 text-xs text-ink-dim">
              Haz clic en cualquier texto, imagen o botón de la página para cambiarlo. Cambia entre escritorio,
              tablet y móvil arriba para decidir cómo se ve en cada pantalla.
            </p>
          )}

          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Cambios en esta página</h3>
            <PatchList
              patches={here}
              onRemove={(id) => dispatch({ type: "patch/remove", id })}
              emptyMessage="Todavía no cambiaste nada aquí."
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

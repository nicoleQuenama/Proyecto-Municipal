"use client";

import { Section } from "../ui/section";
import { AddedPages } from "./added-pages";
import { ConnectForm } from "./connect-form";
import { PatchList } from "./editor/patch-list";
import { useExternal } from "./external-context";
import { InstallSnippet } from "./install-snippet";

/** La sección «Sitio» del panel: conectar la web del cliente y ver todo lo que se cambió en ella. */
export function ExternalTab() {
  const { state, dispatch, setEditorOpen } = useExternal();

  if (!state.site) return <ConnectForm />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3 text-xs">
        <p className="truncate font-medium" title={state.site}>
          {state.site}
        </p>
        <p className="text-ink-dim">
          {state.patches.length} cambios · {state.pages.length} páginas nuevas
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditorOpen(true)} className="h-8 rounded-md bg-accent px-3 font-medium text-white">
            Editar la página
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "site/disconnect" })}
            className="h-8 rounded-md px-3 text-ink-dim hover:bg-hover hover:text-ink"
          >
            Desconectar
          </button>
        </div>
      </div>

      <Section title="Adaptación a móvil y tablet">
        <label className="flex items-start gap-2 text-xs leading-relaxed">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={state.autoResponsive}
            onChange={(e) => dispatch({ type: "site/auto-responsive", on: e.target.checked })}
          />
          <span>
            Que el CMS adapte la página solo (imágenes y tablas al ancho de la pantalla). Para decidirlo tú, cambia
            de pantalla en el editor y ajusta los estilos de esa pantalla.
          </span>
        </label>
      </Section>

      <Section title="Cambios">
        <PatchList
          patches={state.patches}
          onRemove={(id) => dispatch({ type: "patch/remove", id })}
          emptyMessage="Aún no hay cambios. Abre el editor y haz clic en lo que quieras cambiar."
        />
      </Section>

      <Section title="Páginas nuevas">
        <AddedPages />
      </Section>

      <Section title="Instalación">
        <InstallSnippet />
      </Section>
    </div>
  );
}

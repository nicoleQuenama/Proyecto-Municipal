"use client";

import { InlineForm } from "../ui/inline-form";
import { ChangesList } from "./changes-list";
import { PublishCard } from "./publish-card";
import { Step } from "./step";
import { useVersioning } from "./versioning-context";
import { useWorkingChanges } from "./use-working-changes";
import { headOf, plural } from "./versioning-rules";

/** Flujo de publicación: añadir cambios → hacer versión (commit) → publicar. */
export function PublishTab() {
  const { state, dispatch } = useVersioning();
  const { changes, staged } = useWorkingChanges();

  const head = headOf(state.commits, state.current);
  const isLive = head !== undefined && state.releases[0]?.commitId === head.id;

  const commit = (message: string) => {
    if (staged.length === 0) return "Añade al menos un cambio antes de hacer una versión.";
    dispatch({ type: "commit", message, changes: staged, at: new Date().toISOString() });
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <Step number={1} title="Añadir cambios" done={staged.length > 0}>
        <ChangesList changes={changes} />
      </Step>

      <Step number={2} title={`Hacer versión en «${state.current}»`} done={changes.length === 0 && head !== undefined}>
        <InlineForm
          label="Mensaje de la versión"
          placeholder="Describe qué cambiaste (p. ej. Nuevo titular azul)"
          submitLabel={`Hacer versión (${plural(staged.length, "cambio", "cambios")})`}
          onSubmit={commit}
        />
      </Step>

      <Step number={3} title="Publicar a la página oficial" done={isLive}>
        <PublishCard unsavedCount={changes.length} />
      </Step>
    </div>
  );
}

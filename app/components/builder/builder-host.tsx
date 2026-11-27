"use client";

import { useCommands } from "../commands/commands-context";
import { ComponentBuilder } from "./component-builder";
import { CreationChoice } from "./creation-choice";
import { hasPermission, useAuth } from "../auth/auth-context";
import { useCurrentPage, useSiteDispatch } from "../site/site-context";
import { useWorkbench } from "../workbench/workbench-context";

/** El constructor de componentes como diálogo de la app: se abre desde el panel o desde un comando. */
export function BuilderHost() {
  const { builder, closeBuilder, openBuilder } = useCommands();
  const { currentUser } = useAuth();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const { openFile } = useWorkbench();
  if (!builder) return null;

  const createCode = () => {
    const blockId = crypto.randomUUID();
    dispatch({ type: "page/add-code-block", pageId: page.id, kind: "component", name: "Nuevo componente", blockId, code: {} });
    closeBuilder();
    openFile({ kind: "block-html", pageId: page.id, blockId });
  };
  if (builder === "new") return <CreationChoice onClose={closeBuilder} onCanvas={() => openBuilder("new-canvas")} onCode={createCode} canCode={hasPermission(currentUser, "editCode")} />;
  return <ComponentBuilder initial={builder === "new-canvas" ? undefined : builder} onClose={closeBuilder} />;
}

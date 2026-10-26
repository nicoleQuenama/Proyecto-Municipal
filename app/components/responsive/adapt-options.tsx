"use client";

import type { ComponentType } from "react";
import type { BlockInstance, ComponentDef } from "../site/types";
import type { AdaptiveDevice } from "./devices";
import { FoldEditor } from "./fold-editor";
import { MenuEditor } from "./menu-editor";
import type { AdaptMode } from "./types";

/** Lo que reciben los editores de opciones de la adaptación. */
export interface EditorProps {
  pageId: string;
  block: BlockInstance;
  /** La sección con su formato propio, antes de adaptarla. */
  view: ComponentDef;
  device: AdaptiveDevice;
}

/** Los ajustes propios de cada modo de adaptación (los que no figuran no tienen). Uno nuevo es una entrada nueva. */
const MODE_EDITORS: Partial<Record<AdaptMode, ComponentType<EditorProps>>> = {
  menu: MenuEditor,
};

/** Debajo de las opciones de adaptación: los ajustes del modo elegido y la presentación de secciones largas. */
export function AdaptOptions({ mode, ...props }: EditorProps & { mode: AdaptMode }) {
  const ModeEditor = MODE_EDITORS[mode];
  return (
    <>
      {ModeEditor && <ModeEditor {...props} />}
      {mode !== "manual" && <FoldEditor {...props} />}
    </>
  );
}

"use client";

import { useExternal } from "../external-context";
import type { Patch, PatchDevice, PatchKind } from "../types";
import { patchId } from "./patch-id";
import { cssValue, type EditSpec } from "./quick-edits";

export interface PickedElement {
  el: Element;
  selector: string;
  label: string;
  /** Ruta de la página donde se eligió. */
  path: string;
}

/** Qué cambio es: su tipo y su atributo o propiedad. */
interface What {
  kind: PatchKind;
  name: string;
}

/** Solo lo visual depende de la pantalla; el texto y los atributos valen en todas. */
const SCREEN_DEPENDENT: PatchKind[] = ["style", "hide"];

/** Leer y escribir los cambios del elemento elegido; cada campo es un cambio que se reemplaza al editarlo. */
export function usePatchEditing(picked: PickedElement, scope: PatchDevice) {
  const { state, dispatch } = useExternal();
  const { path, selector, label } = picked;

  const keyOf = ({ kind, name }: What) => ({
    path,
    selector,
    kind,
    name,
    device: SCREEN_DEPENDENT.includes(kind) ? scope : ("all" as const),
  });
  const find = (what: What) => state.patches.find((p) => p.id === patchId(keyOf(what)));

  const save = (what: What, value: string) => {
    const key = keyOf(what);
    dispatch({ type: "patch/save", patch: { ...key, label, value, id: patchId(key) } });
  };
  const remove = (patch: Patch) => dispatch({ type: "patch/remove", id: patch.id });

  const HIDE: What = { kind: "hide", name: "" };

  return {
    valueOf: (spec: EditSpec): string => find(spec)?.value.replace(/px$/, "") ?? spec.read(picked.el),
    isChanged: (spec: EditSpec) => find(spec) !== undefined,
    setValue: (spec: EditSpec, value: string) => {
      const existing = find(spec);
      if (value === "") return existing && remove(existing);
      save(spec, cssValue(spec.input, value));
    },
    isHidden: () => find(HIDE) !== undefined,
    toggleHidden: () => {
      const existing = find(HIDE);
      if (existing) remove(existing);
      else save(HIDE, "");
    },
    // Cada texto nuevo es un cambio distinto: lleva su propio id.
    insertAfter: (tag: string, text: string) => {
      const key = keyOf({ kind: "insert", name: tag });
      const id = `${patchId(key)}|${Date.now().toString(36)}`;
      dispatch({ type: "patch/save", patch: { ...key, id, label, value: text } });
    },
  };
}

"use client";

import { useState } from "react";
import type { PatchDevice } from "../types";
import { EditField } from "./edit-field";
import { InsertBelow } from "./insert-below";
import { EDIT_SPECS } from "./quick-edits";
import { ScopeSelect, SCOPE_LABELS } from "./scope-select";
import { usePatchEditing, type PickedElement } from "./use-patch-editing";

/** Los campos del elemento elegido en la página real. Cada cambio queda en la lista y se publica. */
export function Inspector({ picked, initialScope }: { picked: PickedElement; initialScope: PatchDevice }) {
  const [scope, setScope] = useState(initialScope);
  const editing = usePatchEditing(picked, scope);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md bg-hover px-3 py-2 text-xs">
        <p className="font-medium">{picked.label}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-ink-dim" title={picked.selector}>
          {picked.selector}
        </p>
      </div>

      <ScopeSelect value={scope} onChange={setScope} />

      {EDIT_SPECS.filter((spec) => spec.applies(picked.el)).map((spec) => (
        <EditField
          key={`${picked.selector}:${spec.id}:${scope}`}
          label={spec.label}
          input={spec.input}
          value={editing.valueOf(spec)}
          changed={editing.isChanged(spec)}
          onChange={(value) => editing.setValue(spec, value)}
        />
      ))}

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={editing.isHidden()} onChange={editing.toggleHidden} />
        Ocultar este elemento ({SCOPE_LABELS[scope].toLowerCase()})
      </label>

      <InsertBelow onInsert={editing.insertAfter} />
    </div>
  );
}

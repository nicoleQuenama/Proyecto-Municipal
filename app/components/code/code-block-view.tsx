"use client";

import { hasPermission, useAuth } from "../auth/auth-context";
import type { Library, CodeSource } from "../site/types";
import type { SharedAssets } from "./build-srcdoc";
import { CodeFrame } from "./code-frame";

interface CodeBlockViewProps {
  code: CodeSource;
  libraries: Library[];
  shared: SharedAssets;
  name: string;
  /** Al editar, un velo deja seleccionar el bloque (el iframe se «comería» los clics) y un botón abre el editor. */
  editing: boolean;
  onEdit: () => void;
}

/** Un bloque de código tal como se ve en una página. */
export function CodeBlockView({ code, libraries, shared, name, editing, onEdit }: CodeBlockViewProps) {
  const { currentUser } = useAuth();
  const canEditCode = hasPermission(currentUser?.role, "editCode");

  return (
    <div className="relative w-full">
      <CodeFrame code={code} libraries={libraries} shared={shared} title={name} />

      {editing && canEditCode && (
        <>
          <div className="absolute inset-0" onDoubleClick={onEdit} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute top-2 right-2 rounded-md bg-black/75 px-2 py-1 text-[11px] text-white hover:bg-accent"
          >
            Editar código
          </button>
        </>
      )}
    </div>
  );
}

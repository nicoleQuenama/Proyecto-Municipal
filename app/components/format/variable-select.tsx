"use client";

import { useState } from "react";
import { slugify } from "../site/rules";
import { asVariableRef, variableNameOf } from "../styles/resolve";
import type { Variable, VariableKind } from "../styles/types";
import type { CreateVariable } from "./format-variables";

const NEW_VARIABLE = "__new__";

const fieldClass =
  "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

interface VariableSelectProps {
  kind: VariableKind;
  label: string;
  /** Lo guardado en el bloque: `var(--nombre)` si está enlazado a una variable, o un valor suelto. */
  raw: string | number | undefined;
  /** El valor que se ve ahora: con él se crea una variable nueva y se queda al soltar la actual. */
  literal: string;
  /** Las variables que valen aquí; se muestran las de este tipo. */
  variables: Variable[];
  createVariable: CreateVariable;
  /** Recibe `var(--nombre)` o, al soltar la variable, el valor suelto. */
  onChange: (raw: string) => void;
}

/** Elegir una variable del proyecto para un valor, soltarla, o crear una nueva con el valor actual. */
export function VariableSelect({ kind, label, raw, literal, variables, createVariable, onChange }: VariableSelectProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const options = variables.filter((variable) => variable.kind === kind);
  const bound = typeof raw === "string" ? variableNameOf(raw) : null;
  const selected = bound !== null && options.some((variable) => variable.name === bound) ? (raw as string) : "";

  const pick = (value: string) => {
    if (value === NEW_VARIABLE) return setCreating(true);
    setCreating(false);
    onChange(value === "" ? literal : value);
  };

  const create = () => {
    const problem = createVariable(kind, name, literal);
    if (problem) return setError(problem);

    onChange(asVariableRef(slugify(name)));
    setCreating(false);
    setName("");
    setError(null);
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <select
        aria-label={label}
        title={label}
        value={creating ? NEW_VARIABLE : selected}
        onChange={(e) => pick(e.target.value)}
        className={`${fieldClass} w-full min-w-0 ${selected ? "border-accent text-accent" : ""}`}
      >
        <option value="">{selected ? "Sin variable" : "Variable…"}</option>
        {options.map((variable) => (
          <option key={variable.id} value={asVariableRef(variable.name)}>
            --{variable.name}
          </option>
        ))}
        <option value={NEW_VARIABLE}>＋ Nueva variable…</option>
      </select>

      {creating && (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <input
              autoFocus
              aria-label="Nombre de la variable nueva"
              aria-invalid={error !== null}
              placeholder="color-acento"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && create()}
              className={`${fieldClass} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={create}
              className="h-8 shrink-0 rounded-md bg-accent px-2 text-xs text-white hover:opacity-90"
            >
              Crear
            </button>
          </div>
          {error && <span role="alert" className="text-[11px] text-red-400">{error}</span>}
        </div>
      )}
    </div>
  );
}

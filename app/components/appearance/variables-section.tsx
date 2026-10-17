"use client";

import { useState, type Dispatch, type FormEvent } from "react";
import { VARIABLE_KIND_LABELS } from "../styles/registry";
import { availableVariables, sameScope, validateVariable } from "../styles/resolve";
import type { StyleContext, StyleScope, Variable, VariableKind } from "../styles/types";
import type { SiteAction } from "../site/types";
import { FONT_OPTIONS } from "../title-editor/constants";
import { Collapsible } from "../ui/collapsible";
import { LiteralInput } from "./literal-input";

const DEFAULT_VALUES: Record<VariableKind, string> = {
  color: "#0d99ff",
  size: "16px",
  font: FONT_OPTIONS[0].value,
};

const fieldClass =
  "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

interface VariablesSectionProps {
  scope: StyleScope;
  ctx: StyleContext;
  variables: Variable[];
  dispatch: Dispatch<SiteAction>;
}

function VariableRow({ variable, dispatch }: { variable: Variable; dispatch: Dispatch<SiteAction> }) {
  return (
    <li className="flex items-center gap-2">
      <code className="w-28 shrink-0 truncate text-xs" title={`--${variable.name}`}>--{variable.name}</code>
      <div className="min-w-0 flex-1">
        <LiteralInput
          kind={variable.kind}
          label={`Valor de --${variable.name}`}
          value={variable.value}
          onCommit={(value) => value && dispatch({ type: "variable/save", variable: { ...variable, value } })}
        />
      </div>
      <button
        type="button"
        aria-label={`Eliminar --${variable.name}`}
        title="Eliminar variable"
        onClick={() => dispatch({ type: "variable/delete", id: variable.id })}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-red-400"
      >
        ×
      </button>
    </li>
  );
}

function NewVariableForm({
  scope,
  variables,
  dispatch,
}: {
  scope: StyleScope;
  variables: Variable[];
  dispatch: Dispatch<SiteAction>;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<VariableKind>("color");
  const [value, setValue] = useState(DEFAULT_VALUES.color);
  const [error, setError] = useState<string | null>(null);

  const changeKind = (next: VariableKind) => {
    setKind(next);
    setValue(DEFAULT_VALUES[next]);
    setError(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const candidate: Variable = { id: crypto.randomUUID(), scope, name: name.trim(), kind, value };

    const problem = validateVariable(variables, candidate);
    if (problem) return setError(problem);

    dispatch({ type: "variable/save", variable: candidate });
    setName("");
    setValue(DEFAULT_VALUES[kind]);
    setError(null);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-lg border border-dashed border-line p-3">
      <div className="flex gap-2">
        <input
          aria-label="Nombre de la variable"
          placeholder="nombre (p. ej. color-acento)"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          className={`${fieldClass} min-w-0 flex-1`}
        />
        <select
          aria-label="Tipo de variable"
          value={kind}
          onChange={(e) => changeKind(e.target.value as VariableKind)}
          className={fieldClass}
        >
          {(Object.keys(VARIABLE_KIND_LABELS) as VariableKind[]).map((option) => (
            <option key={option} value={option}>{VARIABLE_KIND_LABELS[option]}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <LiteralInput
            key={kind}
            kind={kind}
            label="Valor de la nueva variable"
            value={value}
            onCommit={(next) => next && setValue(next)}
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="h-8 shrink-0 rounded-md bg-accent px-3 text-xs font-medium text-white disabled:opacity-40"
        >
          Agregar
        </button>
      </div>

      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </form>
  );
}

/** Variables del ámbito elegido (como un `:root`) y, aparte, las que hereda de más arriba. */
export function VariablesSection({ scope, ctx, variables, dispatch }: VariablesSectionProps) {
  const own = variables.filter((variable) => sameScope(variable.scope, scope));
  const inherited = availableVariables(variables, ctx).filter(
    (variable) => !sameScope(variable.scope, scope) && !own.some((v) => v.name === variable.name),
  );

  return (
    <Collapsible title={`Variables (${own.length})`} defaultOpen={false}>

      {own.length > 0 && (
        <ul className="flex flex-col gap-2">
          {own.map((variable) => (
            <VariableRow key={variable.id} variable={variable} dispatch={dispatch} />
          ))}
        </ul>
      )}

      <NewVariableForm scope={scope} variables={variables} dispatch={dispatch} />

      {inherited.length > 0 && (
        <details className="text-xs text-ink-dim">
          <summary className="cursor-pointer select-none hover:text-ink">
            Heredadas de más arriba ({inherited.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {inherited.map((variable) => (
              <li key={variable.id} className="flex justify-between gap-2">
                <code>--{variable.name}</code>
                <span className="truncate">{variable.value}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Collapsible>
  );
}

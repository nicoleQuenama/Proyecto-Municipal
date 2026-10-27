"use client";

import { useState } from "react";
import type { Access, Restriction, Scope } from "../auth/access";
import { hasPermission, useAuth } from "../auth/auth-context";
import type { User } from "../auth/types";
import { ABILITIES, DEFAULT_DENIED, MODES, modeOf, type AccessMode } from "./access-presets";
import { ExpiryPicker } from "./expiry-picker";
import { SectionPicker } from "./section-picker";

interface AccessEditorProps {
  user: User;
  saving: boolean;
  onSave: (access: Access) => void;
  onCancel: () => void;
}

const EMPTY_SCOPE: Scope = { pageIds: [], blockIds: [] };

/** Una frase que resume lo que quedará guardado, para que se entienda antes de confirmar. */
function sentence(name: string, mode: AccessMode, scope: Scope, vetoed: string[]): string {
  const first = name.split(" ")[0];
  if (mode === "view") return `${first} podrá ver el proyecto, sin cambiar nada.`;
  const where = mode === "all" ? "editar todo el proyecto" : `editar ${scope.pageIds.length + scope.blockIds.length} partes del proyecto`;
  return `${first} podrá ${where}${vetoed.length ? ` y no podrá ${vetoed.join(", ")}` : ""}.`;
}

/** Dar acceso a una cuenta en tres pasos: cuánto puede editar, dónde y qué cosas especiales puede hacer. */
export function AccessEditor({ user, saving, onSave, onCancel }: AccessEditorProps) {
  const [mode, setMode] = useState<AccessMode>(modeOf(user.access));
  const [scope, setScope] = useState<Scope>(user.access?.scope ?? EMPTY_SCOPE);
  const [denied, setDenied] = useState<Restriction[]>(user.access?.denied ?? []);
  const [expiresAt, setExpiresAt] = useState<string | null>(user.access?.expiresAt ?? null);
  const { currentUser } = useAuth();

  const chooseMode = (next: AccessMode) => {
    setMode(next);
    setDenied(DEFAULT_DENIED[next]);
  };
  const toggleAbility = (restriction: Restriction) =>
    setDenied(denied.includes(restriction) ? denied.filter((r) => r !== restriction) : [...denied, restriction]);

  const vetoed = ABILITIES.filter((a) => denied.includes(a.restriction) && hasPermission(user.role, a.permission)).map((a) => a.label.toLowerCase());
  const access: Access = { scope: mode === "all" ? null : mode === "view" ? EMPTY_SCOPE : scope, denied, expiresAt };

  return (
    <div className="flex flex-col gap-5 rounded-lg bg-hover p-4 text-xs">
      <section className="flex flex-col gap-2">
        <h4 className="font-semibold">1. ¿Cuánto puede editar?</h4>
        <div role="radiogroup" aria-label="Cuánto puede editar" className="grid gap-2 sm:grid-cols-3">
          {MODES.map(({ id, title, description }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              onClick={() => chooseMode(id)}
              className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors ${
                mode === id ? "border-accent bg-accent/10" : "border-line bg-canvas hover:border-ink-dim"
              }`}
            >
              <span className="font-medium">{title}</span>
              <span className="text-[11px] text-ink-dim">{description}</span>
            </button>
          ))}
        </div>
      </section>

      {mode === "part" && (
        <section className="flex flex-col gap-2">
          <h4 className="font-semibold">2. ¿En qué parte trabaja?</h4>
          <SectionPicker scope={scope} onChange={setScope} />
        </section>
      )}

      {mode !== "view" && (
        <section className="flex flex-col gap-2">
          <h4 className="font-semibold">{mode === "part" ? "3" : "2"}. ¿Qué más puede hacer?</h4>
          <ul className="flex flex-col gap-1.5">
            {ABILITIES.map(({ restriction, label, hint, permission }) => {
              // Solo se puede dar lo que uno tiene, y lo que el rol de la otra persona incluye.
              const mine = hasPermission(currentUser, permission);
              const inRole = hasPermission(user.role, permission) && mine;
              return (
                <li key={restriction}>
                  <label className={`flex items-start gap-2.5 rounded-md bg-canvas px-3 py-2 ${inRole ? "" : "opacity-50"}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      disabled={!inRole}
                      checked={inRole && !denied.includes(restriction)}
                      onChange={() => toggleAbility(restriction)}
                    />
                    <span>
                      <span className="block font-medium">{label}</span>
                      <span className="block text-[11px] text-ink-dim">{inRole ? hint : mine ? "Su rol no lo incluye." : "Tú tampoco tienes este permiso."}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h4 className="font-semibold">{mode === "all" ? "3" : mode === "view" ? "2" : "4"}. ¿Hasta cuándo tiene acceso?</h4>
        <ExpiryPicker value={expiresAt} onChange={setExpiresAt} limit={currentUser?.access?.expiresAt ?? null} />
      </section>

      <p className="rounded-md bg-canvas px-3 py-2 text-[13px]" aria-live="polite">
        {sentence(user.name, mode, scope, vetoed)}
      </p>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-8 rounded-md px-3 text-ink-dim hover:bg-canvas hover:text-ink">
          Cancelar
        </button>
        <button type="button" disabled={saving} onClick={() => onSave(access)} className="h-8 rounded-md bg-accent px-4 font-medium text-white disabled:opacity-40">
          {saving ? "Guardando…" : "Guardar acceso"}
        </button>
      </div>
    </div>
  );
}

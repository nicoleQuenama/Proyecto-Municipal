"use client";

import { PASSWORD_RULES, passwordReady } from "./password-rules";

//Lista en vivo de requisitos: cada regla se marca cuando se cumple.
export function PasswordRequirements({ value }: { value: string }) {
  const ready = passwordReady(value);

  return (
    <div
      aria-live="polite"
      className={`rounded-xl border px-3 py-2 text-[11px] ${
        ready ? "border-green-500/40 bg-green-500/10 text-green-300" : "border-line bg-canvas/60 text-ink-dim"
      }`}
    >
      <p className="mb-1 font-semibold">{ready ? "Contraseña lista para guardar" : "Tu contraseña debe tener:"}</p>
      <ul className="grid gap-0.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li key={rule.id} className={ok ? "text-green-400" : ""}>
              <span aria-hidden>{ok ? "✓" : "•"}</span> {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

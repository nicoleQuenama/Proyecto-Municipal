"use client";

import { useState } from "react";
import { dateInputValue, describeExpiry, DURATIONS, expiryIn, expiryOnDate } from "./expiry";

interface ExpiryPickerProps {
  value: string | null;
  onChange: (expiresAt: string | null) => void;
  /** El vencimiento de quien invita: nadie puede dar más tiempo del que tiene, ni quedarse sin límite si el otro lo tiene. */
  limit: string | null;
}

const CHIP = "h-8 rounded-md border px-3 text-xs transition-colors";

/** Elegir hasta cuándo dura el acceso: 1 semana, 2 semanas, 1 mes, una fecha propia o sin límite. */
export function ExpiryPicker({ value, onChange, limit }: ExpiryPickerProps) {
  // Qué botón está marcado: una duración, «personalizado» (fecha propia) o «sin límite».
  const [choice, setChoice] = useState<string>(value === null ? "none" : "custom");
  const custom = choice === "custom";
  const maxDate = dateInputValue(limit);
  const tooFar = (expiresAt: string) => limit !== null && Date.parse(expiresAt) > Date.parse(limit);

  const pick = (id: string, days: number) => {
    setChoice(id);
    onChange(expiryIn(days));
  };
  const chip = (active: boolean) => `${CHIP} ${active ? "border-accent bg-accent/10 text-accent" : "border-line bg-canvas hover:border-ink-dim"}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Duración del acceso">
        {DURATIONS.map(({ id, label, days }) => (
          <button key={id} type="button" disabled={tooFar(expiryIn(days))} onClick={() => pick(id, days)} className={`${chip(choice === id)} disabled:opacity-40`}>
            {label}
          </button>
        ))}
        <button type="button" onClick={() => setChoice("custom")} className={chip(custom)}>
          Personalizado
        </button>
        <button
          type="button"
          disabled={limit !== null}
          title={limit ? "Quien te invitó tiene fecha de vencimiento: tu invitado no puede pasarla." : undefined}
          onClick={() => {
            setChoice("none");
            onChange(null);
          }}
          className={`${chip(choice === "none")} disabled:opacity-40`}
        >
          Sin límite
        </button>
      </div>

      {custom && (
        <label className="flex items-center gap-2 text-xs">
          Vence el
          <input
            type="date"
            min={dateInputValue(new Date().toISOString())}
            max={maxDate || undefined}
            value={dateInputValue(value)}
            onChange={(e) => onChange(expiryOnDate(e.target.value))}
            className="h-8 rounded-md border border-line bg-canvas px-2 outline-none focus:border-accent"
          />
        </label>
      )}

      <p className="text-[11px] text-ink-dim" aria-live="polite">
        {describeExpiry(value)}. Al vencer, la persona ya no puede entrar al proyecto; puedes renovarlo o quitarle el acceso cuando quieras.
      </p>
    </div>
  );
}

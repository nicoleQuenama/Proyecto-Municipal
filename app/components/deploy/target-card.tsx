"use client";

import { useState } from "react";
import type { KindInfo, Outcome, SavedTarget, TargetKind } from "./use-deploy";

const field = "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent";

interface TargetCardProps {
  kind: TargetKind;
  info: KindInfo;
  saved: SavedTarget | undefined;
  outcome: Outcome;
  onSave: (values: Record<string, string>) => Promise<void>;
  onRemove: () => Promise<void>;
  onRun: () => Promise<void>;
}

/** Un destino de despliegue: sus datos, con los secretos que solo se escriben (nunca se muestran), y su botón de desplegar. */
export function TargetCard({ kind, info, saved, outcome, onSave, onRemove, onRun }: TargetCardProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(saved?.values ?? {});
  const mine = "target" in outcome && outcome.target === kind;

  return (
    <section className="rounded-lg border border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium">
        <span>{info.label}</span>
        <span className="text-ink-dim">{saved ? "Configurado" : "Sin configurar"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-line p-3">
          {info.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-[11px] text-ink-dim">
              {f.label}
              <input
                type={f.secret ? "password" : "text"}
                autoComplete="off"
                value={values[f.key] ?? ""}
                placeholder={f.secret && saved?.secretsSet.includes(f.key) ? "•••••• (guardado; escribe para cambiarlo)" : ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className={field}
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void onSave(values)} className="h-8 rounded-md border border-line px-3 text-xs hover:bg-hover">
              Guardar
            </button>
            {saved && (
              <>
                <button type="button" onClick={() => void onRun()} className="h-8 rounded-md bg-accent px-3 text-xs text-white">
                  {mine && outcome.kind === "working" ? "Desplegando…" : "Desplegar ahora"}
                </button>
                <button type="button" onClick={() => void onRemove()} className="h-8 rounded-md px-3 text-xs text-red-400 hover:bg-hover">
                  Quitar
                </button>
              </>
            )}
          </div>
          {mine && outcome.kind === "ok" && (
            <p className="text-xs text-emerald-400">
              Listo.{" "}
              {outcome.url && (
                <a href={outcome.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {outcome.url}
                </a>
              )}
            </p>
          )}
          {mine && outcome.kind === "error" && <p className="text-xs text-red-400">{outcome.message}</p>}
        </div>
      )}
    </section>
  );
}

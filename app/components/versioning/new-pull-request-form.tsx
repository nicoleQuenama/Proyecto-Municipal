"use client";

import { useState, type FormEvent } from "react";
import { nextNumber } from "./versioning-reducer";
import { useVersioning } from "./versioning-context";

const selectClass =
  "h-9 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 text-[13px] outline-none focus:border-accent [&>option]:bg-panel";

export function NewPullRequestForm({ onCreated }: { onCreated: (number: number) => void }) {
  const { state, dispatch, mustBranch, submitReview } = useVersioning();
  const names = state.branches.map((b) => b.name);
  const main = state.branches.find((b) => b.base === null)?.name ?? "main";

  const [title, setTitle] = useState("");
  const [from, setFrom] = useState(state.current === "main" ? (names[1] ?? names[0]) : state.current);
  const [into, setInto] = useState(main);
  const [error, setError] = useState<string | null>(null);

  const problemWith = (): string | null => {
    if (from === into) return "Elige ramas distintas.";
    const duplicate = state.pullRequests.some(
      (pr) => pr.status === "open" && pr.from === from && pr.into === into,
    );
    return duplicate ? "Ya hay un pull request abierto entre esas ramas." : null;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const problem = problemWith();
    if (problem) return setError(problem);

    // Quien no puede publicar en main la envía por el servidor: la recibe quien lo invitó.
    if (mustBranch) {
      setError(null);
      submitReview(title.trim(), from, into).then(onCreated, (reason) => setError(reason instanceof Error ? reason.message : "No se pudo enviar."));
      return;
    }
    const number = nextNumber(state.pullRequests);
    dispatch({ type: "pr/open", title: title.trim(), from, into });
    onCreated(number);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold">Nuevo pull request</h2>

      <input
        autoFocus
        aria-label="Título del pull request"
        placeholder="¿Qué cambios propones?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-9 rounded-md border border-line bg-canvas px-3 text-[13px] outline-none placeholder:text-ink-dim focus:border-accent"
      />

      <div className="flex items-center gap-2 text-xs text-ink-dim">
        <select
          aria-label="Rama de origen"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setError(null); }}
          className={selectClass}
        >
          {names.map((name) => <option key={name}>{name}</option>)}
        </select>
        <span aria-hidden>→</span>
        <select
          aria-label="Rama de destino"
          value={into}
          onChange={(e) => { setInto(e.target.value); setError(null); }}
          className={selectClass}
        >
          {names.map((name) => <option key={name}>{name}</option>)}
        </select>
      </div>
      {mustBranch && (
        <p className="text-xs text-ink-dim">Esta pull request la recibirá solo quien te invitó al grupo.</p>
      )}

      {names.length < 2 && (
        <p className="text-xs text-amber-400">
          Necesitas al menos dos borradores (ramas). Crea uno en la sección Borradores.
        </p>
      )}

      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!title.trim() || names.length < 2}
        className="h-8 self-start rounded-md bg-accent px-3 text-xs font-medium text-white disabled:opacity-40"
      >
        Crear pull request
      </button>
    </form>
  );
}

import { DEMO_ACCOUNTS } from "./login-data";

export function LoginDemoAccess({
  onPick,
}: {
  onPick: (username: string, password: string) => void;
}) {
  return (
    <details className="group mt-6 rounded-xl border border-line/80 bg-canvas/50 px-4 py-3 text-xs text-ink-dim">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-ink-dim transition-colors hover:text-ink">
        <span className="flex items-center gap-2">
          <span className="rounded bg-hover px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-ink-dim uppercase">
            Demo
          </span>
          Credenciales de prueba
        </span>
        <span aria-hidden className="text-ink-dim transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-2 border-t border-line/70 pt-3">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.username}
            type="button"
            onClick={() => onPick(account.username, account.password)}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-hover"
          >
            <span className="min-w-0">
              <span className="block font-mono text-[11px] text-ink">{account.username}</span>
              <span className="block font-mono text-[10px] text-ink-dim">{account.password}</span>
            </span>
            <span className="shrink-0 text-[10px] text-ink-dim">{account.role}</span>
          </button>
        ))}
      </div>
    </details>
  );
}

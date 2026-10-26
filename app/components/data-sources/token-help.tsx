import { TOKEN_HELP } from "./url-tokens";

/** Las claves que se pueden escribir en la URL o en los parámetros (`{param:id}`, `{today}`…). */
export function TokenHelp() {
  return (
    <details className="text-[11px] text-ink-dim">
      <summary className="cursor-pointer select-none hover:text-ink">Claves para la URL</summary>
      <ul className="mt-1 flex flex-col gap-1">
        {TOKEN_HELP.map(({ token, text }) => (
          <li key={token}>
            <code className="rounded bg-hover px-1 text-ink">{token}</code> {text}
          </li>
        ))}
      </ul>
    </details>
  );
}

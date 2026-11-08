import { Avatar } from "./avatar";
import { ROLE_LABELS, type User } from "./types";
import { ROLE_BADGE } from "./user-ui";

interface UserRowProps {
  user: User;
  isCurrent: boolean;
  resetting: boolean;
  removing: boolean;
  onReset: () => void;
  onRemove: () => void;
}

/** Una cuenta del equipo: sus datos, su rol y las acciones de restablecer o eliminar. */
export function UserRow({ user, isCurrent, resetting, removing, onReset, onRemove }: UserRowProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-line bg-panel p-2.5">
      <Avatar user={user} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-medium text-ink">{user.name}</p>
          {isCurrent && (
            <span className="shrink-0 rounded bg-hover px-1 py-0.5 text-[8px] font-semibold tracking-wider text-ink-dim uppercase">
              Tú
            </span>
          )}
        </div>
        <p className="truncate text-[10px] text-ink-dim">@{user.username}</p>
        <p className="truncate text-[10px] text-ink-dim">{user.email}</p>
        <span
          className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-semibold tracking-wider uppercase ${ROLE_BADGE[user.role]}`}
        >
          {ROLE_LABELS[user.role]}
        </span>
      </div>
      {!isCurrent && (
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            disabled={resetting}
            onClick={onReset}
            className="rounded-md px-1.5 py-1 text-[10px] text-ink-dim transition-colors hover:bg-hover disabled:opacity-50 cursor-pointer"
          >
            {resetting ? "..." : "Restablecer"}
          </button>
          <button
            type="button"
            disabled={removing}
            onClick={onRemove}
            className="rounded-md px-1.5 py-1 text-[10px] text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50 cursor-pointer"
          >
            {removing ? "..." : "Eliminar"}
          </button>
        </div>
      )}
    </div>
  );
}

import { Avatar } from "./avatar";
import { ROLE_LABELS, type User } from "./types";
import { ROLE_BADGE } from "./user-ui";

export function UserList({
  users,
  currentUserId,
  loading,
  removingId,
  onRemove,
}: {
  users: User[];
  currentUserId: string | undefined;
  loading: boolean;
  removingId: string | null;
  onRemove: (id: string, username: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-wider text-ink-dim uppercase">
          Usuarios · {users.length}
        </p>
        {loading && <span className="text-[10px] text-ink-dim">Cargando…</span>}
      </div>

      {!loading && users.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11px] text-ink-dim">
          Todavía no hay usuarios.
        </p>
      )}

      {users.map((user) => (
        <div key={user.id} className="flex items-start gap-2.5 rounded-xl border border-line bg-panel p-2.5">
          <Avatar user={user} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-medium text-ink">{user.name}</p>
              {user.id === currentUserId && (
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
          {user.id !== currentUserId && (
            <button
              type="button"
              disabled={removingId === user.id}
              onClick={() => onRemove(user.id, user.username)}
              title={`Eliminar a ${user.name}`}
              aria-label={`Eliminar a ${user.name}`}
              className="shrink-0 rounded-md px-1.5 py-1 text-[10px] text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              {removingId === user.id ? "…" : "Eliminar"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

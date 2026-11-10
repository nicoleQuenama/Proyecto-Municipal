import { Avatar } from "../auth/avatar";
import { ROLE_LABELS, type User } from "../auth/types";
import { ROLE_BADGE } from "../auth/user-ui";

interface Props {
  user: User;
  cols: string;
  unitNames: string[];
  isCurrent: boolean;
  /** Si hay una unidad elegida: si esta persona está en ella. */
  member: boolean;
  showMember: boolean;
  globalEditor: boolean;
  resetting: boolean;
  removing: boolean;
  onMember: () => void;
  onGlobal: () => void;
  onReset: () => void;
  onRemove: () => void;
}

const action = "h-8 rounded-md px-2.5 text-xs transition-colors disabled:opacity-50 cursor-pointer";

/** Una persona por fila: quién es, su rol, sus unidades y, con una casilla, si pertenece a la unidad elegida o edita lo global. */
export function PersonRow({ user, cols, unitNames, isCurrent, member, showMember, globalEditor, resetting, removing, onMember, onGlobal, onReset, onRemove }: Props) {
  const everything = user.role === "superadmin";
  return (
    <li className={`grid items-center gap-4 border-b border-line px-4 py-3 last:border-b-0 hover:bg-hover/40 ${cols}`}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar user={user} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">
            {user.name}
            <span className={`ml-2 rounded bg-hover px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-dim ${isCurrent ? "" : "hidden"}`}>Tú</span>
          </p>
          <p className="truncate text-xs text-ink-dim">{user.email}</p>
        </div>
      </div>
      <span className={`w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${ROLE_BADGE[user.role]}`}>{ROLE_LABELS[user.role]}</span>
      <p className="truncate text-xs text-ink-dim" title={unitNames.join(", ")}>{everything ? "Todas" : unitNames.join(", ") || "—"}</p>
      <label className={`flex items-center gap-2 text-xs text-ink ${showMember ? "" : "hidden"}`}>
        <input type="checkbox" className="h-4 w-4" checked={member} disabled={everything} onChange={onMember} aria-label={`${user.name} pertenece a la unidad`} />
        En la unidad
      </label>
      <label className="flex items-center gap-2 text-xs text-ink">
        <input type="checkbox" className="h-4 w-4" checked={globalEditor || everything} disabled={everything} onChange={onGlobal} aria-label={`${user.name} edita lo global`} />
        Edita global
      </label>
      <div className="flex justify-end gap-1">
        <button type="button" disabled={resetting || isCurrent} onClick={onReset} className={`${action} border border-line text-ink hover:bg-hover`}>{resetting ? "Enviando…" : "Restablecer"}</button>
        <button type="button" disabled={removing || isCurrent} onClick={onRemove} className={`${action} text-red-400 hover:bg-red-500/10`}>{removing ? "…" : "Eliminar"}</button>
      </div>
    </li>
  );
}

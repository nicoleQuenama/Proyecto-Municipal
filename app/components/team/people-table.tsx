"use client";

import { useState } from "react";
import { resetPassword } from "../auth/auth-api";
import type { User } from "../auth/types";
import { useToast } from "../ui/toast";
import type { Unit } from "../../server/units/unit-store";
import { unitsOfUser } from "./filter-people";
import { Pager } from "./pager";
import { paginate } from "./paginate";
import { PersonRow } from "./person-row";

export const PAGE_SIZE = 15;
const COLS_ALL = "grid-cols-[minmax(0,2.2fr)_9rem_minmax(0,1.5fr)_8rem_15rem]";
const COLS_UNIT = "grid-cols-[minmax(0,2.2fr)_9rem_minmax(0,1.5fr)_8rem_8rem_15rem]";

interface Props {
  users: User[];
  units: Unit[];
  /** La unidad elegida en la lista; sin ella se ven todas las personas. */
  unit: Unit | null;
  globalIds: string[];
  pageNumber: number;
  onPage: (page: number) => void;
  currentUserId: string | undefined;
  loading: boolean;
  removingId: string | null;
  emptyText: string;
  onRemove: (id: string, username: string) => void;
  onMember: (unit: Unit, userId: string) => void;
  onGlobal: (userId: string) => void;
}

const head = "text-[11px] font-semibold uppercase tracking-wider text-ink-dim";

/** La tabla de personas, de a 15 por página. Las contraseñas temporales se envían por correo, nunca se muestran. */
export function PeopleTable({ users, units, unit, globalIds, pageNumber, onPage, currentUserId, loading, removingId, emptyText, onRemove, onMember, onGlobal }: Props) {
  const toast = useToast();
  const [resetting, setResetting] = useState<string | null>(null);
  const page = paginate(users, pageNumber, PAGE_SIZE);
  const cols = unit ? COLS_UNIT : COLS_ALL;

  const reset = async (user: User) => {
    setResetting(user.id);
    try {
      await resetPassword(user.id);
      toast.success(`Contraseña restablecida. Se envió a ${user.email}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo restablecer la contraseña.");
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className={`grid gap-4 border-b border-line bg-canvas/40 px-4 py-2.5 ${cols}`}>
        <span className={head}>Persona</span>
        <span className={head}>Rol</span>
        <span className={head}>Unidades</span>
        <span className={`${head} ${unit ? "" : "hidden"}`}>{unit?.name ?? ""}</span>
        <span className={head}>Global</span>
        <span className={`${head} text-right`}>Acciones</span>
      </div>
      <p className={`px-4 py-8 text-center text-sm text-ink-dim ${users.length || loading ? "hidden" : ""}`}>{emptyText}</p>
      <p className={`px-4 py-8 text-center text-sm text-ink-dim ${loading ? "" : "hidden"}`}>Cargando…</p>
      <ul>
        {page.items.map((user) => (
          <PersonRow
            key={user.id}
            user={user}
            cols={cols}
            unitNames={unitsOfUser(units, user.id).map((item) => item.name)}
            isCurrent={user.id === currentUserId}
            showMember={unit !== null}
            member={unit?.memberIds.includes(user.id) ?? false}
            globalEditor={globalIds.includes(user.id)}
            resetting={resetting === user.id}
            removing={removingId === user.id}
            onMember={() => unit && onMember(unit, user.id)}
            onGlobal={() => onGlobal(user.id)}
            onReset={() => void reset(user)}
            onRemove={() => onRemove(user.id, user.username)}
          />
        ))}
      </ul>
      <Pager page={page} onPage={onPage} />
    </div>
  );
}

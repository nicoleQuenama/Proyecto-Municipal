"use client";

import { useRef, useState } from "react";
import { useDismiss } from "../ui/use-dismiss";
import { ChevronIcon, LogoutIcon, UserIcon } from "../viewport/icons";
import { logout } from "./auth-api";
import { useAuth, useAuthDispatch } from "./auth-context";
import { Avatar } from "./avatar";
import { ProfileDialog } from "./profile-dialog";
import { ROLE_LABELS } from "./types";

export function ProfileMenu() {
  const { currentUser } = useAuth();
  const dispatch = useAuthDispatch();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useDismiss(ref, open, () => setOpen(false));
  if (!currentUser) return null;

  const handleLogout = async () => {
    setPending(true);
    try {
      await logout();
    } finally {
      setOpen(false);
      setProfileOpen(false);
      setPending(false);
      dispatch({ type: "auth/logout" });
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Abrir menú de perfil"
        aria-haspopup="menu"
        aria-expanded={open}
        title={`${currentUser.name} · ${ROLE_LABELS[currentUser.role]}`}
        onClick={() => setOpen((value) => !value)}
        className="group flex items-center gap-1 rounded-full p-0.5 pr-1 transition-colors hover:bg-hover"
      >
        <Avatar user={currentUser} />
        <span className="text-ink-dim transition-colors group-hover:text-ink">
          <ChevronIcon size={10} />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menú de perfil"
          className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-panel shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-line bg-canvas/50 p-4">
            <Avatar user={currentUser} large />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{currentUser.name}</p>
              <p className="truncate text-[11px] text-ink-dim">@{currentUser.username}</p>
            </div>
          </div>

          <div className="p-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setProfileOpen(true);
              }}
              className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-ink transition-colors hover:bg-hover"
            >
              <UserIcon />
              Ver perfil
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={handleLogout}
              className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              <LogoutIcon />
              {pending ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>

          <div className="border-t border-line px-4 py-2.5 text-[10px] text-ink-dim">
            {currentUser.email}
          </div>
        </div>
      )}

      {profileOpen && <ProfileDialog user={currentUser} onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { fetchCurrentUser } from "./auth-api";
import { authReducer, INITIAL_AUTH } from "./auth-reducer";
import type { Restriction } from "./access";
import type { AuthAction, AuthState, User } from "./types";

const RECHECK_MS = 60_000;

const AuthStateContext = createContext<AuthState | null>(null);
const AuthDispatchContext = createContext<Dispatch<AuthAction> | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, INITIAL_AUTH);

  useEffect(() => {
    let active = true;
    fetchCurrentUser().then((user) => {
      if (active) dispatch({ type: "auth/ready", user });
    });
    return () => {
      active = false;
    };
  }, []);

  // El acceso puede vencer o cambiar mientras se trabaja: se vuelve a comprobar cada minuto.
  const signedIn = state.status === "authenticated";
  useEffect(() => {
    if (!signedIn) return;
    const timer = setInterval(() => {
      fetchCurrentUser().then((user) => dispatch(user ? { type: "auth/login", user } : { type: "auth/logout" }));
    }, RECHECK_MS);
    return () => clearInterval(timer);
  }, [signedIn]);

  return (
    <AuthStateContext value={state}>
      <AuthDispatchContext value={dispatch}>{children}</AuthDispatchContext>
    </AuthStateContext>
  );
}

export function useAuth(): AuthState {
  const state = useContext(AuthStateContext);
  if (!state) throw new Error("Debe usarse dentro de <AuthProvider>");
  return state;
}

export function useAuthDispatch(): Dispatch<AuthAction> {
  const dispatch = useContext(AuthDispatchContext);
  if (!dispatch) throw new Error("Debe usarse dentro de <AuthProvider>");
  return dispatch;
}

export type Permission =
  | "viewAll" | "editContent" | "editStyles" | "editCode" | "editData" | "installLibraries" | "invite" | "publishMain" | "manageUsers" | "viewAudit";

/** Lo que el rol permite, menos lo que la cuenta tenga vetado. Con solo el rol (texto) no hay vetos. */
export function hasPermission(who: User | string | null | undefined, permission: Permission): boolean {
  const role = typeof who === "string" ? who : who?.role;
  if (typeof who === "object" && who?.access?.denied.includes(permission as Restriction)) return false;
  return roleAllows(role, permission);
}

function roleAllows(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  if (permission === "invite" || permission === "publishMain") return true; // cada rol puede formar su grupo; el veto lo pone quien lo invitó
  if (role === "superadmin") return true;
  if (role === "dev") {
    if (permission === "manageUsers") return false;
    return true;
  }
  if (role === "designer") {
    if (permission === "editStyles") return false;
    if (permission === "editCode" || permission === "editData" || permission === "installLibraries") return false;
    if (permission === "manageUsers") return false;
    if (permission === "viewAudit") return false;
    if (permission === "viewAll") return true;
    if (permission === "editContent") return true;
  }
  return false;
}

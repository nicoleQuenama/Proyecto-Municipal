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
import type { AuthAction, AuthState } from "./types";

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

export function hasPermission(
  role: string | undefined,
  permission: "viewAll" | "editContent" | "editStyles" | "editCode" | "manageUsers",
): boolean {
  if (!role) return false;
  if (role === "superadmin") return true;
  if (role === "dev") {
    if (permission === "manageUsers") return false;
    return true;
  }
  if (role === "designer") {
    if (permission === "editStyles") return false;
    if (permission === "editCode") return false;
    if (permission === "manageUsers") return false;
    if (permission === "viewAll") return true;
    if (permission === "editContent") return true;
  }
  return false;
}

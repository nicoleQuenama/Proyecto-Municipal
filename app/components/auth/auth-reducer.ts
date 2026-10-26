import type { AuthAction, AuthState } from "./types";

export const INITIAL_AUTH: AuthState = {
  status: "loading",
  currentUser: null,
  users: [],
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "auth/ready":
      return {
        ...state,
        status: action.user ? "authenticated" : "anonymous",
        currentUser: action.user,
      };
    case "auth/login":
      return { ...state, status: "authenticated", currentUser: action.user };
    case "auth/logout":
      return { ...state, status: "anonymous", currentUser: null, users: [] };
    case "users/set":
      return { ...state, users: action.users };
    case "user/create":
      return { ...state, users: [...state.users, action.user] };
    case "user/remove":
      return { ...state, users: state.users.filter((u) => u.id !== action.id) };
    default:
      return state;
  }
}

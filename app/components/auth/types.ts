export type UserRole = "superadmin" | "dev" | "designer";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Datos que se envían al crear un usuario. La contraseña nunca se guarda en el cliente. */
export interface NewUser {
  username: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthState {
  status: AuthStatus;
  currentUser: User | null;
  users: User[];
}

export type AuthAction =
  | { type: "auth/ready"; user: User | null }
  | { type: "auth/login"; user: User }
  | { type: "auth/logout" }
  | { type: "users/set"; users: User[] }
  | { type: "user/create"; user: User }
  | { type: "user/remove"; id: string };

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Superadministrador",
  dev: "Desarrollador",
  designer: "Diseñador",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  superadmin: "Acceso total, incluida la gestión de usuarios.",
  dev: "Edita contenido, estilos y código; no gestiona usuarios.",
  designer: "Edita contenido y estructura; sin estilos avanzados ni código.",
};

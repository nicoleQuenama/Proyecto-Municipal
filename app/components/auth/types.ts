import type { Access } from "./access";

export type UserRole = "superadmin" | "dev" | "designer";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  /** Acceso limitado dado por un superadministrador; sin él, la persona tiene todo lo de su rol. */
  access?: Access;
  /** La cuenta que la invitó; sin ella, la creó un superadministrador. */
  invitedBy?: string;
  /** Solo si la organización usa unidades y esta persona está sujeta a ellas: sus unidades, si puede editar lo global y si puede desplegar. */
  units?: { id: string; name: string }[];
  canEditGlobal?: boolean;
  canDeploy?: boolean;
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
  | { type: "user/remove"; id: string }
  | { type: "user/access"; id: string; access: Access };

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

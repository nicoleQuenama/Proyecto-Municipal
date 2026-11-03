import type { User } from "./types";

/** Solo el superadministrador define la paleta y los estilos globales del proyecto. */
export const canManageGlobalDesign = (user: User | null | undefined): boolean =>
  user?.role === "superadmin";

import type { User } from "./types";

/** Quien define la paleta y los estilos globales del proyecto: el superadministrador o quien tiene el permiso de editar lo global (la misma regla que la base de datos). */
export const canManageGlobalDesign = (user: User | null | undefined): boolean =>
  user?.role === "superadmin" || user?.canEditGlobal === true;

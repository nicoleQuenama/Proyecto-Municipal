import type { User } from "../components/auth/types";

/** Desplegar, exportar y configurar servidores: solo superadministradores y desarrolladores a quienes no se les vetó. */
export const canDeploy = (user: User | null): user is User =>
  user !== null && (user.role === "superadmin" || user.role === "dev") && !user.access?.denied.includes("deploy");

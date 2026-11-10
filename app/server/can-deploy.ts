import type { User } from "../components/auth/types";

/**
 * Desplegar y exportar. Quien trabaja en unidades usa lo que calculó la base de datos (`canDeploy`: el techo de su unidad, que por
 * defecto lo concede, con los vetos); el resto, la regla de siempre: superadministradores y desarrolladores a quienes no se les vetó.
 */
export const canDeploy = (user: User | null): user is User => {
  if (!user) return false;
  if (user.canDeploy !== undefined) return user.canDeploy;
  return (user.role === "superadmin" || user.role === "dev") && !user.access?.denied.includes("deploy");
};

/** Guardar o quitar los destinos (servidores y sus claves). Con unidades es de lo global: además de desplegar, tener ese permiso. */
export const canConfigureServers = (user: User | null): boolean => canDeploy(user) && (user?.units === undefined || user.canEditGlobal === true);

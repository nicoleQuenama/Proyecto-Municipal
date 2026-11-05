-- 0017 · Librerías instaladas con pnpm, por organización.
--
-- `pnpm add` escribe en el disco del servidor (node_modules), que es compartido; lo que SÍ es de cada organización es la lista
-- de paquetes que instaló. Sustituye al archivo `portal-libraries.json`. Un paquete solo se borra del disco cuando ninguna
-- organización lo tiene.
CREATE TABLE app.organization_packages (
  organization_id uuid        NOT NULL REFERENCES app.organizations (id) ON DELETE CASCADE,
  name            text        NOT NULL CHECK (length(name) BETWEEN 1 AND 214),
  version         text        NOT NULL,
  installed_by    uuid,
  installed_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, name),
  FOREIGN KEY (organization_id, installed_by) REFERENCES app.users (organization_id, id)
);

-- Qué paquetes instaló alguna organización: los sirve el empaquetador (el código de los sitios corre sin sesión) y evita que
-- una organización toque lo que es de otra o del propio proyecto. Solo devuelve nombres de paquetes públicos de npm.
CREATE FUNCTION app.installed_package_names() RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app, pg_temp AS
$$ SELECT DISTINCT name FROM app.organization_packages $$;

REVOKE ALL ON FUNCTION app.installed_package_names() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.installed_package_names() TO portal_app;

SELECT app.apply_rls();
SELECT app.apply_grants();

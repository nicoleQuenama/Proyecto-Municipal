-- 0001 · Fundaciones: esquema, extensiones, ids, funciones auxiliares y roles.
-- Requiere PostgreSQL 15 o superior (ON DELETE SET NULL (col), UNIQUE NULLS NOT DISTINCT).

CREATE SCHEMA IF NOT EXISTS app;

-- Correos y nombres sin distinguir mayúsculas.
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA app;

-- Ids UUIDv7 (ordenados por tiempo: los inserts caen al final del índice, sin fragmentarlo).
-- PG18+ trae uuidv7() de fábrica; en versiones anteriores se usa una implementación en SQL.
DO $$
BEGIN
  IF to_regprocedure('pg_catalog.uuidv7()') IS NOT NULL THEN
    EXECUTE $f$
      CREATE OR REPLACE FUNCTION app.new_id() RETURNS uuid
      LANGUAGE sql VOLATILE PARALLEL SAFE AS 'SELECT pg_catalog.uuidv7()'
    $f$;
  ELSE
    EXECUTE $f$
      CREATE OR REPLACE FUNCTION app.new_id() RETURNS uuid
      LANGUAGE sql VOLATILE PARALLEL SAFE AS $g$
        SELECT encode(
          set_bit(set_bit(
            overlay(uuid_send(gen_random_uuid())
                    PLACING substring(int8send((extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3)
                    FROM 1 FOR 6),
            52, 1), 53, 1),
          'hex')::uuid
      $g$
    $f$;
  END IF;
END
$$;

-- La organización de la transacción en curso. La API la fija con
--   SELECT set_config('app.org_id', '<uuid>', true)   (is_local = true → muere con la transacción)
-- y así funciona detrás de PgBouncer en modo transacción. Sin valor devuelve NULL: no se ve nada.
CREATE OR REPLACE FUNCTION app.current_org() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE AS
$$ SELECT nullif(current_setting('app.org_id', true), '')::uuid $$;

-- Mantiene updated_at y row_version (bloqueo optimista: UPDATE ... WHERE row_version = $leído).
CREATE OR REPLACE FUNCTION app.touch() RETURNS trigger
LANGUAGE plpgsql AS
$$
BEGIN
  NEW.updated_at := now();
  NEW.row_version := OLD.row_version + 1;
  RETURN NEW;
END
$$;

-- Roles de grupo (sin LOGIN). Quien despliega crea los roles con LOGIN y los une a estos:
--   CREATE ROLE portal_api LOGIN PASSWORD '…' IN ROLE portal_app;
--   portal_app       → la API del CMS; está sujeta a RLS, así que solo ve su organización.
--   portal_readonly  → soporte y analítica; solo lectura, también sujeta a RLS.
--   portal_platform  → trabajos de plataforma (monitoreo, alta de organizaciones); salta RLS.
-- El dueño de las tablas (quien migra) también salta RLS: la API NUNCA debe conectarse con él.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'portal_app') THEN
    CREATE ROLE portal_app NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'portal_readonly') THEN
    CREATE ROLE portal_readonly NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'portal_platform') THEN
    -- BYPASSRLS solo lo puede conceder un superusuario (p. ej. Supabase no lo es): sin él,
    -- la plataforma queda sujeta a RLS; para el uso del portal no hace falta saltarla.
    IF current_setting('is_superuser') = 'on' THEN
      CREATE ROLE portal_platform NOLOGIN BYPASSRLS;
    ELSE
      CREATE ROLE portal_platform NOLOGIN;
    END IF;
  END IF;
END
$$;

REVOKE ALL ON SCHEMA app FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO portal_app, portal_readonly, portal_platform;
GRANT EXECUTE ON FUNCTION app.new_id(), app.current_org() TO portal_app, portal_readonly, portal_platform;

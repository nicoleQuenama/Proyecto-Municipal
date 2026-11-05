#!/bin/sh
# Solo desarrollo: aplica las migraciones en orden y crea el usuario con el que se conecta la API.
# En producción las migraciones las corre quien despliega y el usuario/contraseña de la API los crea
# con un secreto propio (nunca el de este archivo).
set -e
for file in /migrations/*.sql; do
  echo "migrando $file"
  psql -v ON_ERROR_STOP=1 -q --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$file"
done
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
CREATE ROLE portal_api LOGIN PASSWORD 'portal_api_dev' IN ROLE portal_app CONNECTION LIMIT 50;
ALTER ROLE portal_api SET search_path = app, pg_catalog;
ALTER ROLE portal_api SET statement_timeout = '15s';
ALTER ROLE portal_api SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE portal_api SET lock_timeout = '2s';
SQL

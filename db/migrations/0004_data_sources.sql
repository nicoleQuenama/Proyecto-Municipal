-- 0004 · Fuentes de datos (pestaña Datos). Proyecto 1 ── N fuentes.
--
-- Las cabeceras suelen llevar secretos (Authorization: Bearer …). Se guardan CIFRADAS por la API
-- (AES-256-GCM con una clave que vive en el servidor / KMS, nunca en la base de datos): si alguien
-- obtiene un volcado de la base, no obtiene las claves de las APIs de los clientes.
-- Los parámetros de consulta no son secretos y se guardan legibles.
CREATE TABLE app.data_sources (
  id              text        NOT NULL DEFAULT app.new_id()::text CHECK (length(id) BETWEEN 1 AND 100),
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  name            text        NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  url             text        NOT NULL CHECK (url ~* '^https?://'),
  method          text        NOT NULL DEFAULT 'GET' CHECK (method IN ('GET', 'POST')),
  query           jsonb       NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(query) = 'array'),
  headers_enc     bytea,
  -- La transformación opcional de la respuesta es código: vive como AST en code_units (slot «transform»).
  cache_kind      text        NOT NULL DEFAULT 'swr' CHECK (cache_kind IN ('swr', 'ttl', 'session', 'persistent')),
  -- Solo cuenta con la estrategia «ttl»; las demás la ignoran.
  cache_seconds   int         NOT NULL DEFAULT 0 CHECK (cache_seconds BETWEEN 0 AND 31536000),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  row_version     int         NOT NULL DEFAULT 1,
  position        int         NOT NULL DEFAULT 0 CHECK (position >= 0),
  PRIMARY KEY (organization_id, project_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE
);

-- Caché de respuestas de las APIs (antes .cache/data-sources en disco y en la memoria de cada instancia).
-- Sin registro de escritura (UNLOGGED): es un caché, si el servidor se cae se vuelve a pedir. La clave es el SHA-256
-- de la petición y NUNCA cruza organizaciones ni proyectos aunque la petición sea idéntica.
CREATE UNLOGGED TABLE app.data_source_cache (
  organization_id uuid        NOT NULL,
  project_id      uuid        NOT NULL,
  cache_key       bytea       NOT NULL CHECK (length(cache_key) = 32),
  status          int         NOT NULL CHECK (status BETWEEN 100 AND 599),
  content_type    text        NOT NULL,
  body            text        NOT NULL CHECK (octet_length(body) <= 5242880),
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,                                                  -- NULL = persistente
  PRIMARY KEY (organization_id, project_id, cache_key),
  FOREIGN KEY (organization_id, project_id) REFERENCES app.projects (organization_id, id) ON DELETE CASCADE
);
CREATE INDEX data_source_cache_expiry_idx ON app.data_source_cache (expires_at) WHERE expires_at IS NOT NULL;
